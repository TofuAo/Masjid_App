import React, { useEffect, useState } from 'react';
import { Coins, Plus } from 'lucide-react';
import SparkleEffect from './SparkleEffect';

const PointsEarnedAnimation = ({ show, points, reason, position = { x: 50, y: 50 }, onComplete }) => {
  const [animate, setAnimate] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);

  useEffect(() => {
    if (show) {
      setShowSparkles(true);
      setTimeout(() => setAnimate(true), 100);
      
      const timer = setTimeout(() => {
        setAnimate(false);
        setShowSparkles(false);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 300);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <SparkleEffect trigger={showSparkles} duration={2000} count={15} />
      <div
        className={`bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-2xl px-6 py-4 flex items-center space-x-3 transform transition-all duration-500 ${
          animate ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 translate-y-10'
        }`}
        style={{
          animation: animate ? 'points-pop 2s ease-out forwards' : 'none',
        }}
      >
        <Coins className="w-8 h-8 text-white animate-bounce" />
        <div className="text-white">
          <div className="flex items-center space-x-1">
            <Plus className="w-5 h-5" />
            <span className="text-3xl font-bold">{points}</span>
            <span className="text-lg">mata</span>
          </div>
          {reason && (
            <p className="text-xs opacity-90 mt-1">{reason}</p>
          )}
        </div>
      </div>
      <style>{`
        @keyframes points-pop {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
          }
          20% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -150%) scale(0.8);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default PointsEarnedAnimation;

