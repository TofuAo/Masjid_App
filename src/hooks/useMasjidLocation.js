import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/**
 * Custom hook for masjid location settings
 * Provides real-time sync across all components
 * Automatically refetches when window gains focus or periodically
 */
export const useMasjidLocation = (options = {}) => {
  const { 
    autoRefresh = true, 
    refreshInterval = 30000, // 30 seconds
    refetchOnFocus = true 
  } = options;

  const [masjidLocation, setMasjidLocation] = useState({
    latitude: 3.807829297637092,
    longitude: 103.32799643765418,
    radius: 100
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMasjidLocation = useCallback(async () => {
    try {
      setError(null);
      // Use axios directly without auth token for public endpoint
      const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
      const response = await axios.get(`${baseURL}/settings/masjid-location`, {
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
          latitude: data.data.latitude || 3.807829297637092,
          longitude: data.data.longitude || 103.32799643765418,
          radius: data.data.radius || 100
        });
      } else {
        // Use defaults
        setMasjidLocation({
          latitude: 3.807829297637092,
          longitude: 103.32799643765418,
          radius: 100
        });
      }
    } catch (err) {
      console.error('Failed to fetch masjid location:', err);
      setError(err);
      // Use defaults on error
      setMasjidLocation({
        latitude: 3.807829297637092,
        longitude: 103.32799643765418,
        radius: 100
      });
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

