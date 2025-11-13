import React, { useEffect, useState } from 'react';

// Sakura Tree Component (Spring) - Pink theme with image-style illustration
const SakuraTree = ({ colors }) => {
  const [petals, setPetals] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const petal = {
        id: Date.now() + Math.random(),
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 2,
        size: Math.random() * 8 + 12,
      };
      setPetals((prev) => [...prev.slice(-25), petal]);
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-visible" style={{ height: '100%', minHeight: '400px', zIndex: 1 }}>
      {/* Beautiful Sakura Tree Image - Larger for Sidebar */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2" style={{ width: '100%', maxWidth: '280px', height: '380px' }}>
        <svg width="100%" height="380" viewBox="0 0 200 280" preserveAspectRatio="xMidYMid meet" style={{ opacity: 1, filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.4))' }}>
          {/* Tree trunk */}
          <rect x="90" y="180" width="20" height="100" fill="#8B4513" rx="3" />
          <rect x="88" y="200" width="24" height="8" fill="#654321" rx="2" />
          <rect x="88" y="230" width="24" height="8" fill="#654321" rx="2" />
          
          {/* Main branches */}
          <path d="M100 180 Q70 140 50 100" stroke="#8B4513" strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d="M100 180 Q130 140 150 100" stroke="#8B4513" strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d="M100 180 Q85 150 75 120" stroke="#8B4513" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M100 180 Q115 150 125 120" stroke="#8B4513" strokeWidth="6" fill="none" strokeLinecap="round" />
          
          {/* Sakura blossoms clusters - more detailed */}
          <g opacity="0.9">
            {/* Left branch blossoms */}
            <circle cx="55" cy="105" r="18" fill={colors?.primary || '#ec4899'} />
            <circle cx="50" cy="100" r="12" fill={colors?.accent || '#f472b6'} />
            <circle cx="60" cy="100" r="12" fill={colors?.accent || '#f472b6'} />
            <circle cx="55" cy="95" r="10" fill="#ffffff" opacity="0.3" />
            
            {/* Right branch blossoms */}
            <circle cx="145" cy="105" r="18" fill={colors?.primary || '#ec4899'} />
            <circle cx="140" cy="100" r="12" fill={colors?.accent || '#f472b6'} />
            <circle cx="150" cy="100" r="12" fill={colors?.accent || '#f472b6'} />
            <circle cx="145" cy="95" r="10" fill="#ffffff" opacity="0.3" />
            
            {/* Center top blossoms */}
            <circle cx="100" cy="85" r="22" fill={colors?.primary || '#ec4899'} />
            <circle cx="95" cy="80" r="14" fill={colors?.accent || '#f472b6'} />
            <circle cx="105" cy="80" r="14" fill={colors?.accent || '#f472b6'} />
            <circle cx="100" cy="75" r="12" fill="#ffffff" opacity="0.3" />
            
            {/* Side blossoms */}
            <circle cx="80" cy="125" r="15" fill={colors?.primary || '#ec4899'} />
            <circle cx="120" cy="125" r="15" fill={colors?.primary || '#ec4899'} />
          </g>
        </svg>
      </div>

      {/* Falling sakura petals with animation - More visible */}
      <div className="absolute top-0 left-0 right-0 pointer-events-none overflow-visible" style={{ height: '100%', zIndex: 2 }}>
        {petals.map((petal) => (
          <div
            key={petal.id}
            className="absolute"
            style={{
              left: `${petal.left}%`,
              top: '-40px',
              fontSize: `${petal.size}px`,
              animation: `sakuraFall ${petal.duration}s linear ${petal.delay}s infinite`,
              opacity: 0.95,
              filter: 'drop-shadow(0 3px 6px rgba(236,72,153,0.5))',
            }}
          >
            🌸
          </div>
        ))}
      </div>

      <style>{`
        @keyframes sakuraFall {
          0% {
            transform: translateY(0) rotate(0deg) translateX(0);
            opacity: 0.8;
          }
          50% {
            transform: translateY(150px) rotate(180deg) translateX(15px);
            opacity: 0.6;
          }
          100% {
            transform: translateY(300px) rotate(360deg) translateX(-15px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

// Coconut Tree Component (Summer) - Emerald theme with image-style illustration
const CoconutTree = ({ colors }) => {
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const leaf = {
        id: Date.now() + Math.random(),
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 2,
        size: Math.random() * 6 + 10,
      };
      setLeaves((prev) => [...prev.slice(-12), leaf]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const treeColor = colors?.primary || '#10b981';
  const leafColor = colors?.accent || '#34d399';

  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-visible" style={{ height: '100%', minHeight: '400px', zIndex: 1 }}>
      {/* Beautiful Coconut Tree Image - Larger for Sidebar */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2" style={{ width: '100%', maxWidth: '260px', height: '380px' }}>
        <svg width="100%" height="380" viewBox="0 0 180 280" preserveAspectRatio="xMidYMid meet" style={{ opacity: 1, filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.4))' }}>
          {/* Coconut tree trunk - tall and curved */}
          <path d="M90 280 Q85 200 90 120 Q88 100 90 80" stroke="#8B4513" strokeWidth="14" fill="none" strokeLinecap="round" />
          <path d="M90 280 Q95 200 90 120 Q92 100 90 80" stroke="#654321" strokeWidth="10" fill="none" strokeLinecap="round" />
          
          {/* Tree rings/texture */}
          <ellipse cx="90" cy="200" rx="3" ry="8" fill="#654321" opacity="0.6" />
          <ellipse cx="90" cy="160" rx="3" ry="8" fill="#654321" opacity="0.6" />
          <ellipse cx="90" cy="120" rx="3" ry="8" fill="#654321" opacity="0.6" />
          
          {/* Coconut fruits */}
          <ellipse cx="85" cy="100" rx="8" ry="10" fill="#8B4513" />
          <ellipse cx="95" cy="105" rx="8" ry="10" fill="#8B4513" />
          <ellipse cx="90" cy="95" rx="6" ry="8" fill="#654321" opacity="0.5" />
          
          {/* Large palm fronds */}
          <g opacity="0.85">
            {/* Left frond */}
            <path d="M90 80 Q40 60 20 40 Q10 30 15 20" stroke={treeColor} strokeWidth="12" fill="none" strokeLinecap="round" />
            <path d="M90 80 Q35 55 15 35 Q5 25 10 15" stroke={leafColor} strokeWidth="8" fill="none" strokeLinecap="round" />
            
            {/* Right frond */}
            <path d="M90 80 Q140 60 160 40 Q170 30 165 20" stroke={treeColor} strokeWidth="12" fill="none" strokeLinecap="round" />
            <path d="M90 80 Q145 55 165 35 Q175 25 170 15" stroke={leafColor} strokeWidth="8" fill="none" strokeLinecap="round" />
            
            {/* Center-left frond */}
            <path d="M90 80 Q60 50 45 30 Q40 20 45 10" stroke={treeColor} strokeWidth="10" fill="none" strokeLinecap="round" />
            
            {/* Center-right frond */}
            <path d="M90 80 Q120 50 135 30 Q140 20 135 10" stroke={treeColor} strokeWidth="10" fill="none" strokeLinecap="round" />
            
            {/* Back fronds for depth */}
            <path d="M90 80 Q70 70 55 50" stroke={treeColor} strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.6" />
            <path d="M90 80 Q110 70 125 50" stroke={treeColor} strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.6" />
          </g>
        </svg>
      </div>

      {/* Floating palm leaves - More visible */}
      <div className="absolute top-0 left-0 right-0 pointer-events-none overflow-visible" style={{ height: '100%', zIndex: 2 }}>
        {leaves.map((leaf) => (
          <div
            key={leaf.id}
            className="absolute"
            style={{
              left: `${leaf.left}%`,
              top: '-30px',
              fontSize: `${leaf.size}px`,
              animation: `palmFloat ${leaf.duration}s ease-in-out ${leaf.delay}s infinite`,
              opacity: 0.7,
              filter: 'drop-shadow(0 3px 6px rgba(16,185,129,0.4))',
            }}
          >
            🍃
          </div>
        ))}
      </div>

      <style>{`
        @keyframes palmFloat {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0.5;
          }
          50% {
            transform: translateY(80px) translateX(20px) rotate(90deg);
            opacity: 0.7;
          }
          100% {
            transform: translateY(160px) translateX(-20px) rotate(180deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

// Autumn Tree Component (Fall) - Orange theme with falling leaves animation
const AutumnTree = ({ colors }) => {
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const leaf = {
        id: Date.now() + Math.random(),
        left: Math.random() * 100,
        delay: Math.random() * 1.5,
        duration: 4 + Math.random() * 3,
        rotation: Math.random() * 360,
        size: Math.random() * 10 + 18,
        rotationSpeed: Math.random() * 360 + 180,
      };
      setLeaves((prev) => [...prev.slice(-40), leaf]);
    }, 300);

    return () => clearInterval(interval);
  }, []);

  const treeColor = colors?.primary || '#f97316';
  const leafColor = colors?.accent || '#fb923c';

  return (
    <>
      {/* Autumn tree with orange/red leaves - More Detailed */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-visible" style={{ height: '100%', minHeight: '400px', zIndex: 1 }}>
        {/* Beautiful Detailed Autumn Tree - Larger for Sidebar */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2" style={{ width: '100%', maxWidth: '300px', height: '380px' }}>
          <svg width="100%" height="380" viewBox="0 0 250 350" preserveAspectRatio="xMidYMid meet" style={{ opacity: 1, filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.5))' }}>
            {/* Tree trunk - thicker and more detailed */}
            <rect x="110" y="200" width="30" height="150" fill="#8B4513" rx="4" />
            <rect x="108" y="220" width="34" height="12" fill="#654321" rx="2" />
            <rect x="108" y="260" width="34" height="12" fill="#654321" rx="2" />
            <rect x="108" y="300" width="34" height="12" fill="#654321" rx="2" />
            
            {/* Main branches - thicker */}
            <path d="M125 200 Q85 150 55 100 Q40 70 50 50" stroke="#8B4513" strokeWidth="10" fill="none" strokeLinecap="round" />
            <path d="M125 200 Q165 150 195 100 Q210 70 200 50" stroke="#8B4513" strokeWidth="10" fill="none" strokeLinecap="round" />
            <path d="M125 200 Q105 160 90 130 Q85 110 90 90" stroke="#8B4513" strokeWidth="8" fill="none" strokeLinecap="round" />
            <path d="M125 200 Q145 160 160 130 Q165 110 160 90" stroke="#8B4513" strokeWidth="8" fill="none" strokeLinecap="round" />
            <path d="M125 200 Q115 170 105 150" stroke="#8B4513" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M125 200 Q135 170 145 150" stroke="#8B4513" strokeWidth="6" fill="none" strokeLinecap="round" />
            
            {/* Detailed autumn foliage with individual leaves visible */}
            <g opacity="0.95">
              {/* Left branch foliage */}
              <ellipse cx="70" cy="100" rx="55" ry="45" fill={treeColor} />
              <ellipse cx="65" cy="115" rx="40" ry="35" fill={leafColor} />
              <ellipse cx="60" cy="95" rx="35" ry="30" fill="#dc2626" opacity="0.85" />
              
              {/* Right branch foliage */}
              <ellipse cx="180" cy="100" rx="55" ry="45" fill={treeColor} />
              <ellipse cx="185" cy="115" rx="40" ry="35" fill={leafColor} />
              <ellipse cx="190" cy="95" rx="35" ry="30" fill="#dc2626" opacity="0.85" />
              
              {/* Center top foliage - largest */}
              <ellipse cx="125" cy="75" rx="70" ry="60" fill={treeColor} />
              <ellipse cx="120" cy="90" rx="55" ry="45" fill={leafColor} />
              <ellipse cx="130" cy="85" rx="50" ry="40" fill="#ea580c" opacity="0.9" />
              
              {/* Yellow accents */}
              <ellipse cx="95" cy="110" rx="30" ry="25" fill="#fbbf24" opacity="0.8" />
              <ellipse cx="155" cy="110" rx="30" ry="25" fill="#fbbf24" opacity="0.8" />
              
              {/* Individual leaf shapes for detail */}
              <ellipse cx="80" cy="105" rx="12" ry="8" fill="#f97316" opacity="0.9" transform="rotate(-30 80 105)" />
              <ellipse cx="170" cy="105" rx="12" ry="8" fill="#f97316" opacity="0.9" transform="rotate(30 170 105)" />
              <ellipse cx="110" cy="95" rx="10" ry="7" fill="#fb923c" opacity="0.9" transform="rotate(45 110 95)" />
              <ellipse cx="140" cy="95" rx="10" ry="7" fill="#fb923c" opacity="0.9" transform="rotate(-45 140 95)" />
            </g>
          </svg>
        </div>
      </div>

      {/* Falling autumn leaves with enhanced animation - More visible */}
      <div className="absolute top-0 left-0 right-0 pointer-events-none overflow-visible" style={{ height: '100%', zIndex: 2 }}>
        {leaves.map((leaf) => (
          <div
            key={leaf.id}
            className="absolute"
            style={{
              left: `${leaf.left}%`,
              top: '-60px',
              fontSize: `${leaf.size}px`,
              animation: `fallLeaf ${leaf.duration}s linear ${leaf.delay}s infinite`,
              opacity: 1,
              filter: 'drop-shadow(0 4px 8px rgba(249,115,22,0.6))',
              transform: `rotate(${leaf.rotation}deg)`,
            }}
          >
            🍂
          </div>
        ))}

        <style>{`
          @keyframes fallLeaf {
            0% {
              transform: translateY(0) rotate(0deg) translateX(0);
              opacity: 0.9;
            }
            20% {
              transform: translateY(100px) rotate(90deg) translateX(10px);
              opacity: 0.8;
            }
            40% {
              transform: translateY(200px) rotate(180deg) translateX(-15px);
              opacity: 0.7;
            }
            60% {
              transform: translateY(300px) rotate(270deg) translateX(12px);
              opacity: 0.5;
            }
            80% {
              transform: translateY(400px) rotate(360deg) translateX(-10px);
              opacity: 0.3;
            }
            100% {
              transform: translateY(500px) rotate(720deg) translateX(7px);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    </>
  );
};

// Winter Tree Component (Winter) - Blue theme with snowflakes falling
const WinterTree = ({ colors }) => {
  const [snowflakes, setSnowflakes] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const snowflake = {
        id: Date.now() + Math.random(),
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 5 + Math.random() * 4,
        size: Math.random() * 10 + 12,
        rotation: Math.random() * 360,
      };
      setSnowflakes((prev) => [...prev.slice(-35), snowflake]);
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const treeColor = colors?.primary || '#3b82f6';
  const snowColor = colors?.accent || '#60a5fa';

  return (
    <>
      {/* Winter tree with snow-covered branches */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-visible" style={{ height: '100%', minHeight: '400px', zIndex: 1 }}>
        {/* Beautiful Winter Tree Image - Larger for Sidebar */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2" style={{ width: '100%', maxWidth: '280px', height: '380px' }}>
          <svg width="100%" height="380" viewBox="0 0 200 280" preserveAspectRatio="xMidYMid meet" style={{ opacity: 1, filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.4))' }}>
            {/* Tree trunk */}
            <rect x="90" y="180" width="20" height="100" fill="#8B4513" rx="3" />
            <rect x="88" y="200" width="24" height="8" fill="#654321" rx="2" />
            <rect x="88" y="240" width="24" height="8" fill="#654321" rx="2" />
            
            {/* Bare tree branches with snow */}
            <path d="M100 180 Q70 140 50 100" stroke="#8B4513" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M100 180 Q130 140 150 100" stroke="#8B4513" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M100 180 Q85 150 75 120" stroke="#8B4513" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M100 180 Q115 150 125 120" stroke="#8B4513" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M100 180 Q80 160 70 140" stroke="#8B4513" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M100 180 Q120 160 130 140" stroke="#8B4513" strokeWidth="3" fill="none" strokeLinecap="round" />
            
            {/* Snow on branches */}
            <ellipse cx="60" cy="105" rx="10" ry="5" fill="#ffffff" opacity="0.95" />
            <ellipse cx="140" cy="105" rx="10" ry="5" fill="#ffffff" opacity="0.95" />
            <ellipse cx="80" cy="125" rx="8" ry="4" fill="#ffffff" opacity="0.9" />
            <ellipse cx="120" cy="125" rx="8" ry="4" fill="#ffffff" opacity="0.9" />
            <ellipse cx="75" cy="145" rx="6" ry="3" fill="#ffffff" opacity="0.9" />
            <ellipse cx="125" cy="145" rx="6" ry="3" fill="#ffffff" opacity="0.9" />
            
            {/* Snow-covered ground */}
            <ellipse cx="100" cy="275" rx="120" ry="20" fill="#e0f2fe" opacity="0.7" />
            <ellipse cx="100" cy="270" rx="100" ry="15" fill="#ffffff" opacity="0.8" />
          </svg>
        </div>
      </div>

      {/* Falling snowflakes with enhanced animation - More visible */}
      <div className="absolute top-0 left-0 right-0 pointer-events-none overflow-visible" style={{ height: '100%', zIndex: 2 }}>
        {snowflakes.map((snowflake) => (
          <div
            key={snowflake.id}
            className="absolute"
            style={{
              left: `${snowflake.left}%`,
              top: '-40px',
              fontSize: `${snowflake.size}px`,
              animation: `snowfall ${snowflake.duration}s linear ${snowflake.delay}s infinite`,
              opacity: 0.95,
              transform: `rotate(${snowflake.rotation}deg)`,
              filter: 'drop-shadow(0 3px 6px rgba(59,130,246,0.5))',
              color: '#ffffff',
            }}
          >
            ❄
          </div>
        ))}

        <style>{`
          @keyframes snowfall {
            0% {
              transform: translateY(0) translateX(0) rotate(0deg);
              opacity: 0.8;
            }
            25% {
              transform: translateY(100px) translateX(10px) rotate(90deg);
              opacity: 0.7;
            }
            50% {
              transform: translateY(200px) translateX(-10px) rotate(180deg);
              opacity: 0.6;
            }
            75% {
              transform: translateY(300px) translateX(15px) rotate(270deg);
              opacity: 0.4;
            }
            100% {
              transform: translateY(400px) translateX(-15px) rotate(360deg);
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
      return <CoconutTree colors={colors} />;
    case 'leaves':
      return <AutumnTree colors={colors} />;
    case 'snow':
      return <WinterTree colors={colors} />;
    default:
      return null;
  }
};

export default SeasonalElements;

