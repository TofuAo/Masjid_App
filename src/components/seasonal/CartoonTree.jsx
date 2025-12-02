import React, { useEffect, useRef } from 'react';

/**
 * Cartoon Tree Component with Falling Leaves Animation
 * Creates a decorative tree with animated falling leaves
 */
const CartoonTree = ({ 
  className = '', 
  enableFallingLeaves = true,
  leafInterval = 400,
  season = 'spring' // 'spring', 'summer', 'autumn', 'winter'
}) => {
  const treeRef = useRef(null);
  const leafIntervalRef = useRef(null);

  useEffect(() => {
    if (!enableFallingLeaves || !treeRef.current) return;

    const createLeaf = () => {
      const leaf = document.createElement('div');
      leaf.classList.add('leaf-fall');
      
      // Random starting position (within tree width)
      const randomLeft = Math.random() * 180 + 10; // 10px to 190px
      leaf.style.left = `${randomLeft}px`;
      
      // Random animation duration (3-6 seconds)
      const randomDuration = 3 + Math.random() * 3;
      leaf.style.animationDuration = `${randomDuration}s`;
      
      // Random delay for staggered effect
      leaf.style.animationDelay = `${Math.random() * 2}s`;
      
      // Random size variation
      const randomSize = 12 + Math.random() * 6; // 12px to 18px
      leaf.style.width = `${randomSize}px`;
      leaf.style.height = `${randomSize}px`;
      
      // Random color variation based on season
      const leafColors = {
        spring: ['#4CAF50', '#66BB6A', '#81C784'],
        summer: ['#66BB6A', '#81C784', '#A5D6A7'],
        autumn: ['#FF9800', '#FFB74D', '#FFCC80', '#8D6E63'],
        winter: ['#E0E0E0', '#F5F5F5', '#FFFFFF']
      };
      
      const colors = leafColors[season] || leafColors.spring;
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      leaf.style.background = randomColor;
      
      if (treeRef.current) {
        treeRef.current.appendChild(leaf);
      }
      
      // Remove leaf after animation completes
      leaf.addEventListener('animationend', () => {
        if (leaf.parentNode) {
          leaf.remove();
        }
      });
    };

    // Create initial leaves
    for (let i = 0; i < 3; i++) {
      setTimeout(() => createLeaf(), i * 200);
    }

    // Create leaves continuously
    leafIntervalRef.current = setInterval(createLeaf, leafInterval);

    return () => {
      if (leafIntervalRef.current) {
        clearInterval(leafIntervalRef.current);
      }
    };
  }, [enableFallingLeaves, leafInterval, season]);

  return (
    <div 
      ref={treeRef}
      className={`cartoon-tree ${season} ${className}`}
      aria-hidden="true"
    >
      {/* Leaves */}
      <div className="leaves">
        <div className="leaf"></div>
      </div>
      
      {/* Trunk */}
      <div className="trunk"></div>
    </div>
  );
};

export default CartoonTree;

