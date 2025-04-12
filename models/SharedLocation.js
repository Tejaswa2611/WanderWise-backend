const mongoose = require('mongoose');

const SharedLocationSchema = new mongoose.Schema({
  sharerId: {
    type: String,
    required: true
  },
  sharerName: {
    type: String,
    required: true
  },
  recipient: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true
  },
  coordinates: {
    type: [Number],
    required: true
  },
  sharedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // Expires in 24 hours
  }
});

// Auto-delete expired locations
SharedLocationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('SharedLocation', SharedLocationSchema);