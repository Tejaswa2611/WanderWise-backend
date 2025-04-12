const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

// Connect to GTFS SQLite DB
const db = new sqlite3.Database('./gtfs.db', (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to GTFS database');
  }
});

// Route: GET all wheelchair accessible stops
router.get('/wheelchair-stops', (req, res) => {
    const accessibleQuery = `
      SELECT stop_id, stop_name, stop_lat, stop_lon
      FROM stops
      WHERE wheelchair_boarding = 1
    `;
    const totalQuery = `SELECT COUNT(*) as total FROM stops`;
  
    db.all(accessibleQuery, (err, accessibleStops) => {
      if (err) {
        console.error('Error fetching accessible stops:', err.message);
        return res.status(500).json({ error: 'Failed to fetch accessible stops' });
      }
  
      db.get(totalQuery, (err, result) => {
        if (err) {
          console.error('Error fetching total stop count:', err.message);
          return res.status(500).json({ error: 'Failed to fetch total stop count' });
        }
  
        res.json({
          accessibleStops,
          totalStops: result.total,
        });
      });
    });
  });
  

module.exports = router;
