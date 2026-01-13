import React from 'react';

/**
 * Enhanced Skeleton Loading Component
 * Provides various skeleton loading states for different content types
 */
const Skeleton = ({ 
  type = 'text', 
  className = '',
  width,
  height,
  rounded = true,
  count = 1,
  animated = true
}) => {
  const baseClasses = `bg-gray-200 ${animated ? 'animate-pulse' : ''} ${rounded ? 'rounded' : ''}`;
  
  const renderSkeleton = () => {
    switch (type) {
      case 'text':
        return (
          <div 
            className={`${baseClasses} h-4 ${className}`}
            style={{ width: width || '100%' }}
          />
        );
      case 'title':
        return (
          <div 
            className={`${baseClasses} h-6 mb-2 ${className}`}
            style={{ width: width || '60%' }}
          />
        );
      case 'paragraph':
        return (
          <div className={`space-y-2 ${className}`}>
            <div className={`${baseClasses} h-4`} style={{ width: '100%' }} />
            <div className={`${baseClasses} h-4`} style={{ width: '95%' }} />
            <div className={`${baseClasses} h-4`} style={{ width: '85%' }} />
          </div>
        );
      case 'avatar':
        return (
          <div 
            className={`${baseClasses} rounded-full ${className}`}
            style={{ 
              width: width || height || '40px', 
              height: height || width || '40px' 
            }}
          />
        );
      case 'image':
        return (
          <div 
            className={`${baseClasses} ${className}`}
            style={{ 
              width: width || '100%', 
              height: height || '200px' 
            }}
          />
        );
      case 'button':
        return (
          <div 
            className={`${baseClasses} h-10 ${className}`}
            style={{ width: width || '120px' }}
          />
        );
      case 'card':
        return (
          <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
            <div className={`${baseClasses} h-5 w-3/4 mb-4`} />
            <div className="space-y-3">
              <div className={`${baseClasses} h-4 w-full`} />
              <div className={`${baseClasses} h-4 w-5/6`} />
              <div className={`${baseClasses} h-4 w-4/6`} />
            </div>
          </div>
        );
      case 'table':
        return (
          <div className={`bg-white rounded-lg shadow ${className}`}>
            <div className="p-4 border-b">
              <div className={`${baseClasses} h-4 w-1/4`} />
            </div>
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className={`${baseClasses} h-4 flex-1`} />
                  <div className={`${baseClasses} h-4 w-24`} />
                  <div className={`${baseClasses} h-4 w-32`} />
                </div>
              ))}
            </div>
          </div>
        );
      case 'circle':
        return (
          <div 
            className={`${baseClasses} rounded-full ${className}`}
            style={{ 
              width: width || height || '40px', 
              height: height || width || '40px' 
            }}
          />
        );
      case 'rect':
        return (
          <div 
            className={`${baseClasses} ${className}`}
            style={{ 
              width: width || '100%', 
              height: height || '100px' 
            }}
          />
        );
      default:
        return (
          <div 
            className={`${baseClasses} ${className}`}
            style={{ 
              width: width || '100%', 
              height: height || '20px' 
            }}
          />
        );
    }
  };

  if (count === 1) {
    return renderSkeleton();
  }

  return (
    <div className={className}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className={i < count - 1 ? 'mb-2' : ''}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton Group - For complex layouts
 */
export const SkeletonGroup = ({ children, className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {children}
    </div>
  );
};

/**
 * Skeleton Stack - For vertical stacking
 */
export const SkeletonStack = ({ items = 3, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {[...Array(items)].map((_, i) => (
        <Skeleton key={i} type="text" width="100%" />
      ))}
    </div>
  );
};

export default Skeleton;
