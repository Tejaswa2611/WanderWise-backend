const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();
const City = require('../models/City');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const availableCities = [
  "Delhi", "Bangkok", "London", "Singapore", "Paris", "Dubai", 
  "Kuala Lumpur", "Istanbul", "Antalya", "Shenzhen", "Mumbai",
  "Palma de Mallorca", "Rome", "Tokyo", "Pattaya", "Taipei",
  "Guangzhou", "Prague", "Seoul", "Amsterdam", "Osaka", "Shanghai",
  "Ho Chi Minh City", "Barcelona", "Milan", "Chennai", "Vienna",
  "Johor Bahru", "Jaipur", "Berlin", "Athens", "Madrid", "Riyadh",
  "Florence", "Jerusalem", "Hanoi", "Kolkata", "Bangalore", "Pune"
];

const CONFIG = {
  GENRES: [
    { id: 28, name: 'Action', mood: 'Adrenaline rush' },
    { id: 35, name: 'Comedy', mood: 'Laugh-out-loud fun' },
    { id: 80, name: 'Crime', mood: 'Dark and gripping' },
    { id: 99, name: 'Documentary', mood: 'Informative insight' },
    { id: 878, name: 'Science Fiction', mood: 'Futuristic wonder' },
    { id: 27, name: 'Horror', mood: 'Spine-chilling fear' },
    { id: 9648, name: 'Mystery', mood: 'Twisty suspense' },
    { id: 36, name: 'History', mood: 'Time-traveling tales' },
    { id: 10402, name: 'Music', mood: 'Melodic vibes' },
    { id: 10751, name: 'Family', mood: 'Wholesome bonding' },
    { id: 10752, name: 'War', mood: 'Intense realism' },
    { id: 37, name: 'Western', mood: 'Rugged frontier' },
    { id: 53, name: 'Thriller', mood: 'Edge-of-seat tension' },
    { id: 10770, name: 'TV Movie', mood: 'Televised treats' }
  ]
};

// Helper Functions
const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

const fetchHotelDeals = async () => {
  try {
    const randomCity = availableCities[Math.floor(Math.random() * availableCities.length)];
    const cityWithHotels = await City.findOne({
      city: randomCity,
      hotels: { $exists: true, $not: { $size: 0 } }
    }).lean();
    
    if (!cityWithHotels) {
      throw new Error(`No hotel data found for ${randomCity}`);
    }
    
    return { 
      city: {
        name: cityWithHotels.city,
        country: cityWithHotels.country,
        imageUrl: cityWithHotels.imageUrl
      },
      hotels: cityWithHotels.hotels
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map(hotel => ({
          name: hotel.name || 'Unknown Hotel',
          rating: parseFloat(hotel.rating) || 0,
          price: {
            currency: '₹',
            amount: typeof hotel.price === 'string' ? hotel.price.replace(/[^0-9]/g, '') : 'N/A',
            text: hotel.price || 'Price not available'
          },
          address: hotel.address || '',
          amenities: Array.isArray(hotel.amenities) ? 
            hotel.amenities : 
            (typeof hotel.amenities === 'string' ? 
              hotel.amenities.split('\n') : []),
          imageUrl: hotel.imageUrl
        }))
    };
  } catch (error) {
    console.error('Error fetching hotel deals:', error.message);
    const randomCity = availableCities[Math.floor(Math.random() * availableCities.length)];
    return { 
      city: { name: randomCity, country: '', imageUrl: '' },
      hotels: [] 
    };
  }
};

const fetchMovieRecommendation = async () => {
  try {
    if (!process.env.TMDB_API_KEY) {
      console.warn('TMDB_API_KEY is missing from environment variables');
      return getFallbackMovie();
    }

    const response = await axios.get(`https://api.themoviedb.org/3/movie/popular`, {
      params: {
        api_key: process.env.TMDB_API_KEY,
        language: 'en-US',
        page: 1
      },
      timeout: 8000
    });
    
    return processMovieResponse(response);
  } catch (error) {
    console.error('Error fetching movie recommendation:', error.message);
    return getFallbackMovie();
  }
};

const processMovieResponse = (response) => {
  if (!response.data?.results?.length) {
    throw new Error('No movies found in response');
  }

  const validMovies = response.data.results.filter(movie => 
    movie.title && movie.poster_path && movie.vote_count > 100
  );

  if (!validMovies.length) {
    throw new Error('No valid movies found');
  }

  const movie = getRandomItem(validMovies);
  const primaryGenreId = movie.genre_ids?.[0];
  const genre = CONFIG.GENRES.find(g => g.id === primaryGenreId) || 
               getRandomItem(CONFIG.GENRES);

  return {
    genre,
    movie: {
      title: movie.title,
      poster_path: movie.poster_path,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
      popularity: movie.popularity,
      id: movie.id
    }
  };
};

const getFallbackMovie = () => {
  const fallbackMovies = [
    {
      title: "Chhava",
      vote_average: 7.7,
      release_date: "2025-02-14",
      poster_path: "Backend/screenshots/defaultMoviePoster.jpg",
      vote_count: 1000,
      popularity: 90,
      id: 12345
    }
  ];
  
  return {
    genre: getRandomItem(CONFIG.GENRES),
    movie: getRandomItem(fallbackMovies)
  };
};

const emailTemplates = {
  welcome: (fullName) =>
    `<div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 0; color: #1e293b; border-radius: 10px; overflow: hidden; box-shadow: 0 6px 20px rgba(0,0,0,0.08);">

  <!-- Header with Gradient Teal Background -->
  <div style="background: linear-gradient(135deg, #0f766e, #14b8a6); padding: 36px 24px; text-align: center;">
    <h1 style="color: #ffffff; font-size: 26px; margin: 0;">Welcome to WanderWise, ${fullName}!</h1>
    <p style="color: #e0f2f1; font-size: 16px; margin-top: 10px;">Your passport to unforgettable adventures 🌍</p>
  </div>

  <!-- Main Content -->
  <div style="padding: 28px 24px; background-color: #ffffff;">
    <p style="font-size: 15px; line-height: 1.7; margin-bottom: 20px;">We're so excited to have you join the WanderWise Travel community. Here’s what awaits:</p>

    <ul style="font-size: 15px; line-height: 1.6; padding-left: 20px; margin-bottom: 28px; color: #334155;">
      <li style="margin-bottom: 10px;">🌎 Weekly travel inspiration & hidden gems</li>
      <li style="margin-bottom: 10px;">✈️ Member-only flight and hotel deals</li>
      <li style="margin-bottom: 10px;">📸 Breathtaking destination spotlights</li>
      <li>🎯 Pro travel tips & packing secrets</li>
    </ul>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 36px 0;">
      <a href="${process.env.FRONTEND_URL}" style="background-color: #0f766e; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block; box-shadow: 0 4px 10px rgba(20, 184, 166, 0.2);">
        Start Exploring
      </a>
    </div>

    <p style="font-size: 14px; line-height: 1.6; color: #475569;">Your first adventure-packed newsletter lands in your inbox in 7 days. Until then, happy planning!</p>
  </div>

  <!-- Footer with Soft Teal Background -->
  <div style="background-color: #ccfbf1; padding: 20px 24px; text-align: center; font-size: 12px; color: #334155; border-top: 1px solid #e0f2f1;">
    <p style="margin: 6px 0;">© ${new Date().getFullYear()} WanderWise Travel. All rights reserved.</p>
    <p style="margin: 6px 0;">123 Adventure Lane, Travel City, TC 12345</p>
    <p style="margin-top: 10px;">
      <a href="#" style="color: #0f766e; text-decoration: none;">Privacy Policy</a>
    </p>
  </div>
</div>
`,
    newsletter: async (fullName, screenshotPaths) => {
      try {
        const [hotelData, movieData] = await Promise.all([
          fetchHotelDeals(),
          fetchMovieRecommendation()
        ]);
  
        // Responsive HTML template
        return ` <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @media only screen and (max-width: 600px) {
              .container { width: 100% !important; }
              .header-image { height: 150px !important; }
              .section { padding: 15px !important; }
              .flex-column { flex-direction: column !important; }
              .movie-poster { margin-bottom: 15px !important; width: 100% !important; }
              .hotel-image { width: 100% !important; margin-bottom: 10px !important; }
            }
          </style>
        </head>
        <body style="font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa;">
        
          <!-- Main Container -->
          <div class="container" style="max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 5px 15px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden;">
        
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #0d9488 0%, #10b981 100%); padding: 30px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 26px; font-weight: bold;">🌍 Your Weekly Travel Scoop!</h1>
              <p style="margin-top: 8px; font-size: 16px; opacity: 0.9;">Curated just for you, ${fullName}!</p>
            </div>
        
            <!-- Screenshot Sections -->
            ${screenshotPaths.length > 0 ? `
            <div class="section" style="padding: 25px; border-bottom: 1px solid #eaeaea;">
              <h2 style="font-size: 20px; color: #0f766e; margin-top: 0;">Top Attractions</h2>
              <img src="cid:attractions" style="width: 100%; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-top: 10px;" alt="Top attractions">
            </div>` : ''}
        
            ${screenshotPaths.length > 1 ? `
            <div class="section" style="padding: 25px; border-bottom: 1px solid #eaeaea;">
              <h2 style="font-size: 20px; color: #0f766e; margin-top: 0;">Travel Competitor's Price Comparison</h2>
              <img src="cid:trends" style="width: 100%; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-top: 10px;" alt="Price comparison">
            </div>` : ''}
        
            ${screenshotPaths.length > 2 ? `
            <div class="section" style="padding: 25px; border-bottom: 1px solid #eaeaea;">
              <h2 style="font-size: 20px; color: #0f766e; margin-top: 0;">City Trends</h2>
              <img src="cid:prices" style="width: 100%; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-top: 10px;" alt="City trend Comparison">
            </div>` : ''}
        
            <!-- Featured Destination -->
            ${hotelData.city ? `
            <div class="section" style="padding: 25px; border-bottom: 1px solid #eaeaea; background-color: #f8fafc;">
              <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <div style="flex: 1;">
                  <h2 style="font-size: 20px; color: #0f766e; margin: 0;">✨ Featured Destination</h2>
                  <p style="font-size: 14px; color: #4a5568; margin: 0;">${hotelData.city.name}, ${hotelData.city.country}</p>
                </div>
                ${hotelData.city.imageUrl ? `
                <img src="${hotelData.city.imageUrl}" style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover; margin-left: 15px;">` : ''}
              </div>
              <p style="font-size: 15px; line-height: 1.5; color: #4a5568;">Discover the best experiences in this week's highlighted destination. From hidden gems to must-see attractions, we've got you covered.</p>
            </div>` : ''}
        
            <!-- Hotel Deals -->
            ${hotelData.hotels.length > 0 ? `
            <div class="section" style="padding: 25px; border-bottom: 1px solid #eaeaea;">
              <h2 style="font-size: 20px; color: #0f766e; margin: 0 0 15px;">🏨 Top Hotel Picks in ${hotelData.city.name}</h2>
              ${hotelData.hotels.map((hotel, index) => {
                const rating = parseFloat(hotel.rating) || 0;
                const fullStars = Math.max(0, Math.min(5, Math.floor(rating)));
                const emptyStars = 5 - fullStars;
                const priceText = ('₹ '+hotel.price.text+' per night');
        
                return `
                <div style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                  <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                    ${hotel.imageUrl ? `<img src="${hotel.imageUrl}" class="hotel-image" style="width: 120px; height: 90px; border-radius: 6px; object-fit: cover;">` : ''}
                    <div style="flex: 1; min-width: 200px;">
                      <h3 style="font-size: 16px; margin: 0 0 8px 0; color: #2d3748;">${hotel.name}</h3>
                      <div style="font-size: 14px; color: #f59e0b; margin-bottom: 8px;">Ratings: ${'★'.repeat(fullStars)}${'☆'.repeat(emptyStars)}</div>
                      <p style="margin: 0; font-size: 14px; color: #38a169; font-weight: 500;">${priceText}</p>
                    </div>
                  </div>
                  ${hotel.amenities.length > 0 ? `
                  <div style="margin-top: 12px;">
                    <p style="font-size: 14px; font-weight: 500; color: #4a5568; margin-bottom: 6px;">🛎️ Amenities:</p>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                      ${hotel.amenities.map(a => `<span style="font-size: 12px; background: #edf2f7; padding: 4px 10px; border-radius: 12px; color: #4a5568;">${a}</span>`).join('')}
                    </div>
                  </div>` : ''}
                </div>
                `;
              }).join('')}
            </div>` : ''}
        
            <!-- Movie Recommendation -->
            ${movieData.movie ? `
            <div class="section" style="padding: 25px; background-color: #f0fdfa;">
              <h2 style="font-size: 20px; color: #0f766e; margin: 0 0 15px;">
                🎬 ${movieData.genre.name} Movie Pick: <span style="color: #0f766e;">${movieData.genre.mood}</span>
              </h2>
              <div style="display: flex; gap: 20px; flex-wrap: wrap;" class="flex-column">
                ${movieData.movie.poster_path ? `<img src="https://image.tmdb.org/t/p/w200${movieData.movie.poster_path}" class="movie-poster" style="width: 150px; height: 225px; border-radius: 6px; object-fit: cover; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">` : ''}
                <div style="flex: 1; min-width: 200px;">
                  <h3 style="font-size: 18px; margin: 0 0 8px 0; color: #2d3748;">${movieData.movie.title}</h3>
                  <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px; flex-wrap: wrap;">
                    <span style="font-size: 14px; color: #f59e0b;">★ ${movieData.movie.vote_average?.toFixed(1) || 'N/A'}/10</span>
                    <br/>
                    <span style="font-size: 14px; color: #718096;">📅 ${new Date(movieData.movie.release_date).toLocaleDateString('en-US')}</span>
                  </div>
                  <p style="font-size: 10px; line-height: 1.5; color: #4a5568;">${movieData.movie.overview || 'An exciting film perfect for your current mood!'}</p>
                </div>
              </div>
            </div>` : ''}
        
            <!-- Footer -->
            <div style="padding: 20px; text-align: center; background: linear-gradient(135deg, #0d9488 0%, #10b981 100%); color: white;">
              <p style="margin: 0; font-size: 12px; opacity: 0.8;">© ${new Date().getFullYear()} WanderWise Travel. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
        `;
      } catch (error) {
        console.error("Failed to build newsletter email:", error);
        return `<p style="font-size: 14px; color: red; padding: 20px; font-family: Arial, sans-serif;">Oops! Something went wrong while preparing your email. We're working to fix this!</p>`;
      }
    }
};

const getEmailHeaders = () => ({
  'Reply-To': process.env.EMAIL_REPLY_TO || process.env.EMAIL_USER,
  'List-Unsubscribe': `<mailto:${process.env.EMAIL_UNSUBSCRIBE}>, <${process.env.FRONTEND_URL}/unsubscribe>`,
  'Precedence': 'bulk'
});

const sendWelcomeEmail = async (email, fullName) => {
  try {
    const unsubscribeLink = `${process.env.FRONTEND_URL}`;
    
    const mailOptions = {
      from: `"WonderWise Travel" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Welcome to WonderWise Travel Insights, ${fullName}!`,
      html: emailTemplates.welcome(fullName, unsubscribeLink),
      headers: getEmailHeaders()
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error(`Error sending welcome email to ${email}:`, error);
    throw error;
  }
};

const sendNewsletterEmail = async (email, fullName, screenshotPaths = []) => {
  try {
    const unsubscribeLink = `${process.env.FRONTEND_URL}`;
    
    // Generate the HTML content
    const htmlContent = await emailTemplates.newsletter(
      fullName, 
      unsubscribeLink, 
      screenshotPaths
    );

    // Prepare attachments
    const attachments = screenshotPaths
      .filter((path, index) => fs.existsSync(path) && index < 3) // Only first 3 screenshots
      .map((path, index) => {
        const cids = ['attractions', 'trends', 'prices'];
        return {
          filename: `screenshot-${index}.png`,
          path: path,
          cid: cids[index] || `screenshot-${index}`,
          contentType: 'image/png'
        };
      });

    const mailOptions = {
      from: `"WanderWise Travel" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `${fullName}, Your Weekly Travel Inspiration is Here!`,
      html: htmlContent,
      attachments: attachments,
      headers: getEmailHeaders()
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error(`Error sending to ${email}:`, error.message);
    throw error;
  }
};




async function getCityFromCoordinates(lat, lon) {
  try {
    
    const osmResponse = await axios.get(`${process.env.NOMINATIM_API}`, {
      params: {
        lat,
        lon,
        format: 'json',
        addressdetails: 1,
        zoom: 18
      },
      headers: {
        'User-Agent': 'WanderWiseApp/1.0 (wanderwiseteam1@gmail.com)'
      },
      timeout: 3000
    });

    if (osmResponse.data?.address) {
      const { city, town, village, hamlet, county, state } = osmResponse.data.address;
      return city || town || village || hamlet || county || state || 'Nearby Location';
    }

    // Fallback to Google's reverse geocoding 
    const googleResponse = await axios.get(`${process.env.GOOGLE_RESPONSE_API}?latlng=${lat},${lon}`);
    if (googleResponse.data?.results?.[0]?.address_components) {
      const locality = googleResponse.data.results[0].address_components.find(
        comp => comp.types.includes('locality')
      );
      if (locality) return locality.long_name;
    }

    // Final fallback - find nearest named feature
    const nearbyResponse = await axios.get(`${process.env.NEARBY_RESPONSE}?locations=${lat},${lon}`);
    if (nearbyResponse.data?.results?.[0]?.name) {
      return nearbyResponse.data.results[0].name;
    }

    return `Location at ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return `Location at ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }
}
const sendLocationEmail = async (recipient, coordinates, sharerName) => {
  try {
    // Validate coordinates first
    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      throw new Error('Invalid coordinates format');
    }

    const [lon, lat] = coordinates.map(Number);
    if (isNaN(lat) || isNaN(lon)) {
      throw new Error('Coordinates must be numbers');
    }

    // Get city name with multiple fallbacks
    let city = await getCityFromCoordinates(lat, lon);
    
    // Ensure we never send "Unknown Location"
    if (city.includes('Unknown') || city.includes('Location at')) {
      // Try broader search
      city = await getCityFromCoordinates(lat, lon, true);
    }

    const mapLink = `${process.env.MAP_LINK}/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`;
    const mailOptions = {
      from: `"Location Sharing" <${process.env.EMAIL_USER}>`,
      to: recipient,
      subject: `${sharerName} shared a location with you`,
      html: `
      <div style="font-family: 'Segoe UI', Roboto, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb;">
        <!-- Header -->
        <div style="background: #0f766e; padding: 24px 20px; text-align: center;">
          <h1 style="margin: 0; color: white; font-size: 20px; font-weight: 600; letter-spacing: 0.5px;">📍 Location Shared with You</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 28px 24px;">
          <!-- Sharer Info -->
          <div style="margin-bottom: 24px;">
            <p style="margin: 0 0 2px 0; color: #64748b; font-size: 13px; font-weight: 500;">SHARED BY</p>
            <p style="margin: 0; color: #0f766e; font-weight: 600; font-size: 17px; letter-spacing: 0.2px;">${sharerName}</p>
          </div>
          
          <!-- Location Card -->
          <div style="background: #f8fafc; border-radius: 10px; padding: 20px; margin-bottom: 24px; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
            <div style="margin-bottom: 18px;">
              <h3 style="margin: 0 0 6px 0; color: #0f766e; font-size: 18px; font-weight: 600;">${city}</h3>
              <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.4;">Exact location coordinates below</p>
            </div>
            
            <!-- Coordinates -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
              <div style="background: white; border-radius: 6px; padding: 12px; border: 1px solid #e2e8f0;">
                <p style="margin: 0 0 4px 0; color: #64748b; font-size: 12px; font-weight: 500;">LATITUDE</p>
                <p style="margin: 0; color: #0f766e; font-weight: 600; font-size: 15px; font-family: 'Roboto Mono', monospace;">${lat.toFixed(6)}</p>
              </div>
              <div style="background: white; border-radius: 6px; padding: 12px; border: 1px solid #e2e8f0;">
                <p style="margin: 0 0 4px 0; color: #64748b; font-size: 12px; font-weight: 500;">LONGITUDE</p>
                <p style="margin: 0; color: #0f766e; font-weight: 600; font-size: 15px; font-family: 'Roboto Mono', monospace;">${lon.toFixed(6)}</p>
              </div>
            </div>
            
            <!-- Map Buttons - Stacked Vertically -->
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <a href="https://www.google.com/maps?q=${lat},${lon}" 
                 style="text-align: center; padding: 12px; background: #14b8a6; color: white; 
                        text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;
                        transition: all 0.2s ease;">
                Open in Google Maps
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 16px;">
            <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.5;">
              This location was shared via WanderWise<br>
              <span style="font-size: 11px;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </p>
          </div>
        </div>
      </div>
      `,
      text: `${sharerName} shared their location:\n\n${city}\nCoordinates: ${lat}, ${lon}\n\nOpen in maps:\n- OpenStreetMap: ${mapLink}\n- Google Maps: https://www.google.com/maps?q=${lat},${lon}`
    };

    await transporter.sendMail(mailOptions);
    return { success: true, city };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error(`Could not send location: ${error.message}`);
  }
};

module.exports = { 
  sendWelcomeEmail, 
  sendNewsletterEmail,
  sendLocationEmail
};