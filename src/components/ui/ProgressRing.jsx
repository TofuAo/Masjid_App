import React from 'react';

/**
 * Circular progress ring for displaying percentage (e.g. attendance rate).
 * @param {number} value - 0-100
 * @param {number} size - diameter in px
 * @param {number} strokeWidth - ring thickness
 * @param {string} color - Tailwind color class for stroke (e.g. 'text-emerald-500')
 * @param {string} trackColor - Tailwind color for track (e.g. 'text-gray-200')
 */
const ProgressRing = ({ value = 0, size = 80, strokeWidth = 8, color = 'text-emerald-500', trackColor = 'text-gray-200', className = '' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clamped = Math.min(100, Math.max(0, Number(value) || 0));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90" aria-hidden="true">
        {/* Track */}
        <circle
          className={trackColor}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress */}
        <circle
          className={color}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span className="absolute text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">
        {Math.round(clamped)}%
      </span>
    </div>
  );
};

export default ProgressRing;
