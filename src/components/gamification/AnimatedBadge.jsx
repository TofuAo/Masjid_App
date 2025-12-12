import React, { useEffect, useState } from 'react';
import AchievementBadge from './AchievementBadge';
import SparkleEffect from './SparkleEffect';
import ParticleExplosion from './ParticleExplosion';

const AnimatedBadge = ({ achievement, unlocked = false, onAnimationComplete }) => {
  const [animate, setAnimate] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);

  useEffect(() => {
    if (unlocked) {
      setShowSparkles(true);
      setTimeout(() => setAnimate(true), 100);
      
      const timer = setTimeout(() => {
        setAnimate(false);
        setShowSparkles(false);
        if (onAnimationComplete) onAnimationComplete();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [unlocked, onAnimationComplete]);

  return (
    <div className="relative">
      <SparkleEffect trigger={showSparkles && unlocked} duration={1500} count={10} />
      <ParticleExplosion 
        trigger={showSparkles && unlocked}
        position={{ x: 50, y: 50 }}
        color="#fbbf24"
        particleCount={20}
      />
      <div
        className={`transform transition-all duration-500 ${
          animate && unlocked
            ? 'scale-110 rotate-12'
            : unlocked
            ? 'scale-100 rotate-0'
            : 'scale-100 rotate-0'
        }`}
      >
        <AchievementBadge 
          achievement={achievement} 
          unlocked={unlocked}
        />
      </div>
      {animate && unlocked && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-4xl animate-bounce">✨</div>
        </div>
      )}
    </div>
  );
};

export default AnimatedBadge;

