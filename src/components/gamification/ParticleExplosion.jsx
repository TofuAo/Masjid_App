import React, { useEffect, useState } from 'react';

const ParticleExplosion = ({ trigger, position = { x: 50, y: 50 }, color = '#fbbf24', particleCount = 30 }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        angle: (360 / particleCount) * i,
        distance: Math.random() * 200 + 100,
        size: Math.random() * 8 + 4,
        duration: Math.random() * 1000 + 500,
        delay: Math.random() * 100,
      }));

      setParticles(newParticles);

      const timeout = setTimeout(() => {
        setParticles([]);
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [trigger, particleCount]);

  if (particles.length === 0) return null;

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {particles.map((particle) => {
        const rad = (particle.angle * Math.PI) / 180;
        const x = Math.cos(rad) * particle.distance;
        const y = Math.sin(rad) * particle.distance;

        return (
          <div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: color,
              boxShadow: `0 0 ${particle.size}px ${color}`,
              animation: `particle-explode ${particle.duration}ms ease-out forwards`,
              animationDelay: `${particle.delay}ms`,
              transform: `translate(0, 0)`,
              '--target-x': `${x}px`,
              '--target-y': `${y}px`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes particle-explode {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--target-x), var(--target-y)) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ParticleExplosion;

