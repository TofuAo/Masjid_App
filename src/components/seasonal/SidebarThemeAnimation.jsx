import React, { useEffect, useState } from 'react';

// Spring Animation - Pink theme with gentle glow and floating petals
const SpringAnimation = ({ colors }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const particle = {
        id: Date.now() + Math.random(),
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 2,
        size: Math.random() * 8 + 4,
      };
      setParticles((prev) => [...prev.slice(-10), particle]);
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Gentle pink glow pulse */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${colors.primary}40 0%, transparent 70%)`,
          animation: 'pulseGlow 4s ease-in-out infinite',
        }}
      />
      
      {/* Floating pink petals */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute pointer-events-none"
          style={{
            left: `${particle.left}%`,
            top: '-20px',
            fontSize: `${particle.size}px`,
            animation: `floatDown ${particle.duration}s ease-in-out ${particle.delay}s infinite`,
            opacity: 0.4,
            color: colors.primary,
          }}
        >
          🌸
        </div>
      ))}

      {/* Shimmer effect */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: `linear-gradient(45deg, transparent 30%, ${colors.accent} 50%, transparent 70%)`,
          backgroundSize: '200% 200%',
          animation: 'shimmer 6s ease-in-out infinite',
        }}
      />

      <style>{`
        @keyframes pulseGlow {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.3;
            transform: scale(1.1);
          }
        }
        @keyframes floatDown {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0.4;
          }
          50% {
            transform: translateY(50px) translateX(10px) rotate(180deg);
            opacity: 0.6;
          }
          100% {
            transform: translateY(100px) translateX(-10px) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </>
  );
};

// Summer Animation - Green theme with emerald shimmer and gentle movement
const SummerAnimation = ({ colors }) => {
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const leaf = {
        id: Date.now() + Math.random(),
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 4 + Math.random() * 2,
        size: Math.random() * 6 + 4,
      };
      setLeaves((prev) => [...prev.slice(-8), leaf]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Emerald green glow pulse */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          background: `radial-gradient(ellipse at top, ${colors.primary}30 0%, transparent 60%)`,
          animation: 'greenPulse 5s ease-in-out infinite',
        }}
      />
      
      {/* Floating green leaves */}
      {leaves.map((leaf) => (
        <div
          key={leaf.id}
          className="absolute pointer-events-none"
          style={{
            left: `${leaf.left}%`,
            top: '-15px',
            fontSize: `${leaf.size}px`,
            animation: `gentleFloat ${leaf.duration}s ease-in-out ${leaf.delay}s infinite`,
            opacity: 0.3,
            color: colors.accent,
          }}
        >
          🍃
        </div>
      ))}

      {/* Gentle wave effect */}
      <div
        className="absolute inset-0 opacity-8"
        style={{
          background: `linear-gradient(180deg, ${colors.primaryLight}20 0%, transparent 50%, ${colors.accent}15 100%)`,
          animation: 'wave 8s ease-in-out infinite',
        }}
      />

      <style>{`
        @keyframes greenPulse {
          0%, 100% {
            opacity: 0.15;
            transform: scaleY(1);
          }
          50% {
            opacity: 0.25;
            transform: scaleY(1.05);
          }
        }
        @keyframes gentleFloat {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0.3;
          }
          50% {
            transform: translateY(60px) translateX(15px) rotate(90deg);
            opacity: 0.5;
          }
          100% {
            transform: translateY(120px) translateX(-15px) rotate(180deg);
            opacity: 0;
          }
        }
        @keyframes wave {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </>
  );
};

// Fall Animation - Orange theme with warm glow and falling particles
const FallAnimation = ({ colors }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const particle = {
        id: Date.now() + Math.random(),
        left: Math.random() * 100,
        delay: Math.random() * 1.5,
        duration: 3 + Math.random() * 2,
        size: Math.random() * 7 + 5,
      };
      setParticles((prev) => [...prev.slice(-12), particle]);
    }, 700);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Warm orange glow */}
      <div
        className="absolute inset-0 opacity-18"
        style={{
          background: `radial-gradient(ellipse at bottom, ${colors.primary}35 0%, transparent 65%)`,
          animation: 'warmGlow 4s ease-in-out infinite',
        }}
      />
      
      {/* Falling autumn leaves */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute pointer-events-none"
          style={{
            left: `${particle.left}%`,
            top: '-25px',
            fontSize: `${particle.size}px`,
            animation: `fallRotate ${particle.duration}s linear ${particle.delay}s infinite`,
            opacity: 0.35,
            color: colors.primary,
          }}
        >
          🍂
        </div>
      ))}

      {/* Warm shimmer */}
      <div
        className="absolute inset-0 opacity-12"
        style={{
          background: `linear-gradient(135deg, ${colors.primaryLight}25 0%, transparent 40%, ${colors.accent}20 100%)`,
          backgroundSize: '150% 150%',
          animation: 'warmShimmer 7s ease-in-out infinite',
        }}
      />

      <style>{`
        @keyframes warmGlow {
          0%, 100% {
            opacity: 0.18;
            transform: scale(1);
          }
          50% {
            opacity: 0.28;
            transform: scale(1.08);
          }
        }
        @keyframes fallRotate {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.35;
          }
          50% {
            transform: translateY(70px) rotate(180deg);
            opacity: 0.5;
          }
          100% {
            transform: translateY(140px) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes warmShimmer {
          0% {
            background-position: 0% 0%;
          }
          50% {
            background-position: 100% 100%;
          }
          100% {
            background-position: 0% 0%;
          }
        }
      `}</style>
    </>
  );
};

// Winter Animation - Blue theme with cool glow and snowflakes
const WinterAnimation = ({ colors }) => {
  const [snowflakes, setSnowflakes] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const snowflake = {
        id: Date.now() + Math.random(),
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 5 + Math.random() * 3,
        size: Math.random() * 6 + 4,
      };
      setSnowflakes((prev) => [...prev.slice(-10), snowflake]);
    }, 600);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Cool blue glow */}
      <div
        className="absolute inset-0 opacity-12"
        style={{
          background: `radial-gradient(circle at top, ${colors.primary}25 0%, transparent 70%)`,
          animation: 'coolGlow 6s ease-in-out infinite',
        }}
      />
      
      {/* Falling snowflakes */}
      {snowflakes.map((snowflake) => (
        <div
          key={snowflake.id}
          className="absolute pointer-events-none"
          style={{
            left: `${snowflake.left}%`,
            top: '-20px',
            fontSize: `${snowflake.size}px`,
            animation: `snowFall ${snowflake.duration}s linear ${snowflake.delay}s infinite`,
            opacity: 0.4,
            color: colors.accent,
          }}
        >
          ❄
        </div>
      ))}

      {/* Cool shimmer effect */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: `linear-gradient(45deg, ${colors.primaryLight}20 0%, transparent 50%, ${colors.accent}15 100%)`,
          backgroundSize: '200% 200%',
          animation: 'coolShimmer 8s ease-in-out infinite',
        }}
      />

      <style>{`
        @keyframes coolGlow {
          0%, 100% {
            opacity: 0.12;
            transform: scale(1);
          }
          50% {
            opacity: 0.22;
            transform: scale(1.05);
          }
        }
        @keyframes snowFall {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0.4;
          }
          50% {
            transform: translateY(80px) translateX(10px) rotate(180deg);
            opacity: 0.6;
          }
          100% {
            transform: translateY(160px) translateX(-10px) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes coolShimmer {
          0% {
            background-position: -200% -200%;
          }
          50% {
            background-position: 200% 200%;
          }
          100% {
            background-position: -200% -200%;
          }
        }
      `}</style>
    </>
  );
};

// Main Sidebar Theme Animation Component
const SidebarThemeAnimation = ({ scheme }) => {
  if (!scheme || !scheme.element) return null;

  const colors = scheme.colors;

  switch (scheme.element) {
    case 'sakura':
      return <SpringAnimation colors={colors} />;
    case 'tree':
      return <SummerAnimation colors={colors} />;
    case 'leaves':
      return <FallAnimation colors={colors} />;
    case 'snow':
      return <WinterAnimation colors={colors} />;
    default:
      return null;
  }
};

export default SidebarThemeAnimation;

