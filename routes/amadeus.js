const express = require('express');
const router = express.Router();
const AmadeusController = require('../controllers/amadeus');

router.get('/hotels/:cityCode', AmadeusController.getHotels);

module.exports = router;