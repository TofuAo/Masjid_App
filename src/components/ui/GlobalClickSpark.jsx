import { useRef, useEffect, useCallback } from 'react';

/**
 * GlobalClickSpark Component
 * Creates animated spark effects at cursor position when clicking anywhere on the page
 * Add this component to your Layout or App to enable global click sparks
 * 
 * @param {string} sparkColor - Color of the sparks (default: '#10b981' - emerald green)
 * @param {number} sparkSize - Size of each spark line (default: 8)
 * @param {number} sparkRadius - Radius of the spark spread (default: 20)
 * @param {number} sparkCount - Number of sparks per click (default: 12)
 * @param {number} duration - Animation duration in ms (default: 500)
 * @param {string} easing - Easing function: 'linear', 'ease-in', 'ease-out', 'ease-in-out' (default: 'ease-out')
 * @param {number} extraScale - Extra scale multiplier for spark distance (default: 1.0)
 * @param {boolean} onlyOnButtons - Only show sparks when clicking buttons (default: true)
 */
const GlobalClickSpark = ({
  sparkColor = '#10b981',
  sparkSize = 8,
  sparkRadius = 20,
  sparkCount = 12,
  duration = 500,
  easing = 'ease-out',
  extraScale = 1.0,
  onlyOnButtons = true
}) => {
  const canvasRef = useRef(null);
  const sparksRef = useRef([]);
  const startTimeRef = useRef(null);

  // Handle canvas resizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Easing function
  const easeFunc = useCallback(
    t => {
      switch (easing) {
        case 'linear':
          return t;
        case 'ease-in':
          return t * t;
        case 'ease-in-out':
          return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        default:
          return t * (2 - t); // ease-out
      }
    },
    [easing]
  );

  // Animation loop - runs continuously
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let isRunning = true;

    const draw = timestamp => {
      if (!isRunning) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Filter and draw sparks
      sparksRef.current = sparksRef.current.filter(spark => {
        const elapsed = timestamp - spark.startTime;
        if (elapsed >= duration) {
          return false;
        }

        const progress = elapsed / duration;
        const eased = easeFunc(progress);
        const distance = eased * sparkRadius * extraScale;
        const lineLength = sparkSize * (1 - eased);

        const x1 = spark.x + distance * Math.cos(spark.angle);
        const y1 = spark.y + distance * Math.sin(spark.angle);
        const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
        const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

        ctx.strokeStyle = sparkColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        return true;
      });

      // Continue animation loop
      animationId = requestAnimationFrame(draw);
    };

    // Start animation loop
    animationId = requestAnimationFrame(draw);

    return () => {
      isRunning = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [sparkColor, sparkSize, sparkRadius, duration, easeFunc, extraScale]);

  // Global click handler
  useEffect(() => {
    const handleGlobalClick = e => {
      // If onlyOnButtons is true, check if the clicked element is a button or has a button ancestor
      if (onlyOnButtons) {
        const target = e.target;
        const isButton = 
          target.tagName === 'BUTTON' ||
          target.closest('button') !== null ||
          target.closest('[role="button"]') !== null ||
          target.closest('a[href]') !== null ||
          target.closest('.cursor-pointer') !== null ||
          target.closest('[onclick]') !== null;
        
        if (!isButton) {
          return;
        }
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      const x = e.clientX;
      const y = e.clientY;

      const now = performance.now();

      const newSparks = Array.from({ length: sparkCount }, (_, i) => ({
        x,
        y,
        angle: (2 * Math.PI * i) / sparkCount,
        startTime: now
      }));

      sparksRef.current.push(...newSparks);
    };

    // Add click listener to document
    document.addEventListener('click', handleGlobalClick, true);

    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, [sparkColor, sparkSize, sparkRadius, sparkCount, duration, easeFunc, extraScale, onlyOnButtons]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
        userSelect: 'none'
      }}
    />
  );
};

export default GlobalClickSpark;

