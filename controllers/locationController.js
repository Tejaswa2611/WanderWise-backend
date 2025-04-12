// controllers/locationController.js
const SharedLocation = require('../models/SharedLocation');
const { sendLocationEmail } = require('../services/emailService');

exports.shareLocation = async (req, res) => {
  try {
    const { email, coordinates, city, userId, sharerName } = req.body;

    // Validate input
    const errors = [];
    
    // Email validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Valid email address is required');
    }

    // Sharer name validation
    if (!sharerName || !sharerName.trim()) {
      errors.push('Sharer name is required');
    }

    // Coordinate validation
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      errors.push('Coordinates must be an array of [longitude, latitude]');
    } else {
      const [lon, lat] = coordinates.map(Number);
      if (isNaN(lat)) errors.push('Latitude must be a valid number');
      if (isNaN(lon)) errors.push('Longitude must be a valid number');
      if (lat < -90 || lat > 90) errors.push('Latitude must be between -90 and 90');
      if (lon < -180 || lon > 180) errors.push('Longitude must be between -180 and 180');
    }

    // City validation
    if (!city || typeof city !== 'string' || !city.trim()) {
      errors.push('Valid city name is required');
    }

    // User ID validation
    if (!userId) {
      errors.push('User ID is required');
    }

    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors 
      });
    }

    // Process and save data
    const sharedLocation = new SharedLocation({
      sharerId: userId,
      recipient: email.trim().toLowerCase(),
      city: city.trim(),
      coordinates: coordinates.map(Number),
      sharerName: sharerName.trim(),
      sharedAt: new Date()
    });

    await sharedLocation.save();

    // Send email
    await sendLocationEmail(
      email.trim().toLowerCase(),
      coordinates.map(Number),
      sharerName.trim(),
      city.trim()
    );

    res.status(200).json({
      success: true,
      message: 'Location shared successfully',
      data: {
        recipient: sharedLocation.recipient,
        city: sharedLocation.city,
        coordinates: sharedLocation.coordinates,
        sharedAt: sharedLocation.sharedAt,
        sharerName: sharedLocation.sharerName
      }
    });

  } catch (error) {
    console.error('Error sharing location:', error);
    
    // Handle duplicate shares
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'This location was already shared with this recipient recently'
      });
    }

    res.status(500).json({ 
      error: 'Failed to share location',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};