import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';

const HelpTooltip = ({ 
  content, 
  position = 'top',
  size = 'default',
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  const sizeClasses = {
    small: 'text-xs p-2 max-w-xs',
    default: 'text-sm p-3 max-w-sm',
    large: 'text-base p-4 max-w-md'
  };

  return (
    <div className={`relative inline-block ${className}`} ref={tooltipRef}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="text-blue-500 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full transition-colors"
        aria-label="Bantuan"
      >
        <HelpCircle className={`${size === 'small' ? 'w-4 h-4' : 'w-5 h-5'}`} />
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Tooltip */}
          <div
            className={`absolute z-50 bg-gray-800 text-white rounded-lg shadow-xl ${positionClasses[position]} ${sizeClasses[size]}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                {typeof content === 'string' ? (
                  <p>{content}</p>
                ) : (
                  content
                )}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="ml-2 text-gray-300 hover:text-white focus:outline-none"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Arrow */}
            <div
              className={`absolute w-0 h-0 ${
                position === 'top' ? 'top-full border-t-gray-800 border-t-4 border-x-transparent border-x-4' :
                position === 'bottom' ? 'bottom-full border-b-gray-800 border-b-4 border-x-transparent border-x-4' :
                position === 'left' ? 'left-full border-l-gray-800 border-l-4 border-y-transparent border-y-4' :
                'right-full border-r-gray-800 border-r-4 border-y-transparent border-y-4'
              }`}
              style={{
                [position === 'top' ? 'left' : position === 'bottom' ? 'left' : position === 'left' ? 'top' : 'top']: '50%',
                transform: position === 'left' || position === 'right' 
                  ? 'translateY(-50%)' 
                  : 'translateX(-50%)'
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default HelpTooltip;

