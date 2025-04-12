const City = require('../models/City');


const router = require('express').Router();
// Get city by name
router.get('/:cityName', async (req, res) => {
  try {
    const city = await City.findOne({ city: req.params.cityName });
    if (!city) {
      return res.status(404).json({ message: 'City not found' });
    }

   return res.json(city);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;