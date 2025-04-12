const  City =require('../models/City')

// Get city by name
exports.getCityByName = async (req, res) => {
  try {
    const cityName = req.params.cityName;
    const city = await City.findOne({ city: cityName });
    console.log(city)
    if (!city) {
      return res.status(404).json({ message: 'City not found' });
    }

   
    return res.status(200).json(city);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};