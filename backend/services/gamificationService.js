import { pool } from '../config/database.js';

/**
 * Calculate level from experience points
 */
export const calculateLevel = (xp) => {
  // Level formula: level = sqrt(xp / 100)
  // Each level requires more XP than the previous
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  const xpForCurrentLevel = Math.pow(level - 1, 2) * 100;
  const xpForNextLevel = Math.pow(level, 2) * 100;
  const pointsToNextLevel = xpForNextLevel - xp;
  
  return {
    level: Math.max(1, level),
    xpForCurrentLevel,
    xpForNextLevel,
    pointsToNextLevel: Math.max(0, pointsToNextLevel),
    progress: xp > 0 ? ((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100 : 0
  };
};

/**
 * Add points to user and update level
 */
export const addPoints = async (userIc, points, reason, sourceType = null, sourceId = null) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // Get or create user_points record
    const [existing] = await connection.execute(
      'SELECT * FROM user_points WHERE user_ic = ?',
      [userIc]
    );

    let currentXP = 0;
    if (existing.length > 0) {
      currentXP = existing[0].experience_points;
    } else {
      await connection.execute(
        'INSERT INTO user_points (user_ic, total_points, experience_points, current_level) VALUES (?, ?, ?, ?)',
        [userIc, 0, 0, 1]
      );
    }

    const newXP = currentXP + points;
    const levelInfo = calculateLevel(newXP);

    // Update user_points
    await connection.execute(
      `UPDATE user_points 
       SET total_points = total_points + ?, 
           experience_points = ?,
           current_level = ?,
           points_to_next_level = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_ic = ?`,
      [points, newXP, levelInfo.level, levelInfo.pointsToNextLevel, userIc]
    );

    // Log points history
    await connection.execute(
      `INSERT INTO points_history (user_ic, points, reason, source_type, source_id)
       VALUES (?, ?, ?, ?, ?)`,
      [userIc, points, reason, sourceType, sourceId]
    );

    await connection.commit();

    // Check if level up
    const leveledUp = existing.length > 0 && levelInfo.level > existing[0].current_level;

    return {
      success: true,
      newTotalPoints: (existing.length > 0 ? existing[0].total_points : 0) + points,
      newXP,
      newLevel: levelInfo.level,
      pointsToNextLevel: levelInfo.pointsToNextLevel,
      progress: levelInfo.progress,
      leveledUp,
      previousLevel: existing.length > 0 ? existing[0].current_level : 1
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Update user streak
 */
export const updateStreak = async (userIc, streakType, activityDate = null) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const date = activityDate || new Date().toISOString().split('T')[0];
    
    // Get existing streak
    const [existing] = await connection.execute(
      'SELECT * FROM user_streaks WHERE user_ic = ? AND streak_type = ?',
      [userIc, streakType]
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let lastActivityDate = null;

    if (existing.length > 0) {
      currentStreak = existing[0].current_streak || 0;
      longestStreak = existing[0].longest_streak || 0;
      lastActivityDate = existing[0].last_activity_date;
    }

    // Check if streak continues or breaks
    let newStreak = 1;
    if (lastActivityDate) {
      const lastDate = new Date(lastActivityDate);
      const currentDate = new Date(date);
      const daysDiff = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        // Continue streak
        newStreak = currentStreak + 1;
      } else if (daysDiff === 0) {
        // Same day, don't update
        newStreak = currentStreak;
      } else {
        // Streak broken, start over
        newStreak = 1;
      }
    }

    const newLongestStreak = Math.max(longestStreak, newStreak);

    if (existing.length > 0) {
      await connection.execute(
        `UPDATE user_streaks 
         SET current_streak = ?,
             longest_streak = ?,
             last_activity_date = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_ic = ? AND streak_type = ?`,
        [newStreak, newLongestStreak, date, userIc, streakType]
      );
    } else {
      await connection.execute(
        `INSERT INTO user_streaks (user_ic, streak_type, current_streak, longest_streak, last_activity_date)
         VALUES (?, ?, ?, ?, ?)`,
        [userIc, streakType, newStreak, newLongestStreak, date]
      );
    }

    await connection.commit();

    return {
      success: true,
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      isNewStreak: newStreak === 1 && currentStreak > 0,
      streakMaintained: newStreak > currentStreak
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Check and unlock achievements
 */
export const checkAchievements = async (userIc, achievementType, value, context = {}) => {
  const connection = await pool.getConnection();
  try {
    // Get active achievements that match the type
    const [achievements] = await connection.execute(
      `SELECT * FROM achievements 
       WHERE is_active = TRUE 
       AND requirement_type = ?
       AND ? >= requirement_value
       ORDER BY requirement_value DESC`,
      [achievementType, value]
    );

    const unlocked = [];

    for (const achievement of achievements) {
      // Check if already unlocked
      const [existing] = await connection.execute(
        'SELECT id FROM user_achievements WHERE user_ic = ? AND achievement_id = ?',
        [userIc, achievement.id]
      );

      if (existing.length === 0) {
        // Unlock achievement
        await connection.execute(
          'INSERT INTO user_achievements (user_ic, achievement_id) VALUES (?, ?)',
          [userIc, achievement.id]
        );

        // Award points
        if (achievement.points_reward > 0) {
          await addPoints(
            userIc,
            achievement.points_reward,
            `Pencapaian: ${achievement.name}`,
            'achievement',
            achievement.id
          );
        }

        unlocked.push(achievement);
      }
    }

    return unlocked;
  } finally {
    connection.release();
  }
};

/**
 * Get user gamification stats
 */
export const getUserStats = async (userIc) => {
  try {
    // Get points and level
    const [pointsData] = await pool.execute(
      'SELECT * FROM user_points WHERE user_ic = ?',
      [userIc]
    );

    // Get streaks
    const [streaks] = await pool.execute(
      'SELECT * FROM user_streaks WHERE user_ic = ?',
      [userIc]
    );

    // Get achievements
    const [achievements] = await pool.execute(
      `SELECT a.*, ua.unlocked_at, ua.notified
       FROM user_achievements ua
       JOIN achievements a ON ua.achievement_id = a.id
       WHERE ua.user_ic = ?
       ORDER BY ua.unlocked_at DESC`,
      [userIc]
    );

    // Get recent points history
    const [history] = await pool.execute(
      `SELECT * FROM points_history
       WHERE user_ic = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [userIc]
    );

    const points = pointsData.length > 0 ? pointsData[0] : {
      total_points: 0,
      experience_points: 0,
      current_level: 1,
      points_to_next_level: 100
    };

    const levelInfo = calculateLevel(points.experience_points);

    return {
      points: {
        total: points.total_points,
        xp: points.experience_points,
        level: levelInfo.level,
        pointsToNextLevel: levelInfo.pointsToNextLevel,
        progress: levelInfo.progress
      },
      streaks: streaks.reduce((acc, streak) => {
        acc[streak.streak_type] = {
          current: streak.current_streak,
          longest: streak.longest_streak,
          lastActivity: streak.last_activity_date
        };
        return acc;
      }, {}),
      achievements: achievements,
      achievementCount: achievements.length,
      recentHistory: history
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get leaderboard
 */
export const getLeaderboard = async (category = 'overall', limit = 10, periodStart = null, periodEnd = null) => {
  try {
    // Sanitize limit to prevent SQL injection and ensure reasonable bounds
    const safeLimit = Math.max(1, Math.min(100, parseInt(limit) || 10));

    // Build query parts
    // Note: Removed ROW_NUMBER() window function as it may cause issues with some MySQL versions
    // We'll calculate rank in JavaScript instead
    let query = `
      SELECT 
        up.user_ic,
        u.nama,
        up.total_points,
        up.current_level,
        up.experience_points
      FROM user_points up
      JOIN users u ON up.user_ic = u.ic
      WHERE u.role = 'student'
    `;

    const params = [];

    if (category === 'monthly' && periodStart && periodEnd) {
      query += `
        AND EXISTS (
          SELECT 1 FROM points_history ph
          WHERE ph.user_ic = up.user_ic
          AND DATE(ph.created_at) BETWEEN ? AND ?
        )
      `;
      params.push(periodStart, periodEnd);
    }

    // MySQL doesn't accept placeholders for LIMIT, so we use template literal with sanitized value
    query += ` ORDER BY up.total_points DESC, up.experience_points DESC LIMIT ${safeLimit}`;

    // Use execute() - it works with template literals when params array is provided correctly
    // If params is empty, we can still use execute() with empty array
    const [leaderboard] = await pool.execute(query, params);

    return leaderboard.map((row, index) => ({
      rank: index + 1,
      userIc: row.user_ic,
      name: row.nama,
      totalPoints: row.total_points || 0,
      level: row.current_level || 1,
      xp: row.experience_points || 0
    }));
  } catch (error) {
    console.error('Get leaderboard service error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    console.error('Query params:', { category, limit, periodStart, periodEnd });
    throw error;
  }
};

