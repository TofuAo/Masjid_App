import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import resolveApiBaseUrl from '../utils/apiBaseUrl';

/**
 * Custom hook for masjid location settings
 * Provides real-time sync across all components
 * Automatically refetches when window gains focus or periodically
 */
const DEFAULT_LOCATION = {
  latitude: 3.808236,
  longitude: 103.328054,
  radius: 100
};

const sanitizeNumber = (value, fallback, min = -Infinity, max = Infinity) => {
  const parsed = parseFloat(value);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(parsed, min), max);
};

export const useMasjidLocation = (options = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    refetchOnFocus = true
  } = options;

  const [masjidLocation, setMasjidLocation] = useState({ ...DEFAULT_LOCATION });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMasjidLocation = useCallback(async () => {
    try {
      setError(null);
      // Use axios directly without auth token for public endpoint
      const response = await axios.get(`${resolveApiBaseUrl()}/settings/masjid-location`, {
        headers: {
          'Content-Type': 'application/json'
        },
        // Explicitly don't send Authorization header - remove any default
        validateStatus: (status) => status < 500 // Don't throw on 401, handle it
      });

      // Handle axios response structure
      const data = response.data;
      if (data.success && data.data) {
        setMasjidLocation({
          latitude: sanitizeNumber(data.data.latitude, DEFAULT_LOCATION.latitude, -90, 90),
          longitude: sanitizeNumber(data.data.longitude, DEFAULT_LOCATION.longitude, -180, 180),
          radius: sanitizeNumber(data.data.radius, DEFAULT_LOCATION.radius, 1, 10000)
        });
      } else {
        // Use defaults
        setMasjidLocation({ ...DEFAULT_LOCATION });
      }
    } catch (err) {
      console.error('Failed to fetch masjid location:', err);
      setError(err);
      // Use defaults on error
      setMasjidLocation({ ...DEFAULT_LOCATION });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMasjidLocation();
  }, [fetchMasjidLocation]);

  // Auto-refresh on interval
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMasjidLocation();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchMasjidLocation]);

  // Refetch when window gains focus (admin might have updated settings in another tab)
  useEffect(() => {
    if (!refetchOnFocus) return;

    const handleFocus = () => {
      fetchMasjidLocation();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnFocus, fetchMasjidLocation]);

  // Listen for custom event when settings are updated
  useEffect(() => {
    const handleSettingsUpdate = () => {
      fetchMasjidLocation();
    };

    window.addEventListener('masjidLocationUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('masjidLocationUpdated', handleSettingsUpdate);
  }, [fetchMasjidLocation]);

  return {
    masjidLocation,
    loading,
    error,
    refetch: fetchMasjidLocation
  };
};

