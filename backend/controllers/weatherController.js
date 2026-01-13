import { pool } from '../config/database.js';
import axios from 'axios';
import { fetchMasjidLocationFromSettings } from '../utils/masjidLocation.js';

const WEATHERSTACK_API_KEY = '976bb168d3b26651c1276f2ca8e21153';
const WEATHERSTACK_API_URL = 'https://api.weatherstack.com/current';

// Get today's date key for caching (YYYY-MM-DD format)
function getTodayDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Check if cached weather data is for today
async function getCachedWeather() {
  try {
    const dateKey = getTodayDateKey();
    const [cache] = await pool.execute(
      'SELECT setting_value FROM settings WHERE setting_key = ?',
      [`weather_cache_${dateKey}`]
    );

    if (cache.length > 0 && cache[0].setting_value) {
      try {
        return JSON.parse(cache[0].setting_value);
      } catch (e) {
        // Invalid JSON, clear cache
        await pool.execute(
          'DELETE FROM settings WHERE setting_key = ?',
          [`weather_cache_${dateKey}`]
        );
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting cached weather:', error);
    return null;
  }
}

// Cache weather data with today's date key
async function cacheWeather(weatherData) {
  try {
    const dateKey = getTodayDateKey();
    const cacheValue = JSON.stringify(weatherData);
    
    // Delete old weather caches (keep only today's)
    await pool.execute(
      'DELETE FROM settings WHERE setting_key LIKE ? AND setting_key != ?',
      ['weather_cache_%', `weather_cache_${dateKey}`]
    );

    // Store today's cache
    await pool.execute(
      `INSERT INTO settings (setting_key, setting_value, setting_type, description) 
       VALUES (?, ?, 'json', 'Weather cache for specific date') 
       ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = CURRENT_TIMESTAMP`,
      [`weather_cache_${dateKey}`, cacheValue, cacheValue]
    );
  } catch (error) {
    console.error('Error caching weather:', error);
  }
}

// Fetch weather from Weatherstack API
async function fetchWeatherFromAPI(lat, lon) {
  try {
    const response = await axios.get(WEATHERSTACK_API_URL, {
      params: {
        access_key: WEATHERSTACK_API_KEY,
        query: `${lat},${lon}`,
        units: 'm' // metric units
      },
      timeout: 10000 // 10 second timeout
    });

    if (response.data && response.data.current) {
      return {
        success: true,
        data: {
          location: response.data.location || {},
          current: response.data.current || {},
          cached: false,
          timestamp: new Date().toISOString()
        }
      };
    } else if (response.data.error) {
      return {
        success: false,
        message: response.data.error.info || 'Weather API error',
        code: response.data.error.code
      };
    }

    return {
      success: false,
      message: 'Invalid response from weather API'
    };
  } catch (error) {
    console.error('Weather API error:', error.message);
    return {
      success: false,
      message: error.response?.data?.error?.info || error.message || 'Failed to fetch weather data'
    };
  }
}

// Get current weather
export const getCurrentWeather = async (req, res) => {
  try {
    // Check cache first
    const cached = await getCachedWeather();
    if (cached && cached.success) {
      // Mark as cached and return
      return res.json({
        ...cached,
        data: {
          ...cached.data,
          cached: true
        }
      });
    }

    // Get masjid location from settings
    const masjidLocation = await fetchMasjidLocationFromSettings();
    const latitude = parseFloat(masjidLocation.latitude) || 3.808236; // Default to masjid coordinates
    const longitude = parseFloat(masjidLocation.longitude) || 103.328054;

    // Fetch from API
    const weatherData = await fetchWeatherFromAPI(latitude, longitude);

    if (weatherData.success) {
      // Cache the result for today
      await cacheWeather(weatherData);
    }

    res.json(weatherData);
  } catch (error) {
    console.error('Get weather error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Clear weather cache (admin only, useful for testing)
export const clearWeatherCache = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can clear weather cache'
      });
    }

    // Delete all weather caches
    await pool.execute(
      'DELETE FROM settings WHERE setting_key LIKE ?',
      ['weather_cache_%']
    );

    res.json({
      success: true,
      message: 'Weather cache cleared successfully'
    });
  } catch (error) {
    console.error('Clear weather cache error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
