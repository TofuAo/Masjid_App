import React from 'react';
import { Flame } from 'lucide-react';

const StreakFireEffect = ({ streakCount, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const fireCount = Math.min(streakCount, 5); // Show max 5 flames

  return (
    <div className="flex items-center space-x-1">
      {Array.from({ length: fireCount }).map((_, i) => (
        <Flame
          key={i}
          className={`${sizeClasses[size]} text-orange-500 animate-pulse`}
          style={{
            animationDelay: `${i * 0.1}s`,
            filter: 'drop-shadow(0 0 4px rgba(251, 146, 60, 0.8))',
          }}
          fill="currentColor"
        />
      ))}
      {streakCount > 5 && (
        <span className="text-orange-600 font-bold text-lg">+{streakCount - 5}</span>
      )}
    </div>
  );
};

export default StreakFireEffect;

