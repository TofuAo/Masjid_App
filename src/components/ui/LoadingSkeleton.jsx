import React, { memo } from 'react';

const shimmerBar = 'skeleton-shimmer-bar';

const LoadingSkeleton = memo(function LoadingSkeleton({ type = 'card', count = 1, className = '' }) {
  const renderSkeleton = () => {
    const barClass = `h-full w-full rounded ${shimmerBar}`;
    switch (type) {
      case 'card':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 skeleton-card-entrance overflow-hidden">
            <div className="h-4 rounded mb-4 overflow-hidden">
              <div className={barClass} style={{ width: '75%' }} />
            </div>
            <div className="space-y-3">
              <div className="h-3 rounded overflow-hidden"><div className={barClass} /></div>
              <div className="h-3 rounded overflow-hidden"><div className={barClass} style={{ width: '83%' }} /></div>
              <div className="h-3 rounded overflow-hidden"><div className={barClass} style={{ width: '67%' }} /></div>
            </div>
          </div>
        );
      case 'table':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden skeleton-card-entrance">
            <div className="p-4 border-b border-gray-100">
              <div className="h-4 rounded overflow-hidden w-1/4"><div className={barClass} /></div>
            </div>
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-4 rounded flex-1 overflow-hidden"><div className={barClass} /></div>
                  <div className="h-4 rounded w-24 overflow-hidden"><div className={barClass} /></div>
                  <div className="h-4 rounded w-32 overflow-hidden"><div className={barClass} /></div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'stat':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 skeleton-card-entrance overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <div className={barClass} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="h-3 rounded mb-2 overflow-hidden w-1/2"><div className={barClass} /></div>
                <div className="h-6 rounded overflow-hidden w-1/3"><div className={barClass} /></div>
              </div>
            </div>
          </div>
        );
      case 'list':
        return (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 skeleton-card-entrance overflow-hidden" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="h-4 rounded mb-2 overflow-hidden w-3/4"><div className={barClass} /></div>
                <div className="h-3 rounded overflow-hidden w-1/2"><div className={barClass} /></div>
              </div>
            ))}
          </div>
        );
      default:
        return (
          <div className={`rounded-xl overflow-hidden skeleton-card-entrance ${shimmerBar}`} style={{ height: '8rem' }} />
        );
    }
  };

  if (count === 1) {
    return <div className={className}>{renderSkeleton()}</div>;
  }

  return (
    <div className={className}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="skeleton-card-entrance" style={{ animationDelay: `${i * 60}ms` }}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
});

export default LoadingSkeleton;

