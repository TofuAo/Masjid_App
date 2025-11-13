import React, { useEffect, useState } from 'react';

// Sakura Tree Component (Spring) - Pink theme
const SakuraTree = ({ colors }) => {
  const [petals, setPetals] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const petal = {
        id: Date.now(),
        left: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 3 + Math.random() * 2,
      };
      setPetals((prev) => [...prev.slice(-20), petal]);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden" style={{ height: '250px', zIndex: 1 }}>
      {/* Detailed Tree trunk */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
        <svg width="50" height="150" viewBox="0 0 50 150" className="opacity-90">
          <rect x="20" y="0" width="10" height="150" fill="#8B4513" />
          <rect x="18" y="20" width="14" height="8" fill="#654321" />
          <rect x="18" y="50" width="14" height="8" fill="#654321" />
        </svg>
      </div>
      
      {/* Detailed Sakura tree branches with pink blossoms */}
      <div className="absolute bottom-30 left-1/2 transform -translate-x-1/2">
        <svg width="280" height="200" viewBox="0 0 280 200" className="opacity-75">
          {/* Main branches */}
          <path d="M140 200 L100 140 L80 110 L70 80 L140 90 Z" fill="#8B4513" stroke="#654321" strokeWidth="2" />
          <path d="M140 200 L180 140 L200 110 L210 80 L140 90 Z" fill="#8B4513" stroke="#654321" strokeWidth="2" />
          <path d="M140 200 L120 120 L110 90 L140 100 Z" fill="#8B4513" stroke="#654321" strokeWidth="2" />
          <path d="M140 200 L160 120 L170 90 L140 100 Z" fill="#8B4513" stroke="#654321" strokeWidth="2" />
          
          {/* Pink sakura blossoms */}
          <circle cx="90" cy="85" r="12" fill={colors?.primary || '#ec4899'} opacity="0.8" />
          <circle cx="110" cy="75" r="10" fill={colors?.accent || '#f472b6'} opacity="0.7" />
          <circle cx="170" cy="85" r="12" fill={colors?.primary || '#ec4899'} opacity="0.8" />
          <circle cx="150" cy="75" r="10" fill={colors?.accent || '#f472b6'} opacity="0.7" />
          <circle cx="130" cy="65" r="14" fill={colors?.primary || '#ec4899'} opacity="0.9" />
          <circle cx="120" cy="55" r="8" fill={colors?.accent || '#f472b6'} opacity="0.6" />
          <circle cx="160" cy="55" r="8" fill={colors?.accent || '#f472b6'} opacity="0.6" />
        </svg>
      </div>

      {/* Falling sakura petals */}
      {petals.map((petal) => (
        <div
          key={petal.id}
          className="absolute text-2xl animate-pulse"
          style={{
            left: `${petal.left}%`,
            bottom: '0',
            animation: `fall ${petal.duration}s linear ${petal.delay}s forwards`,
            opacity: 0.7,
            color: colors?.primary || '#ec4899',
          }}
        >
          🌸
        </div>
      ))}

      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.7;
          }
          100% {
            transform: translateY(250px) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

// Green Tree Component (Summer) - Emerald theme
const GreenTree = ({ colors }) => {
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const leaf = {
        id: Date.now(),
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 2,
      };
      setLeaves((prev) => [...prev.slice(-15), leaf]);
    }, 800);

    return () => clearInterval(interval);
  }, []);

  const treeColor = colors?.primary || '#10b981';
  const leafColor = colors?.accent || '#34d399';

  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden" style={{ height: '250px', zIndex: 1 }}>
      {/* Detailed Tree trunk */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
        <svg width="60" height="160" viewBox="0 0 60 160" className="opacity-90">
          <rect x="22" y="0" width="16" height="160" fill="#654321" />
          <rect x="20" y="30" width="20" height="10" fill="#8B4513" />
          <rect x="20" y="70" width="20" height="10" fill="#8B4513" />
          <rect x="20" y="110" width="20" height="10" fill="#8B4513" />
        </svg>
      </div>
      
      {/* Detailed lush green tree foliage */}
      <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2">
        <svg width="300" height="220" viewBox="0 0 300 220" className="opacity-75">
          {/* Main branches */}
          <path d="M150 220 L110 160 L90 130 L80 100 L150 110 Z" fill="#654321" stroke="#8B4513" strokeWidth="2" />
          <path d="M150 220 L190 160 L210 130 L220 100 L150 110 Z" fill="#654321" stroke="#8B4513" strokeWidth="2" />
          
          {/* Multiple layers of green foliage */}
          <ellipse cx="150" cy="50" rx="90" ry="70" fill={treeColor} opacity="0.9" />
          <ellipse cx="120" cy="70" rx="60" ry="50" fill={treeColor} opacity="0.8" />
          <ellipse cx="180" cy="70" rx="60" ry="50" fill={treeColor} opacity="0.8" />
          <ellipse cx="150" cy="90" rx="70" ry="55" fill={leafColor} opacity="0.7" />
          <ellipse cx="100" cy="85" rx="45" ry="40" fill={treeColor} opacity="0.85" />
          <ellipse cx="200" cy="85" rx="45" ry="40" fill={treeColor} opacity="0.85" />
        </svg>
      </div>

      {/* Floating green leaves */}
      {leaves.map((leaf) => (
        <div
          key={leaf.id}
          className="absolute text-xl"
          style={{
            left: `${leaf.left}%`,
            bottom: '0',
            animation: `float ${leaf.duration}s ease-in-out ${leaf.delay}s infinite`,
            opacity: 0.6,
            color: leafColor,
          }}
        >
          🍃
        </div>
      ))}

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0) rotate(0deg);
          }
          50% {
            transform: translateY(-30px) translateX(20px) rotate(180deg);
          }
        }
      `}</style>
    </div>
  );
};

// Autumn Tree Component (Fall) - Orange theme
const AutumnTree = ({ colors }) => {
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const leaf = {
        id: Date.now(),
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 4 + Math.random() * 3,
        rotation: Math.random() * 360,
      };
      setLeaves((prev) => [...prev.slice(-25), leaf]);
    }, 600);

    return () => clearInterval(interval);
  }, []);

  const treeColor = colors?.primary || '#f97316';
  const leafColor = colors?.accent || '#fb923c';

  return (
    <>
      {/* Autumn tree with orange/red leaves */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden" style={{ height: '250px', zIndex: 1 }}>
        {/* Detailed Tree trunk */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
          <svg width="55" height="150" viewBox="0 0 55 150" className="opacity-90">
            <rect x="20" y="0" width="15" height="150" fill="#8B4513" />
            <rect x="18" y="25" width="19" height="12" fill="#654321" />
            <rect x="18" y="65" width="19" height="12" fill="#654321" />
          </svg>
        </div>
        
        {/* Autumn tree with orange/red foliage */}
        <div className="absolute bottom-35 left-1/2 transform -translate-x-1/2">
          <svg width="280" height="200" viewBox="0 0 280 200" className="opacity-75">
            {/* Main branches */}
            <path d="M140 200 L100 140 L85 110 L75 80 L140 90 Z" fill="#8B4513" stroke="#654321" strokeWidth="2" />
            <path d="M140 200 L180 140 L195 110 L205 80 L140 90 Z" fill="#8B4513" stroke="#654321" strokeWidth="2" />
            
            {/* Autumn colored foliage - orange and red tones */}
            <ellipse cx="140" cy="55" rx="85" ry="65" fill={treeColor} opacity="0.85" />
            <ellipse cx="110" cy="75" rx="55" ry="45" fill={leafColor} opacity="0.8" />
            <ellipse cx="170" cy="75" rx="55" ry="45" fill={leafColor} opacity="0.8" />
            <ellipse cx="95" cy="70" rx="40" ry="35" fill="#dc2626" opacity="0.7" />
            <ellipse cx="185" cy="70" rx="40" ry="35" fill="#dc2626" opacity="0.7" />
            <ellipse cx="140" cy="85" rx="65" ry="50" fill="#ea580c" opacity="0.75" />
          </svg>
        </div>
      </div>

      {/* Falling autumn leaves */}
      <div className="absolute top-0 left-0 right-0 pointer-events-none overflow-hidden" style={{ height: '100%', zIndex: 1 }}>
        {leaves.map((leaf) => (
          <div
            key={leaf.id}
            className="absolute text-2xl"
            style={{
              left: `${leaf.left}%`,
              top: '-50px',
              animation: `fallLeaf ${leaf.duration}s linear ${leaf.delay}s forwards`,
              opacity: 0.8,
              transform: `rotate(${leaf.rotation}deg)`,
              color: treeColor,
            }}
          >
            🍂
          </div>
        ))}

        <style>{`
          @keyframes fallLeaf {
            0% {
              transform: translateY(0) rotate(0deg);
              opacity: 0.8;
            }
            100% {
              transform: translateY(calc(100vh + 50px)) rotate(720deg);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    </>
  );
};

// Winter Tree Component (Winter) - Blue theme
const WinterTree = ({ colors }) => {
  const [snowflakes, setSnowflakes] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const snowflake = {
        id: Date.now(),
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 5 + Math.random() * 5,
        size: Math.random() * 10 + 10,
      };
      setSnowflakes((prev) => [...prev.slice(-30), snowflake]);
    }, 300);

    return () => clearInterval(interval);
  }, []);

  const treeColor = colors?.primary || '#3b82f6';
  const snowColor = colors?.accent || '#60a5fa';

  return (
    <>
      {/* Winter tree with snow-covered branches */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden" style={{ height: '250px', zIndex: 1 }}>
        {/* Detailed Tree trunk */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
          <svg width="50" height="150" viewBox="0 0 50 150" className="opacity-90">
            <rect x="20" y="0" width="10" height="150" fill="#8B4513" />
            <rect x="18" y="30" width="14" height="8" fill="#654321" />
            <rect x="18" y="70" width="14" height="8" fill="#654321" />
          </svg>
        </div>
        
        {/* Winter tree with bare branches and snow */}
        <div className="absolute bottom-30 left-1/2 transform -translate-x-1/2">
          <svg width="260" height="200" viewBox="0 0 260 200" className="opacity-75">
            {/* Bare tree branches */}
            <path d="M130 200 L95 150 L80 130 L70 110 L130 120 Z" fill="#654321" stroke="#8B4513" strokeWidth="2" />
            <path d="M130 200 L165 150 L180 130 L190 110 L130 120 Z" fill="#654321" stroke="#8B4513" strokeWidth="2" />
            <path d="M130 200 L110 140 L100 120 L130 130 Z" fill="#654321" stroke="#8B4513" strokeWidth="2" />
            <path d="M130 200 L150 140 L160 120 L130 130 Z" fill="#654321" stroke="#8B4513" strokeWidth="2" />
            <path d="M130 200 L120 160 L115 140 L130 150 Z" fill="#654321" stroke="#8B4513" strokeWidth="2" />
            <path d="M130 200 L140 160 L145 140 L130 150 Z" fill="#654321" stroke="#8B4513" strokeWidth="2" />
            
            {/* Snow on branches */}
            <ellipse cx="85" cy="125" rx="8" ry="4" fill="#ffffff" opacity="0.9" />
            <ellipse cx="175" cy="125" rx="8" ry="4" fill="#ffffff" opacity="0.9" />
            <ellipse cx="110" cy="115" rx="6" ry="3" fill="#ffffff" opacity="0.9" />
            <ellipse cx="150" cy="115" rx="6" ry="3" fill="#ffffff" opacity="0.9" />
            <ellipse cx="120" cy="145" rx="5" ry="2.5" fill="#ffffff" opacity="0.9" />
            <ellipse cx="140" cy="145" rx="5" ry="2.5" fill="#ffffff" opacity="0.9" />
            
            {/* Snow-covered ground effect */}
            <ellipse cx="130" cy="195" rx="100" ry="15" fill="#e0f2fe" opacity="0.6" />
          </svg>
        </div>
      </div>

      {/* Falling snowflakes */}
      <div className="absolute top-0 left-0 right-0 pointer-events-none overflow-hidden" style={{ height: '100%', zIndex: 1 }}>
        {snowflakes.map((snowflake) => (
          <div
            key={snowflake.id}
            className="absolute"
            style={{
              left: `${snowflake.left}%`,
              top: '-20px',
              fontSize: `${snowflake.size}px`,
              animation: `snowfall ${snowflake.duration}s linear ${snowflake.delay}s infinite`,
              opacity: 0.7,
              color: snowColor,
            }}
          >
            ❄
          </div>
        ))}

        <style>{`
          @keyframes snowfall {
            0% {
              transform: translateY(0) translateX(0);
              opacity: 0.7;
            }
            100% {
              transform: translateY(calc(100vh + 20px)) translateX(20px);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    </>
  );
};

// Main Seasonal Elements Component
const SeasonalElements = ({ scheme }) => {
  if (!scheme || !scheme.element) return null;

  // Pass colors to each component so trees change with theme
  const colors = scheme.colors;

  switch (scheme.element) {
    case 'sakura':
      return <SakuraTree colors={colors} />;
    case 'tree':
      return <GreenTree colors={colors} />;
    case 'leaves':
      return <AutumnTree colors={colors} />;
    case 'snow':
      return <WinterTree colors={colors} />;
    default:
      return null;
  }
};

export default SeasonalElements;

