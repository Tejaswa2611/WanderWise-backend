const AmadeusService = require('../services/amadeus');

const countries = [
    { name: "Delhi", lat: 28.6139, lon: 77.2090 },
      { name: "Bangalore", lat: 12.9716, lon: 77.5946 },
      { name: "New York", lat: 40.7128, lon: -74.0060 },
      { name: "London", lat: 51.5074, lon: -0.1278 },
      { name: "Tokyo", lat: 35.6895, lon: 139.6917 },
      { name: "Sydney", lat: -33.8688, lon: 151.2093 },
      { name: "Los Angeles", lat: 34.0522, lon: -118.2437 },
      { name: "Chicago", lat: 41.8781, lon: -87.6298 },
      { name: "Toronto", lat: 43.651070, lon: -79.347015 },
      { name: "Dubai", lat: 25.276987, lon: 55.296249 },
      { name: "Singapore", lat: 1.3521, lon: 103.8198 },
      { name: "Bangkok", lat: 13.7563, lon: 100.5018 },
      { name: "Hong Kong", lat: 22.3193, lon: 114.1694 },
      { name: "Moscow", lat: 55.7558, lon: 37.6173 },
      { name: "Rome", lat: 41.9028, lon: 12.4964 },
      { name: "Madrid", lat: 40.4168, lon: -3.7038 },
      { name: "Barcelona", lat: 41.3851, lon: 2.1734 },
      { name: "Istanbul", lat: 41.0082, lon: 28.9784 },
      { name: "Mexico City", lat: 19.4326, lon: -99.1332 },
      { name: "Seoul", lat: 37.5665, lon: 126.9780 },
      { name: "Buenos Aires", lat: -34.6037, lon: -58.3816 },
      { name: "Cape Town", lat: -33.9249, lon: 18.4241 },
      { name: "Hanoi", lat: 21.0285, lon: 105.8544 },
      { name: "Sao Paulo", lat: -23.5505, lon: -46.6333 }
  ];

class AmadeusController {
  static async getHotels(req, res) {
    try {
      const { cityCode } = req.params;
      const hotels = await AmadeusService.getHotelsByCity(cityCode);
      
      const hotelData = hotels
        .map((hotel) => ({
          name: hotel.name,
          rating: hotel.rating || Math.random() * 5,
        }))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 10);

      res.json(hotelData);
    } catch (err) {
      console.error("Hotel Fetch Error:", err.message);
      res.status(500).json({ error: "Failed to fetch hotel data" });
    }
  }

}

module.exports = AmadeusController;