const axios = require('axios');
const TMDB_API_KEY = process.env.TMDB_API_KEY;

class TMDBController {
  static async getMovies(req, res) {
    try {
      const { category } = req.params;
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/${category}?api_key=${TMDB_API_KEY}&language=en-US&page=1`
      );
      res.json(response.data.results.slice(0, 10));
    } catch (err) {
      console.error('TMDB Fetch Error:', err.message);
      res.status(500).json({ error: 'Failed to fetch movies' });
    }
  }
}

module.exports = TMDBController;