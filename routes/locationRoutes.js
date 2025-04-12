const express = require('express');
const router = express.Router();
const locationController=require('../controllers/locationController')
const {shareLocation}=require('../controllers/locationController')
// Share location
router.post('/share', shareLocation);

module.exports = router;