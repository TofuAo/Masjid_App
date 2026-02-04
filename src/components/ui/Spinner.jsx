import React, { memo } from 'react';

/**
 * Lightweight spinner for loading feedback. 200ms feel for perceived speed.
 */
const Spinner = memo(function Spinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-10 h-10 border-[3px]',
  };
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-block rounded-full border-emerald-200 border-t-emerald-600 animate-spin-smooth ${sizeClasses[size]} ${className}`}
    />
  );
});

export default Spinner;
