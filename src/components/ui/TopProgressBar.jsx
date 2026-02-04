import React, { useEffect, useState, memo } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Thin progress bar at top of page on route change.
 * 200–300ms feel; improves perceived speed.
 */
const TopProgressBar = memo(function TopProgressBar() {
  const [percent, setPercent] = useState(0);
  const [visible, setVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setVisible(true);
    setPercent(0);
    const t1 = setTimeout(() => setPercent(70), 50);
    const t2 = setTimeout(() => setPercent(90), 200);
    let t4;
    const t3 = setTimeout(() => {
      setPercent(100);
      t4 = setTimeout(() => {
        setVisible(false);
        setPercent(0);
      }, 200);
    }, 300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (t4) clearTimeout(t4);
    };
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-0.5 bg-emerald-500/20 overflow-hidden"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-emerald-500 transition-[width] duration-200 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
});

export default TopProgressBar;
