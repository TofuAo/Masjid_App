import React, { useEffect, useState } from 'react';
import { TrendingUp, Trophy, Star, Zap } from 'lucide-react';
import ConfettiEffect from './ConfettiEffect';
import ParticleExplosion from './ParticleExplosion';

const LevelUpCelebration = ({ show, level, onClose }) => {
  const [animate, setAnimate] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (show) {
      setShowConfetti(true);
      setTimeout(() => setAnimate(true), 100);
      
      const timer = setTimeout(() => {
        setAnimate(false);
        setShowConfetti(false);
        setTimeout(() => {
          if (onClose) onClose();
        }, 500);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <>
      <ConfettiEffect trigger={showConfetti} duration={4000} />
      <ParticleExplosion 
        trigger={showConfetti} 
        position={{ x: 50, y: 50 }} 
        color="#fbbf24"
        particleCount={50}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div
          className={`bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-500 ${
            animate ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 rotate-180'
          }`}
        >
          <div className="text-center text-white relative">
            {/* Animated stars around */}
            <Star className="absolute -top-4 -left-4 w-8 h-8 text-yellow-300 animate-spin" style={{ animationDuration: '2s' }} />
            <Star className="absolute -top-4 -right-4 w-8 h-8 text-yellow-300 animate-spin" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
            <Star className="absolute -bottom-4 -left-4 w-8 h-8 text-yellow-300 animate-spin" style={{ animationDuration: '2s', animationDelay: '1s' }} />
            <Star className="absolute -bottom-4 -right-4 w-8 h-8 text-yellow-300 animate-spin" style={{ animationDuration: '2s', animationDelay: '1.5s' }} />

            <div className="mb-6 animate-bounce">
              <Trophy className="w-24 h-24 mx-auto text-white drop-shadow-lg" />
            </div>

            <h2 className="text-4xl font-bold mb-2 animate-pulse">LEVEL UP!</h2>
            <div className="text-6xl font-bold mb-4 bg-white text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-600">
              Level {level}
            </div>
            
            <div className="flex items-center justify-center space-x-4 mb-6">
              <TrendingUp className="w-8 h-8 animate-pulse" />
              <p className="text-xl font-semibold">Tahniah! Anda Naik Level!</p>
              <Zap className="w-8 h-8 animate-pulse" />
            </div>

            <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-lg">Teruskan usaha anda untuk mencapai level seterusnya!</p>
            </div>

            <button
              onClick={() => {
                setAnimate(false);
                setTimeout(() => {
                  if (onClose) onClose();
                }, 500);
              }}
              className="mt-6 px-6 py-3 bg-white text-orange-600 rounded-lg font-bold hover:bg-gray-100 transition-colors shadow-lg"
            >
              Teruskan
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default LevelUpCelebration;

