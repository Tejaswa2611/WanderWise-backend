const express = require('express');
const router = express.Router();
const TMDBController = require('../controllers/tmdb');

router.get('/movies/:category', TMDBController.getMovies);

module.exports = router;