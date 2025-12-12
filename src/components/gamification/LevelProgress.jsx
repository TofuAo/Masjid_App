import React, { useState, useEffect } from 'react';
import { TrendingUp, Star, Zap } from 'lucide-react';
import SparkleEffect from './SparkleEffect';

const LevelProgress = ({ level, xp, pointsToNextLevel, progress, onLevelUp = null }) => {
  const getLevelColor = (level) => {
    if (level >= 20) return 'from-purple-500 to-pink-500';
    if (level >= 10) return 'from-yellow-500 to-orange-500';
    if (level >= 5) return 'from-blue-500 to-indigo-500';
    return 'from-green-500 to-emerald-500';
  };

  const getLevelTitle = (level) => {
    if (level >= 20) return 'Master';
    if (level >= 15) return 'Expert';
    if (level >= 10) return 'Advanced';
    if (level >= 5) return 'Intermediate';
    return 'Beginner';
  };

  const [showSparkles, setShowSparkles] = useState(false);

  useEffect(() => {
    if (progress > 0) {
      setShowSparkles(true);
      const timer = setTimeout(() => setShowSparkles(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100 relative overflow-hidden">
      {progress > 90 && <SparkleEffect trigger={showSparkles} duration={2000} count={8} />}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`bg-gradient-to-br ${getLevelColor(level)} p-3 rounded-full`}>
            <Star className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Level {level}</h3>
            <p className="text-sm text-gray-600">{getLevelTitle(level)}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-1 text-yellow-600">
            <Zap className="w-5 h-5" />
            <span className="text-2xl font-bold">{xp.toLocaleString()}</span>
          </div>
          <p className="text-xs text-gray-500">XP</p>
        </div>
      </div>

      <div className="mb-2">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Progress ke Level {level + 1}</span>
          <span className="font-semibold text-gray-800">
            {pointsToNextLevel.toLocaleString()} XP lagi
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`bg-gradient-to-r ${getLevelColor(level)} h-full transition-all duration-500 ease-out rounded-full flex items-center justify-end pr-2 relative overflow-hidden`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            >
              {progress > 90 && (
                <div className="absolute inset-0 bg-white opacity-20 animate-shimmer" />
              )}
              {progress > 15 && (
                <TrendingUp className="w-3 h-3 text-white animate-pulse" />
              )}
              <style>{`
                @keyframes shimmer {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                  animation: shimmer 2s infinite;
                }
              `}</style>
            </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
        <span>XP untuk Level {level}: {Math.pow(level - 1, 2) * 100}</span>
        <span>XP untuk Level {level + 1}: {Math.pow(level, 2) * 100}</span>
      </div>
    </div>
  );
};

export default LevelProgress;

