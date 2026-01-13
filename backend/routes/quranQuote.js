import express from 'express';
import { getDailyQuote, clearQuoteCache } from '../controllers/quranQuoteController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get daily quote (public - accessible to all authenticated users)
router.get('/daily', authenticateToken, getDailyQuote);

// Clear quote cache (admin only)
router.delete('/cache', authenticateToken, clearQuoteCache);

export default router;
