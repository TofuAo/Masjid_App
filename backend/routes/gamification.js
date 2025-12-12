import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getMyStats,
  getLeaderboardData,
  getAvailableAchievements,
  getMyAchievements,
  getPointsHistory,
  markAchievementNotified
} from '../controllers/gamificationController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get current user's stats
router.get('/stats', getMyStats);

// Get leaderboard
router.get('/leaderboard', getLeaderboardData);

// Get all available achievements
router.get('/achievements', getAvailableAchievements);

// Get current user's achievements
router.get('/my-achievements', getMyAchievements);

// Get points history
router.get('/points-history', getPointsHistory);

// Mark achievement as notified
router.post('/achievements/notify', markAchievementNotified);

export default router;

