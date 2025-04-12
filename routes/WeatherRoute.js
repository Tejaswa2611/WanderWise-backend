// weatherRoutes.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

// Load environment variables (make sure your API key is stored in .env)
const API_KEY = process.env.OPENWEATHER_API_KEY;

router.get('/weather', async (req, res) => {
  const { sourceCity, destinationCity } = req.query;  // Get cities from query params
  
  if (!sourceCity || !destinationCity) {
    return res.status(400).json({ error: "Please provide both source and destination cities." });
  }

  try {
    const sourceCityWeather = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${sourceCity}&appid=${API_KEY}&units=metric`);
    const destinationCityWeather = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${destinationCity}&appid=${API_KEY}&units=metric`);

    // Process and merge the data
    const sourceData = sourceCityWeather.data.list.map(item => ({
      date: item.dt_txt.split(" ")[0],
      temperature: item.main.temp
    }));
    const destinationData = destinationCityWeather.data.list.map(item => ({
      date: item.dt_txt.split(" ")[0],
      temperature: item.main.temp
    }));

    // Merge the weather data from both cities
    const mergedData = sourceData.map((item, index) => ({
      date: item.date,
      [sourceCity]: item.temperature,
      [destinationCity]: destinationData[index]?.temperature || null
    }));

    res.json(mergedData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch weather data from OpenWeather API' });
  }
});

module.exports = router;
