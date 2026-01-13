import express from 'express';
import { getCurrentWeather, clearWeatherCache } from '../controllers/weatherController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get current weather (public - accessible to all authenticated users)
router.get('/current', authenticateToken, getCurrentWeather);

// Clear weather cache (admin only)
router.delete('/cache', authenticateToken, clearWeatherCache);

export default router;
