import express from 'express';
import { getStops } from 'gtfs';

const router = express.Router();

router.get('/stops', async (req, res) => {
  try {
    const { wheelchair_boarding } = req.query;
    const stops = await getStops({ wheelchair_boarding });
    res.json(stops);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stops' });
  }
});

export default router;
