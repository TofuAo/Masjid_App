import React, { useState, useEffect, useRef } from 'react';
import { useGamificationEffects } from './GamificationEffectsProvider';
import { gamificationAPI } from '../../services/gamificationAPI';
import PointsEarnedAnimation from './PointsEarnedAnimation';
import AchievementNotification from './AchievementNotification';
import LevelUpCelebration from './LevelUpCelebration';

const GamificationLiveTracker = () => {
  const { showLevelUp, showPointsEarned, showAchievement } = useGamificationEffects();
  const [previousStats, setPreviousStats] = useState(null);
  const [currentStats, setCurrentStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const intervalRef = useRef(null);

  const [errorCount, setErrorCount] = useState(0);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Initial fetch
    fetchStats();

    // Poll for changes every 30 seconds (reduced frequency)
    intervalRef.current = setInterval(fetchStats, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const fetchStats = async () => {
    try {
      const response = await gamificationAPI.getMyStats();
      const stats = response.data;

      // Reset error count on success
      setErrorCount(0);

      if (isInitialMount.current) {
        isInitialMount.current = false;
        setCurrentStats(stats);
        return;
      }

      if (previousStats && currentStats) {
        // Check for changes
        checkForChanges(currentStats, stats);
      }

      setPreviousStats(currentStats);
      setCurrentStats(stats);
    } catch (error) {
      const newErrorCount = errorCount + 1;
      setErrorCount(newErrorCount);
      
      // Only log errors occasionally to prevent spam
      if (newErrorCount === 1 || newErrorCount % 10 === 0) {
        console.error(`Error fetching gamification stats (attempt ${newErrorCount}):`, error);
      }
      
      // Stop polling on rate limit errors or after too many errors
      if (error?.status === 429 || newErrorCount >= 10) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          if (error?.status === 429) {
            console.warn('Stopped polling gamification stats due to rate limiting');
          } else {
            console.warn('Stopped polling gamification stats due to repeated errors');
          }
        }
      }
    }
  };

  const checkForChanges = (oldStats, newStats) => {
    // Check for level up
    if (newStats.points.level > oldStats.points.level) {
      showLevelUp(newStats.points.level);
    }

    // Check for new achievements
    if (newStats.achievements.length > oldStats.achievements.length) {
      const newAchievements = newStats.achievements.filter(
        ach => !oldStats.achievements.some(oldAch => oldAch.id === ach.id)
      );
      newAchievements.forEach(achievement => {
        showAchievement(achievement);
      });
    }

    // Check for points earned (from recent history)
    if (newStats.recentHistory && newStats.recentHistory.length > 0) {
      const latestPoints = newStats.recentHistory[0];
      if (latestPoints && (!oldStats.recentHistory || oldStats.recentHistory[0]?.id !== latestPoints.id)) {
        showPointsEarned(
          latestPoints.points,
          latestPoints.reason,
          { x: 50, y: 50 }
        );
      }
    }

    // Check for streak updates
    if (newStats.streaks.attendance?.current > oldStats.streaks.attendance?.current) {
      // Streak increased
      const streakIncrease = newStats.streaks.attendance.current - (oldStats.streaks.attendance?.current || 0);
      if (streakIncrease > 0) {
        showPointsEarned(
          0,
          `Streak kehadiran: ${newStats.streaks.attendance.current} hari! 🔥`,
          { x: 50, y: 30 }
        );
      }
    }
  };

  return null; // This component only handles side effects
};

export default GamificationLiveTracker;

