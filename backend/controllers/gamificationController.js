import { 
  getUserStats, 
  getLeaderboard, 
  checkAchievements,
  updateStreak,
  addPoints 
} from '../services/gamificationService.js';
import { pool } from '../config/database.js';

/**
 * Get current user's gamification stats
 */
export const getMyStats = async (req, res) => {
  try {
    const userIc = req.user.ic;
    const stats = await getUserStats(userIc);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get my stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats'
    });
  }
};

/**
 * Get leaderboard
 */
export const getLeaderboardData = async (req, res) => {
  try {
    const { category = 'overall', limit = 10 } = req.query;
    const periodStart = req.query.period_start || null;
    const periodEnd = req.query.period_end || null;

    const leaderboard = await getLeaderboard(category, parseInt(limit) || 10, periodStart, periodEnd);
    
    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all available achievements
 */
export const getAvailableAchievements = async (req, res) => {
  try {
    const userIc = req.user?.ic || null;

    let query = `
      SELECT 
        a.*,
        CASE WHEN ua.user_ic IS NOT NULL THEN TRUE ELSE FALSE END as unlocked,
        ua.unlocked_at
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id ${userIc ? 'AND ua.user_ic = ?' : 'AND FALSE'}
      WHERE a.is_active = TRUE
      ORDER BY a.category, a.requirement_value ASC
    `;

    const params = userIc ? [userIc] : [];
    const [achievements] = await pool.execute(query, params);

    res.json({
      success: true,
      data: achievements
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch achievements'
    });
  }
};

/**
 * Get user's achievements
 */
export const getMyAchievements = async (req, res) => {
  try {
    const userIc = req.user.ic;

    const [achievements] = await pool.execute(
      `SELECT 
        a.*,
        ua.unlocked_at,
        ua.notified
       FROM user_achievements ua
       JOIN achievements a ON ua.achievement_id = a.id
       WHERE ua.user_ic = ?
       ORDER BY ua.unlocked_at DESC`,
      [userIc]
    );

    res.json({
      success: true,
      data: achievements
    });
  } catch (error) {
    console.error('Get my achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch achievements'
    });
  }
};

/**
 * Get points history
 */
export const getPointsHistory = async (req, res) => {
  try {
    const userIc = req.user.ic;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    // MySQL doesn't accept placeholders for LIMIT and OFFSET, so we need to use template literals
    // But we sanitize the values first to prevent SQL injection
    const safeLimit = Math.max(1, Math.min(1000, limit)); // Clamp between 1 and 1000
    const safeOffset = Math.max(0, offset); // Ensure non-negative

    const [history] = await pool.execute(
      `SELECT * FROM points_history
       WHERE user_ic = ?
       ORDER BY created_at DESC
       LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      [userIc]
    );

    const [total] = await pool.execute(
      'SELECT COUNT(*) as count FROM points_history WHERE user_ic = ?',
      [userIc]
    );

    res.json({
      success: true,
      data: history,
      total: total[0]?.count || 0
    });
  } catch (error) {
    console.error('Get points history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch points history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Mark achievement as notified
 */
export const markAchievementNotified = async (req, res) => {
  try {
    const userIc = req.user.ic;
    const { achievementId } = req.body;

    await pool.execute(
      'UPDATE user_achievements SET notified = TRUE WHERE user_ic = ? AND achievement_id = ?',
      [userIc, achievementId]
    );

    res.json({
      success: true,
      message: 'Achievement marked as notified'
    });
  } catch (error) {
    console.error('Mark notified error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark as notified'
    });
  }
};

/**
 * Trigger achievement check (internal use)
 */
export const triggerAchievementCheck = async (userIc, achievementType, value, context = {}) => {
  try {
    const unlocked = await checkAchievements(userIc, achievementType, value, context);
    return unlocked;
  } catch (error) {
    console.error('Trigger achievement check error:', error);
    return [];
  }
};

