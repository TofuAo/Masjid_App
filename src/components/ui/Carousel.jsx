import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

/**
 * Carousel Component
 * A responsive carousel/slider component with navigation
 */
const Carousel = ({
  children,
  className = '',
  autoPlay = false,
  interval = 5000,
  showDots = true,
  showArrows = true,
  loop = true,
  slidesToShow = 1,
  slidesToScroll = 1,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const intervalRef = useRef(null);
  const items = React.Children.toArray(children);
  const totalSlides = items.length;

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && autoPlay && totalSlides > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (loop) {
            return (prev + slidesToScroll) % totalSlides;
          }
          return prev < totalSlides - slidesToScroll ? prev + slidesToScroll : prev;
        });
      }, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, autoPlay, interval, totalSlides, slidesToScroll, loop]);

  const goToSlide = (index) => {
    if (index >= 0 && index < totalSlides) {
      setCurrentIndex(index);
    }
  };

  const goToPrevious = () => {
    if (loop) {
      setCurrentIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
    } else {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
    }
  };

  const goToNext = () => {
    if (loop) {
      setCurrentIndex((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
    } else {
      setCurrentIndex((prev) => (prev < totalSlides - 1 ? prev + 1 : prev));
    }
  };

  const handleMouseEnter = () => {
    if (autoPlay) {
      setIsPlaying(false);
    }
  };

  const handleMouseLeave = () => {
    if (autoPlay) {
      setIsPlaying(true);
    }
  };

  return (
    <div
      className={`relative w-full ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Carousel Container */}
      <div className="relative overflow-hidden rounded-lg">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {items.map((item, index) => (
            <div
              key={index}
              className="min-w-full flex-shrink-0"
              style={{ width: `${100 / slidesToShow}%` }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {showArrows && totalSlides > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className={`
              absolute left-2 top-1/2 -translate-y-1/2
              z-10 p-2 rounded-full
              bg-white/90 hover:bg-white
              shadow-lg transition-all
              ${!loop && currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            aria-label="Previous slide"
            disabled={!loop && currentIndex === 0}
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={goToNext}
            className={`
              absolute right-2 top-1/2 -translate-y-1/2
              z-10 p-2 rounded-full
              bg-white/90 hover:bg-white
              shadow-lg transition-all
              ${!loop && currentIndex === totalSlides - 1 ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            aria-label="Next slide"
            disabled={!loop && currentIndex === totalSlides - 1}
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {showDots && totalSlides > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`
                w-2 h-2 rounded-full transition-all
                ${index === currentIndex 
                  ? 'bg-emerald-600 w-8' 
                  : 'bg-gray-300 hover:bg-gray-400'
                }
              `}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Carousel Item
 * Individual slide/item in the carousel
 */
const CarouselItem = ({ children, className = '' }) => {
  return (
    <div className={`w-full ${className}`}>
      {children}
    </div>
  );
};

Carousel.Item = CarouselItem;

export default Carousel;
