// routes/activitiesRoute.js
const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

// Set up environment variables for API keys
const apiKey = process.env.GEOAPIFY_API_KEY;
const amadeusApiKey = process.env.AMADEUS_API_KEY_1;
const amadeusApiSecret = process.env.AMADEUS_API_SECRET_1;

// Predefined categories to categorize activities
const predefinedCategories = {
  museum: "Cultural", hiking: "Adventure", trekking: "Adventure", restaurant: "Food",
  cuisine: "Food", beach: "Relaxation", sightseeing: "Sightseeing", landmark: "Sightseeing",
  shopping: "Shopping", spa: "Wellness", nightlife: "Entertainment",
};

// Route to fetch activities based on city name
router.get('/activities', async (req, res) => {
  const { city } = req.query; // Get city from query params
  console.log("eq.query:",req.query)
  console.log("city: ",city)
  if (!city) {
    return res.status(400).json({ error: 'City is required' });
  }

  try {
    // Step 1: Fetch location data using Geoapify API
    const geoApiUrl = `https://api.geoapify.com/v1/geocode/search?text=${city}&apiKey=${apiKey}`;
    const geoResponse = await fetch(geoApiUrl);
    const geoData = await geoResponse.json();

    if (geoData.features.length === 0) {
      return res.status(404).json({ error: 'City not found' });
    }

    const { lat, lon } = geoData.features[0].properties;

    // Step 2: Fetch Amadeus API token
    const tokenResponse = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=client_credentials&client_id=${amadeusApiKey}&client_secret=${amadeusApiSecret}`,
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return res.status(500).json({ error: 'Failed to get access token from Amadeus' });
    }

    // Step 3: Fetch activities from Amadeus API
    const radius = 50;
    const amadeusApiUrl = `https://test.api.amadeus.com/v1/shopping/activities?latitude=${lat}&longitude=${lon}&radius=${radius}`;
    
    const activitiesResponse = await fetch(amadeusApiUrl, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const activitiesData = await activitiesResponse.json();
    // console.log("activ_data: ",activitiesData)

    if (!activitiesData.data || activitiesData.data.length === 0) {
      return res.status(404).json({ error: 'No activities found' });
    }

    // Step 4: Categorize activities based on predefined categories
    const categorizedActivities = categorizeActivities(activitiesData.data);
    console.log("char_act:",categorizedActivities)

    // Return the categorized activities as a response
    //return res.json(categorizedActivities);
    return res.json(activitiesData.data)

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Function to categorize activities based on predefined categories
const categorizeActivities = (activities) => {
  let categoryCount = {};
  activities.forEach((activity) => {
    let category = categorizeActivity(activity);
    categoryCount[category] = (categoryCount[category] || 0) + 1;
  });
  return categoryCount;
};

// Function to categorize each activity based on title or description
const categorizeActivity = (activity) => {
  const title = activity.name?.toLowerCase() || "";
  const description = activity.description?.toLowerCase() || "";
  for (let keyword in predefinedCategories) {
    if (title.includes(keyword) || description.includes(keyword)) {
      return predefinedCategories[keyword];
    }
  }
  return "Others";
};

module.exports = router;
