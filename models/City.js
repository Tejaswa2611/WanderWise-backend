const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  city: { type: String, required: true },
  country: { type: String, required: true },
  image_url: String,
  crime_index: Number,
  safety_index: Number,
  data: Array,
  verdict: String,
  tips: Array,
  hotels: Array
});

module.exports = mongoose.model('City', citySchema);