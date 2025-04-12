const mongoose = require('mongoose');

const newsletterLogSchema = new mongoose.Schema({
  sentAt: {
    type: Date,
    default: Date.now,
  },
  recipientsCount: Number,
  screenshotPath: String,
});

module.exports = mongoose.model('NewsletterLog', newsletterLogSchema);