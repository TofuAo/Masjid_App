import React, { useEffect, useState } from 'react';
import { X, Trophy, Sparkles } from 'lucide-react';
import AchievementBadge from './AchievementBadge';
import ConfettiEffect from './ConfettiEffect';
import SparkleEffect from './SparkleEffect';

const AchievementNotification = ({ achievement, onClose, autoClose = true }) => {
  const [show, setShow] = useState(true);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setAnimate(true), 100);

    // Auto close after 5 seconds
    if (autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [autoClose]);

  const handleClose = () => {
    setAnimate(false);
    setTimeout(() => {
      setShow(false);
      if (onClose) onClose();
    }, 300);
  };

  if (!show) return null;

  return (
    <>
      <ConfettiEffect trigger={animate} duration={5000} />
      <SparkleEffect trigger={animate} duration={3000} count={30} />
      <div
      className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${
        animate ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-xl shadow-2xl p-6 max-w-md border-4 border-white relative overflow-hidden">
        {/* Sparkle background effect */}
        <div className="absolute inset-0 opacity-20">
          <Sparkles className="w-full h-full text-white animate-pulse" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="animate-bounce">
                <AchievementBadge achievement={achievement} size="lg" unlocked={true} />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Trophy className="w-5 h-5 text-white" />
                <h3 className="text-xl font-bold text-white">Pencapaian Dikunci!</h3>
              </div>
              <p className="text-lg font-semibold text-white mb-1">{achievement.name}</p>
              <p className="text-white text-sm opacity-90">{achievement.description}</p>
              {achievement.points_reward > 0 && (
                <div className="mt-3 bg-white bg-opacity-20 rounded-lg p-2 inline-block">
                  <p className="text-white font-bold">
                    +{achievement.points_reward} XP Diraih!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Confetti effect */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
    </>
  );
};

export default AchievementNotification;

