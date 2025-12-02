/**
 * GPS Utilities for accurate location tracking
 * Implements coordinate averaging and smoothing to reduce GPS noise
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export function calculateDistanceBetweenPoints(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Calculate average of multiple GPS coordinates
 * @param {Array<{latitude: number, longitude: number, accuracy?: number}>} readings - Array of GPS readings
 * @returns {{latitude: number, longitude: number, accuracy: number}} Averaged coordinates
 */
export function averageCoordinates(readings) {
  if (!readings || readings.length === 0) {
    return null;
  }

  // Filter out invalid readings
  const validReadings = readings.filter(
    (r) => r && typeof r.latitude === 'number' && typeof r.longitude === 'number' && 
           !isNaN(r.latitude) && !isNaN(r.longitude) &&
           r.latitude >= -90 && r.latitude <= 90 &&
           r.longitude >= -180 && r.longitude <= 180
  );

  if (validReadings.length === 0) {
    return null;
  }

  // Simple average for latitude and longitude
  const avgLat = validReadings.reduce((sum, r) => sum + r.latitude, 0) / validReadings.length;
  const avgLon = validReadings.reduce((sum, r) => sum + r.longitude, 0) / validReadings.length;

  // Average accuracy (or use worst accuracy if available)
  const avgAccuracy = validReadings.reduce((sum, r) => sum + (r.accuracy || 50), 0) / validReadings.length;

  return {
    latitude: avgLat,
    longitude: avgLon,
    accuracy: avgAccuracy
  };
}

/**
 * Filter outliers from GPS readings using median absolute deviation (MAD)
 * @param {Array<{latitude: number, longitude: number}>} readings - Array of GPS readings
 * @param {number} maxDeviationMeters - Maximum deviation from median in meters (default: 50m)
 * @returns {Array} Filtered readings without outliers
 */
export function filterOutliers(readings, maxDeviationMeters = 50) {
  if (!readings || readings.length <= 2) {
    return readings || [];
  }

  // Calculate median coordinates
  const sortedLat = [...readings].map(r => r.latitude).sort((a, b) => a - b);
  const sortedLon = [...readings].map(r => r.longitude).sort((a, b) => a - b);
  const medianLat = sortedLat[Math.floor(sortedLat.length / 2)];
  const medianLon = sortedLon[Math.floor(sortedLon.length / 2)];

  // Filter readings that are too far from median
  const filtered = readings.filter((reading) => {
    const distance = calculateDistanceBetweenPoints(
      reading.latitude,
      reading.longitude,
      medianLat,
      medianLon
    );
    return distance <= maxDeviationMeters;
  });

  // If filtering removed too many readings, return original (might be legitimate movement)
  if (filtered.length < readings.length * 0.5) {
    return readings;
  }

  return filtered;
}

/**
 * Get accurate GPS location by collecting multiple readings and averaging
 * @param {Object} options - Configuration options
 * @param {number} options.sampleCount - Number of readings to collect (default: 5)
 * @param {number} options.sampleInterval - Interval between readings in ms (default: 1000)
 * @param {number} options.maxAccuracy - Maximum acceptable accuracy in meters (default: 50)
 * @param {number} options.timeout - Total timeout in ms (default: 15000)
 * @param {number} options.maxDeviation - Maximum deviation for outlier filtering in meters (default: 50)
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number}>} Averaged GPS coordinates
 */
export function getAccurateLocation(options = {}) {
  const {
    sampleCount = 5,
    sampleInterval = 1000,
    maxAccuracy = 50,
    timeout = 15000,
    maxDeviation = 50
  } = options;

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    const readings = [];
    let watchId = null;
    let timeoutId = null;
    let sampleCountId = null;

    const cleanup = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      if (sampleCountId !== null) {
        clearTimeout(sampleCountId);
      }
    };

    // Set overall timeout
    timeoutId = setTimeout(() => {
      cleanup();
      if (readings.length === 0) {
        reject(new Error('Location request timed out'));
      } else {
        // Use whatever readings we have
        const filtered = filterOutliers(readings, maxDeviation);
        const averaged = averageCoordinates(filtered);
        if (averaged) {
          resolve(averaged);
        } else {
          reject(new Error('Failed to calculate accurate location'));
        }
      }
    }, timeout);

    // Start watching position
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        // Check accuracy threshold
        if (accuracy && accuracy > maxAccuracy) {
          // Still collect but mark as less accurate
          console.warn(`GPS accuracy ${accuracy}m exceeds threshold ${maxAccuracy}m`);
        }

        readings.push({
          latitude,
          longitude,
          accuracy: accuracy || 50
        });

        // Stop collecting after enough samples
        if (readings.length >= sampleCount) {
          cleanup();

          // Filter outliers and average
          const filtered = filterOutliers(readings, maxDeviation);
          const averaged = averageCoordinates(filtered);

          if (averaged) {
            resolve(averaged);
          } else {
            reject(new Error('Failed to calculate accurate location'));
          }
        }
      },
      (error) => {
        cleanup();
        let errorMessage = 'Unable to retrieve your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
          default:
            errorMessage = 'An unknown error occurred.';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: timeout,
        maximumAge: 0
      }
    );

    // Fallback: if we don't get enough readings, use what we have after sampleInterval * sampleCount
    sampleCountId = setTimeout(() => {
      if (readings.length > 0 && watchId !== null) {
        cleanup();
        const filtered = filterOutliers(readings, maxDeviation);
        const averaged = averageCoordinates(filtered);
        if (averaged) {
          resolve(averaged);
        } else {
          reject(new Error('Failed to calculate accurate location'));
        }
      }
    }, sampleInterval * sampleCount + 2000);
  });
}

