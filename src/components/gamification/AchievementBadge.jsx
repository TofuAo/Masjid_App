import React from 'react';
import { 
  Trophy, 
  Medal, 
  Award, 
  Star, 
  Flame, 
  Calendar,
  FileText,
  CreditCard,
  TrendingUp,
  Sparkles,
  Moon,
  LogIn
} from 'lucide-react';

const AchievementBadge = ({ achievement, size = 'md', showLocked = false, unlocked = false }) => {
  const getIcon = (iconName) => {
    const icons = {
      'trophy': Trophy,
      'medal': Medal,
      'award': Award,
      'star': Star,
      'flame': Flame,
      'calendar-check': Calendar,
      'file-text': FileText,
      'credit-card': CreditCard,
      'trending-up': TrendingUp,
      'sparkles': Sparkles,
      'moon': Moon,
      'log-in': LogIn
    };
    const IconComponent = icons[iconName] || Trophy;
    return <IconComponent className="w-full h-full" />;
  };

  const getBadgeColor = (color) => {
    const colors = {
      'platinum': 'from-gray-400 to-gray-600',
      'gold': 'from-yellow-400 to-yellow-600',
      'silver': 'from-gray-300 to-gray-500',
      'bronze': 'from-orange-400 to-orange-600'
    };
    return colors[color] || colors.gold;
  };

  const sizeClasses = {
    sm: 'w-16 h-16 text-2xl',
    md: 'w-24 h-24 text-3xl',
    lg: 'w-32 h-32 text-4xl'
  };

  const isUnlocked = unlocked || achievement.unlocked;

  return (
    <div className="relative inline-block">
      <div
        className={`${sizeClasses[size]} rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
          isUnlocked
            ? `bg-gradient-to-br ${getBadgeColor(achievement.badge_color)} border-white shadow-lg hover:scale-110 cursor-pointer animate-pulse-subtle`
            : 'bg-gray-200 border-gray-300 opacity-50 grayscale hover:opacity-70'
        }`}
        title={achievement.name}
        style={
          isUnlocked
            ? {
                filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))',
                animation: 'pulse-subtle 3s ease-in-out infinite',
              }
            : {}
        }
      >
        <div className="text-white">
          {getIcon(achievement.icon)}
        </div>
      </div>
      
      {isUnlocked && (
        <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
          <Star className="w-4 h-4 text-white fill-white" />
        </div>
      )}

      {showLocked && !isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black bg-opacity-50 rounded-full p-2">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      )}

      <div className="mt-2 text-center">
        <p className={`text-xs font-semibold ${isUnlocked ? 'text-gray-800' : 'text-gray-600'}`}>
          {achievement.name}
        </p>
        {achievement.points_reward > 0 && (
          <p className="text-xs text-yellow-600">+{achievement.points_reward} XP</p>
        )}
      </div>
      <style>{`
        @keyframes pulse-subtle {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.4);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 0 8px rgba(251, 191, 36, 0);
          }
        }
      `}</style>
    </div>
  );
};

export default AchievementBadge;

