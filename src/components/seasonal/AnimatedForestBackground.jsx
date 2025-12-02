import React, { useMemo } from 'react';

/**
 * Animated Fallen Leaves Background Component
 * 
 * Creates a parallax effect with multiple layers of falling leaves
 * that drift down slowly to create depth perception.
 * 
 * CONFIGURATION OPTIONS (adjust these values to customize):
 * - LEAF_DENSITY: Number of leaves per layer (default: 8-12)
 * - FALL_SPEED: Speed of falling animation in seconds (default: 8-15s)
 * - ROTATION_SPEED: Speed of leaf rotation (default: 3-6s)
 * - LAYER_COUNT: Number of parallax layers (default: 3)
 */

// Configuration constants - ADJUST THESE TO CUSTOMIZE
const CONFIG = {
  // Leaf density per layer (more = denser leaves)
  LEAF_DENSITY: {
    LAYER_1: 8,   // Background layer (furthest)
    LAYER_2: 10,  // Middle layer
    LAYER_3: 12,  // Foreground layer (closest)
  },
  
  // Fall speeds (higher = slower falling)
  FALL_SPEED: {
    LAYER_1: 15,  // Slowest (furthest layer)
    LAYER_2: 12,  // Medium
    LAYER_3: 8,   // Fastest (closest layer)
  },
  
  // Leaf rotation animation
  ROTATION_SPEED: {
    MIN: 3,  // Minimum rotation duration in seconds
    MAX: 6,  // Maximum rotation duration in seconds
  },
  
  // Horizontal drift (how much leaves drift sideways while falling)
  DRIFT_AMOUNT: {
    MIN: 20,  // Minimum drift in percentage
    MAX: 50,  // Maximum drift in percentage
  },
  
  // Opacity for depth effect (lower = more transparent, creates depth)
  OPACITY: {
    LAYER_1: 0.15,  // Furthest layer (most transparent)
    LAYER_2: 0.25,  // Middle layer
    LAYER_3: 0.35,  // Closest layer (most opaque)
  },
  
  // Leaf size variation
  LEAF_SIZE: {
    LAYER_1: { MIN: 8, MAX: 12 },   // Smallest (furthest)
    LAYER_2: { MIN: 12, MAX: 18 },  // Medium
    LAYER_3: { MIN: 18, MAX: 28 },  // Largest (closest)
  },
};

// Leaf colors for autumn effect
const LEAF_COLORS = [
  '#d2691e', // Chocolate
  '#cd853f', // Peru
  '#daa520', // Goldenrod
  '#b8860b', // Dark goldenrod
  '#8b4513', // Saddle brown
  '#a0522d', // Sienna
  '#d2b48c', // Tan
];

// Simple leaf SVG component - lightweight and scalable
const LeafSVG = ({ 
  size, 
  x, 
  y, 
  layer, 
  fallSpeed, 
  rotationSpeed,
  driftAmount,
  opacity,
  leafId,
  color
}) => {
  // Generate unique animation names for each leaf
  const fallAnimationName = `leafFall-${leafId}`;
  const rotationAnimationName = `leafRotate-${leafId}`;
  
  // Leaf SVG path - simple maple/autumn leaf shape
  const leafPath = `
    M ${size * 0.5} ${size * 0.1}
    Q ${size * 0.3} ${size * 0.2} ${size * 0.2} ${size * 0.4}
    Q ${size * 0.15} ${size * 0.5} ${size * 0.2} ${size * 0.6}
    Q ${size * 0.25} ${size * 0.7} ${size * 0.35} ${size * 0.75}
    Q ${size * 0.4} ${size * 0.8} ${size * 0.5} ${size * 0.85}
    Q ${size * 0.6} ${size * 0.8} ${size * 0.65} ${size * 0.75}
    Q ${size * 0.75} ${size * 0.7} ${size * 0.8} ${size * 0.6}
    Q ${size * 0.85} ${size * 0.5} ${size * 0.8} ${size * 0.4}
    Q ${size * 0.7} ${size * 0.2} ${size * 0.5} ${size * 0.1}
    Z
  `;
  
  // Starting position (off-screen top)
  const startY = -size * 2;
  const endY = 100 + size; // Off-screen bottom
  
  return (
    <>
      <g
        transform={`translate(${x}, ${y})`}
        style={{
          opacity,
        }}
      >
        {/* Leaf with outline and shading */}
        <g
          style={{
            animation: `${fallAnimationName} ${fallSpeed}s linear infinite, ${rotationAnimationName} ${rotationSpeed}s linear infinite`,
          }}
        >
          {/* Shadow layer (darkest, behind) */}
          <path
            d={leafPath}
            fill="#8b4513"
            opacity={opacity * 0.3}
            transform="translate(1, 1)"
          />
          
          {/* Main leaf with outline */}
          <path
            d={leafPath}
            fill={color}
            stroke="#8b4513"
            strokeWidth={size * 0.02}
            opacity={opacity}
          />
          
          {/* Highlight layer (lighter, on top) */}
          <path
            d={leafPath}
            fill={color}
            opacity={opacity * 0.6}
            transform="translate(-0.5, -0.5) scale(0.7)"
            style={{
              transformOrigin: `${size * 0.5}px ${size * 0.5}px`,
            }}
          />
          
          {/* Vein details */}
          <line
            x1={size * 0.5}
            y1={size * 0.1}
            x2={size * 0.5}
            y2={size * 0.85}
            stroke="#8b4513"
            strokeWidth={size * 0.01}
            opacity={opacity * 0.8}
          />
          <line
            x1={size * 0.5}
            y1={size * 0.4}
            x2={size * 0.3}
            y2={size * 0.5}
            stroke="#8b4513"
            strokeWidth={size * 0.008}
            opacity={opacity * 0.6}
          />
          <line
            x1={size * 0.5}
            y1={size * 0.4}
            x2={size * 0.7}
            y2={size * 0.5}
            stroke="#8b4513"
            strokeWidth={size * 0.008}
            opacity={opacity * 0.6}
          />
        </g>
      </g>
      
      {/* Inline styles for this specific leaf's animations */}
      <style>{`
        @keyframes ${fallAnimationName} {
          0% {
            transform: translateY(${startY}%) translateX(0);
          }
          50% {
            transform: translateY(${endY * 0.5}%) translateX(${driftAmount}%);
          }
          100% {
            transform: translateY(${endY}%) translateX(${driftAmount * 2}%);
          }
        }
        
        @keyframes ${rotationAnimationName} {
          0% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(90deg);
          }
          50% {
            transform: rotate(180deg);
          }
          75% {
            transform: rotate(270deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
};

// Leaf Layer Component - represents one parallax layer
const LeafLayer = ({ 
  layerNumber, 
  leafCount, 
  fallSpeed, 
  opacity,
  leafSize 
}) => {
  // Generate random leaf positions with staggered start times for seamless loop
  const leaves = useMemo(() => {
    return Array.from({ length: leafCount }, (_, i) => {
      // Stagger leaves horizontally across the width
      const baseX = (i * (100 / leafCount)) + (Math.random() * 10 - 5);
      const baseY = -20 - (Math.random() * 30); // Start leaves above viewport
      const size = leafSize.MIN + Math.random() * (leafSize.MAX - leafSize.MIN);
      const rotationSpeed = CONFIG.ROTATION_SPEED.MIN + Math.random() * (CONFIG.ROTATION_SPEED.MAX - CONFIG.ROTATION_SPEED.MIN);
      const driftAmount = (CONFIG.DRIFT_AMOUNT.MIN + Math.random() * (CONFIG.DRIFT_AMOUNT.MAX - CONFIG.DRIFT_AMOUNT.MIN)) * (Math.random() > 0.5 ? 1 : -1);
      // Stagger animation start times for natural flow
      const animationDelay = (i * (fallSpeed / leafCount)) % fallSpeed;
      // Random leaf color
      const color = LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)];
      
      return {
        id: `leaf-${layerNumber}-${i}`,
        x: baseX,
        y: baseY,
        size,
        rotationSpeed,
        driftAmount,
        animationDelay,
        color,
      };
    });
  }, [layerNumber, leafCount, leafSize, fallSpeed]);

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{
        zIndex: layerNumber,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      >
        {leaves.map((leaf) => (
          <g
            key={leaf.id}
            style={{
              animationDelay: `${leaf.animationDelay}s`,
            }}
          >
            <LeafSVG
              size={leaf.size}
              x={leaf.x}
              y={leaf.y}
              layer={layerNumber}
              fallSpeed={fallSpeed}
              rotationSpeed={leaf.rotationSpeed}
              driftAmount={leaf.driftAmount}
              opacity={opacity}
              leafId={leaf.id}
              color={leaf.color}
            />
          </g>
        ))}
      </svg>
    </div>
  );
};

// Main Animated Fallen Leaves Background Component
const AnimatedForestBackground = () => {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{
        zIndex: 0,
        mixBlendMode: 'multiply',
      }}
    >
      {/* Layer 1 - Background (furthest, slowest, most transparent) */}
      <LeafLayer
        layerNumber={1}
        leafCount={CONFIG.LEAF_DENSITY.LAYER_1}
        fallSpeed={CONFIG.FALL_SPEED.LAYER_1}
        opacity={CONFIG.OPACITY.LAYER_1}
        leafSize={CONFIG.LEAF_SIZE.LAYER_1}
      />
      
      {/* Layer 2 - Middle (medium speed and opacity) */}
      <LeafLayer
        layerNumber={2}
        leafCount={CONFIG.LEAF_DENSITY.LAYER_2}
        fallSpeed={CONFIG.FALL_SPEED.LAYER_2}
        opacity={CONFIG.OPACITY.LAYER_2}
        leafSize={CONFIG.LEAF_SIZE.LAYER_2}
      />
      
      {/* Layer 3 - Foreground (closest, fastest, most opaque) */}
      <LeafLayer
        layerNumber={3}
        leafCount={CONFIG.LEAF_DENSITY.LAYER_3}
        fallSpeed={CONFIG.FALL_SPEED.LAYER_3}
        opacity={CONFIG.OPACITY.LAYER_3}
        leafSize={CONFIG.LEAF_SIZE.LAYER_3}
      />
      
      {/* Optional: Add a subtle gradient overlay for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.05) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

export default AnimatedForestBackground;
