import React, { useState, useEffect } from 'react';
import { Trophy, Flame, TrendingUp, Zap, Award, Activity } from 'lucide-react';
import { gamificationAPI } from '../../services/gamificationAPI';
import LevelProgress from './LevelProgress';
import AchievementBadge from './AchievementBadge';
import LoadingSkeleton from '../ui/LoadingSkeleton';
import { Link } from 'react-router-dom';
import StreakFireEffect from './StreakFireEffect';
import SparkleEffect from './SparkleEffect';

const GamificationWidget = ({ compact = false }) => {
  const [stats, setStats] = useState(null);
  const [recentAchievements, setRecentAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [statsResponse, achievementsResponse] = await Promise.all([
        gamificationAPI.getMyStats().catch(err => {
          // Return default stats on error
          return { data: null };
        }),
        gamificationAPI.getMyAchievements().catch(err => {
          // Return empty array on error
          return { data: [] };
        })
      ]);
      
      if (statsResponse.data) {
        setStats(statsResponse.data);
      }
      
      // Get 3 most recent achievements
      const achievements = achievementsResponse.data || [];
      setRecentAchievements(achievements.slice(0, 3));
    } catch (error) {
      // Silently handle errors - don't spam console
      console.error('Error fetching gamification stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton type="card" />;
  }

  if (!stats) {
    return null;
  }

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 border-2 border-yellow-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-2 rounded-full">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-800">Level {stats.points.level}</p>
              <p className="text-sm text-gray-600">{stats.points.total} mata</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Link
              to="/account"
              className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
            >
              Lihat semua →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 relative">
      <SparkleEffect trigger={true} duration={5000} count={5} />
      {/* Level Progress */}
      <LevelProgress
        level={stats.points.level}
        xp={stats.points.xp}
        pointsToNextLevel={stats.points.pointsToNextLevel}
        progress={stats.points.progress}
      />

      {/* Streaks */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <span>Streak</span>
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {stats.streaks.attendance && (
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200 relative overflow-hidden">
              <SparkleEffect trigger={stats.streaks.attendance.current > 0} duration={3000} count={3} />
              <p className="text-sm text-gray-600 mb-1">Kehadiran</p>
              <div className="flex items-center space-x-2">
                <StreakFireEffect streakCount={stats.streaks.attendance.current} size="lg" />
                <p className="text-2xl font-bold text-orange-600">
                  {stats.streaks.attendance.current}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Terpanjang: {stats.streaks.attendance.longest}
              </p>
            </div>
          )}
          {stats.streaks.login && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 relative overflow-hidden">
              <SparkleEffect trigger={stats.streaks.login.current > 0} duration={3000} count={3} />
              <p className="text-sm text-gray-600 mb-1">Log Masuk</p>
              <div className="flex items-center space-x-2">
                <StreakFireEffect streakCount={stats.streaks.login.current} size="lg" />
                <p className="text-2xl font-bold text-blue-600">
                  {stats.streaks.login.current}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Terpanjang: {stats.streaks.login.longest}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
              <Award className="w-5 h-5 text-yellow-500" />
              <span>Pencapaian Terkini</span>
            </h3>
            <Link
              to="/account"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Lihat semua →
            </Link>
          </div>
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {recentAchievements.map((achievement) => (
              <div key={achievement.id} className="flex-shrink-0">
                <AchievementBadge achievement={achievement} size="md" unlocked={true} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center border border-blue-200">
          <Zap className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-800">{stats.points.total}</p>
          <p className="text-xs text-blue-600">Total Mata</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center border border-purple-200">
          <TrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-purple-800">{stats.achievementCount}</p>
          <p className="text-xs text-purple-600">Pencapaian</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center border border-green-200">
          <Trophy className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-800">{stats.points.level}</p>
          <p className="text-xs text-green-600">Level</p>
        </div>
      </div>
    </div>
  );
};

export default GamificationWidget;

