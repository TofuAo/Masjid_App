import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp, Crown } from 'lucide-react';
import { gamificationAPI } from '../../services/gamificationAPI';
import LoadingSkeleton from '../ui/LoadingSkeleton';

const Leaderboard = ({ category = 'overall', limit = 10, showCurrentUser = true }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserRank, setCurrentUserRank] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [category, limit]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await gamificationAPI.getLeaderboard({ category, limit });
      setLeaderboard(response.data || []);
      
      // Get current user rank
      if (showCurrentUser) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const userIndex = response.data.findIndex(entry => entry.userIc === user.ic);
          if (userIndex !== -1) {
            setCurrentUserRank({
              rank: userIndex + 1,
              ...response.data[userIndex]
            });
          }
        }
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-600" />;
    if (rank === 3) return <Award className="w-6 h-6 text-orange-600" />;
    return <span className="w-6 h-6 flex items-center justify-center font-bold text-gray-600">{rank}</span>;
  };

  const getRankBgColor = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300';
    if (rank === 2) return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300';
    if (rank === 3) return 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300';
    return 'bg-white border-gray-200';
  };

  if (loading) {
    return <LoadingSkeleton type="card" count={3} />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Gagal memuatkan leaderboard</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <span>Papan Pendahulu</span>
        </h3>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <TrendingUp className="w-4 h-4" />
          <span className="capitalize">{category}</span>
        </div>
      </div>

      <div className="space-y-2">
        {leaderboard.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Tiada data leaderboard buat masa ini</p>
          </div>
        ) : (
          leaderboard.map((entry, index) => (
            <div
              key={entry.userIc}
              className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${getRankBgColor(entry.rank)} ${
                currentUserRank?.userIc === entry.userIc ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-center space-x-4 flex-1">
                <div className="flex-shrink-0">
                  {getRankIcon(entry.rank)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-semibold text-gray-800">{entry.name}</p>
                    {currentUserRank?.userIc === entry.userIc && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                        Anda
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                    <span>Level {entry.level}</span>
                    <span className="flex items-center space-x-1">
                      <span>⭐</span>
                      <span>{entry.totalPoints.toLocaleString()} mata</span>
                    </span>
                  </div>
                </div>
              </div>
              {entry.rank <= 3 && (
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                    entry.rank === 1 ? 'bg-yellow-500' :
                    entry.rank === 2 ? 'bg-gray-400' :
                    'bg-orange-600'
                  }`}>
                    {entry.rank}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {currentUserRank && !leaderboard.some(entry => entry.userIc === currentUserRank.userIc) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className={`flex items-center justify-between p-4 rounded-lg border-2 bg-blue-50 border-blue-300`}>
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex-shrink-0">
                <span className="w-6 h-6 flex items-center justify-center font-bold text-blue-600">
                  {currentUserRank.rank}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <p className="font-semibold text-gray-800">{currentUserRank.name}</p>
                  <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                    Anda
                  </span>
                </div>
                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                  <span>Level {currentUserRank.level}</span>
                  <span className="flex items-center space-x-1">
                    <span>⭐</span>
                    <span>{currentUserRank.totalPoints.toLocaleString()} mata</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;

