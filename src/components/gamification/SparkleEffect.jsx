import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

const SparkleEffect = ({ trigger, duration = 2000, count = 20 }) => {
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {
    if (trigger) {
      const newSparkles = Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 500,
        size: Math.random() * 20 + 10,
        duration: Math.random() * 1000 + 500,
      }));

      setSparkles(newSparkles);

      const timeout = setTimeout(() => {
        setSparkles([]);
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [trigger, duration, count]);

  if (sparkles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="absolute"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            animation: `sparkle ${sparkle.duration}ms ease-out forwards`,
            animationDelay: `${sparkle.delay}ms`,
          }}
        >
          <Sparkles
            className="text-yellow-400"
            style={{
              width: `${sparkle.size}px`,
              height: `${sparkle.size}px`,
              filter: 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.8))',
            }}
          />
        </div>
      ))}
      <style>{`
        @keyframes sparkle {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.5) rotate(180deg);
            opacity: 1;
          }
          100% {
            transform: scale(0) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default SparkleEffect;

