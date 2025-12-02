import { pool } from '../config/database.js';

export const DEFAULT_MASJID_LATITUDE = 3.808236;
export const DEFAULT_MASJID_LONGITUDE = 103.328054;
export const DEFAULT_MASJID_RADIUS = 100;

const MASJID_LOCATION_KEYS = [
  'masjid_latitude',
  'masjid_longitude',
  'masjid_checkin_radius'
];

export async function fetchMasjidLocationFromSettings() {
  const location = {
    latitude: DEFAULT_MASJID_LATITUDE,
    longitude: DEFAULT_MASJID_LONGITUDE,
    radius: DEFAULT_MASJID_RADIUS
  };

  try {
    const [settings] = await pool.execute(
      `SELECT setting_key, setting_value 
         FROM settings 
        WHERE setting_key IN (?, ?, ?)`,
      MASJID_LOCATION_KEYS
    );

    settings.forEach(({ setting_key, setting_value }) => {
      const numericValue = parseFloat(setting_value);
      if (Number.isNaN(numericValue)) {
        return;
      }

      if (setting_key === 'masjid_latitude') {
        location.latitude = Math.min(Math.max(numericValue, -90), 90);
      } else if (setting_key === 'masjid_longitude') {
        location.longitude = Math.min(Math.max(numericValue, -180), 180);
      } else if (setting_key === 'masjid_checkin_radius' && numericValue > 0) {
        location.radius = numericValue;
      }
    });
  } catch (error) {
    console.error('Failed to fetch masjid location from settings:', error);
  }

  return location;
}

