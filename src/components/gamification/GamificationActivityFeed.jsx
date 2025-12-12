import React, { useState, useEffect } from 'react';
import { Trophy, Zap, Flame, Award, TrendingUp, Clock, Coins } from 'lucide-react';
import { gamificationAPI } from '../../services/gamificationAPI';
import LoadingSkeleton from '../ui/LoadingSkeleton';
// Simple date formatter (no external dependency)
const formatDistanceToNow = (date) => {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} hari yang lalu`;
  if (hours > 0) return `${hours} jam yang lalu`;
  if (minutes > 0) return `${minutes} minit yang lalu`;
  return 'Baru sahaja';
};

const GamificationActivityFeed = ({ limit = 20 }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActivityFeed();
    // Refresh every 30 seconds
    const interval = setInterval(fetchActivityFeed, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActivityFeed = async () => {
    try {
      setLoading(true);
      const [statsRes, historyRes] = await Promise.all([
        gamificationAPI.getMyStats(),
        gamificationAPI.getPointsHistory({ limit: 30 })
      ]);

      const stats = statsRes.data;
      const history = historyRes.data || [];

      // Transform history into activity feed
      const feed = history.map((item, index) => ({
        id: item.id || index,
        type: 'points',
        icon: <Coins className="w-5 h-5" />,
        title: `+${item.points} Mata`,
        description: item.reason,
        timestamp: item.created_at,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        sourceType: item.source_type
      }));

      // Add achievement unlocks if available
      if (stats.achievements && stats.achievements.length > 0) {
        const recentAchievements = stats.achievements.slice(0, 5).map(achievement => ({
          id: `achievement-${achievement.id}`,
          type: 'achievement',
          icon: <Award className="w-5 h-5" />,
          title: achievement.name,
          description: achievement.description,
          timestamp: achievement.unlocked_at,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          points: achievement.points_reward
        }));
        feed.push(...recentAchievements);
      }

      // Sort by timestamp (newest first)
      feed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setActivities(feed.slice(0, limit));
    } catch (err) {
      console.error('Error fetching activity feed:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'points':
        return <Coins className="w-5 h-5 text-yellow-600" />;
      case 'achievement':
        return <Award className="w-5 h-5 text-purple-600" />;
      case 'level':
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
      case 'streak':
        return <Flame className="w-5 h-5 text-orange-600" />;
      default:
        return <Trophy className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Baru sahaja';
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Baru sahaja';
    }
  };

  if (loading) {
    return <LoadingSkeleton type="card" count={3} />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Gagal memuatkan aktiviti gamifikasi</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
          <Clock className="w-6 h-6 text-emerald-600" />
          <span>Aktiviti Gamifikasi</span>
        </h3>
        <button
          onClick={fetchActivityFeed}
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          Muat Semula
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Tiada aktiviti gamifikasi buat masa ini</p>
            <p className="text-sm mt-1">Lakukan aktiviti untuk mendapat mata dan pencapaian!</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className={`flex items-start space-x-4 p-4 rounded-lg border-2 ${activity.borderColor} ${activity.bgColor} transition-all hover:shadow-md`}
            >
              <div className={`flex-shrink-0 ${activity.color}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className={`font-semibold ${activity.color} mb-1`}>
                      {activity.title}
                    </h4>
                    <p className="text-sm text-gray-700">{activity.description}</p>
                    {activity.points && (
                      <p className="text-xs text-gray-600 mt-1">
                        +{activity.points} XP diraih
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                    {formatTime(activity.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GamificationActivityFeed;

