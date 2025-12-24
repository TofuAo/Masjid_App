import React, { useState, useCallback, useRef, useEffect } from 'react';
import { getAccurateLocation } from '../utils/gpsUtils';

/**
 * Custom hook for accurate GPS location tracking
 * Uses coordinate averaging and smoothing to reduce GPS noise
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.sampleCount - Number of readings to collect (default: 5)
 * @param {number} options.sampleInterval - Interval between readings in ms (default: 1000)
 * @param {number} options.maxAccuracy - Maximum acceptable accuracy in meters (default: 50)
 * @param {number} options.timeout - Total timeout in ms (default: 15000)
 * @param {boolean} options.autoGetOnMount - Automatically get location on mount (default: false)
 * @returns {Object} { location, locationError, checkingLocation, getCurrentLocation }
 */
export const useAccurateGPS = (options = {}) => {
  const {
    sampleCount = 5,
    sampleInterval = 1000,
    maxAccuracy = 50,
    timeout = 15000,
    autoGetOnMount = false
  } = options;

  const [location, setLocation] = useState({ latitude: null, longitude: null, accuracy: null });
  const [locationError, setLocationError] = useState(null);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const isGettingLocationRef = useRef(false);

  const getCurrentLocation = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (isGettingLocationRef.current) {
      return;
    }

    isGettingLocationRef.current = true;
    setCheckingLocation(true);
    setLocationError(null);

    try {
      const result = await getAccurateLocation({
        sampleCount,
        sampleInterval,
        maxAccuracy,
        timeout
      });

      setLocation({
        latitude: result.latitude,
        longitude: result.longitude,
        accuracy: result.accuracy
      });
      setLocationError(null);
    } catch (error) {
      const errorMsg = error.message || 'Tidak dapat mendapatkan lokasi anda. Sila pastikan kebenaran lokasi dibenarkan.';
      setLocationError(errorMsg);
      setLocation({ latitude: null, longitude: null, accuracy: null });
    } finally {
      setCheckingLocation(false);
      isGettingLocationRef.current = false;
    }
  }, [sampleCount, sampleInterval, maxAccuracy, timeout]);

  // Auto-get location on mount if requested
  useEffect(() => {
    if (autoGetOnMount) {
      getCurrentLocation();
    }
  }, [autoGetOnMount, getCurrentLocation]);

  return {
    location,
    locationError,
    checkingLocation,
    getCurrentLocation
  };
};

