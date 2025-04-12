const express = require('express')
const {getCityByName}= require('../controllers/cityController')
const router = express.Router();

router.get('/:cityName', getCityByName);

module.exports = router;