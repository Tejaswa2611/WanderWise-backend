const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

const apiKey = process.env.GEOAPIFY_API_KEY;

router.get('/location', async (req, res) => {
    const { city } = req.query;
    if (!city) {
        return res.status(400).json({ error: "City is required" });
    }

    try {
        const geoApiUrl = `https://api.geoapify.com/v1/geocode/search?text=${city}&apiKey=${apiKey}`;
        const geoResponse = await fetch(geoApiUrl);
        const geoData = await geoResponse.json();
        
        if (geoData.features.length === 0) {
            return res.status(404).json({ error: 'City not found' });
        }

        const { lat, lon } = geoData.features[0].properties;
        return res.json({ lat, lon });
    } catch (error) {
        console.error('Error fetching location:', error);
        return res.status(500).json({ error: 'Failed to fetch location' });
    }
});

module.exports = router;
