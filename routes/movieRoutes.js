const express = require("express");
const axios = require("axios");


const router = express.Router();

router.get("/", async (req, res) => {
  const { mood } = req.query;
  console.log("✅ Incoming request to /api/movies");
  console.log("🎭 Mood received:", mood);

  try {
    const omdbUrl = `https://www.omdbapi.com/?s=${mood}&apikey=${process.env.OMDB_API_KEY}`;
   
    const response = await axios.get(omdbUrl);

    if (response.data.Response === "True") {
      console.log(`🎬 Found ${response.data.Search.length} movies`);
      res.json(response.data.Search);
    } else {
      console.warn("⚠️ OMDB API returned no results:", response.data.Error);
      res.status(404).json({ message: "No movies found" });
    }
  } catch (error) {
    console.error("❌ Error fetching from OMDB:", error.message);
    res.status(500).json({ message: "Failed to fetch movies" });
  }
});

module.exports = router;
