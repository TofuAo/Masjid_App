import React, { createContext, useContext, useState, useEffect } from 'react';
import ConfettiEffect from './ConfettiEffect';
import LevelUpCelebration from './LevelUpCelebration';
import PointsEarnedAnimation from './PointsEarnedAnimation';
import AchievementNotification from './AchievementNotification';

const GamificationContext = createContext();

export const useGamificationEffects = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamificationEffects must be used within GamificationEffectsProvider');
  }
  return context;
};

export const GamificationEffectsProvider = ({ children }) => {
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [levelUp, setLevelUp] = useState(null);
  const [pointsEarned, setPointsEarned] = useState(null);
  const [achievement, setAchievement] = useState(null);

  const triggerConfetti = () => {
    setConfettiTrigger(prev => prev + 1);
  };

  const showLevelUp = (level) => {
    setLevelUp({ level, timestamp: Date.now() });
  };

  const showPointsEarned = (points, reason, position) => {
    setPointsEarned({ points, reason, position, timestamp: Date.now() });
  };

  const showAchievement = (achievementData) => {
    setAchievement({ ...achievementData, timestamp: Date.now() });
  };

  return (
    <GamificationContext.Provider
      value={{
        triggerConfetti,
        showLevelUp,
        showPointsEarned,
        showAchievement,
      }}
    >
      {children}
      
      {/* Global Effects */}
      <ConfettiEffect trigger={confettiTrigger > 0} key={confettiTrigger} />
      
      {levelUp && (
        <LevelUpCelebration
          show={true}
          level={levelUp.level}
          onClose={() => setLevelUp(null)}
        />
      )}
      
      {pointsEarned && (
        <PointsEarnedAnimation
          show={true}
          points={pointsEarned.points}
          reason={pointsEarned.reason}
          position={pointsEarned.position}
          onComplete={() => setPointsEarned(null)}
        />
      )}
      
      {achievement && (
        <AchievementNotification
          achievement={achievement}
          onClose={() => setAchievement(null)}
        />
      )}
    </GamificationContext.Provider>
  );
};

