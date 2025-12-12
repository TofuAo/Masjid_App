import api from './api.js';

// Re-export default api for convenience
export { default } from './api.js';

export const gamificationAPI = {
  getMyStats: () => api.get('/gamification/stats'),
  getLeaderboard: (params) => api.get('/gamification/leaderboard', { params }),
  getAvailableAchievements: () => api.get('/gamification/achievements'),
  getMyAchievements: () => api.get('/gamification/my-achievements'),
  markAchievementNotified: (achievementId) => 
    api.post('/gamification/achievements/notify', { achievementId }),
  getPointsHistory: (params) => api.get('/gamification/points-history', { params }),
};

