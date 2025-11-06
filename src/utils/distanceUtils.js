/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
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
 * Check if user is within radius of masjid
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @param {number} masjidLat - Masjid latitude
 * @param {number} masjidLon - Masjid longitude
 * @param {number} radius - Allowed radius in meters
 * @returns {object} { within: boolean, distance: number }
 */
export function isWithinRadius(userLat, userLon, masjidLat, masjidLon, radius) {
  if (!userLat || !userLon || !masjidLat || !masjidLon || !radius) {
    return { within: false, distance: null };
  }

  const distance = calculateDistance(userLat, userLon, masjidLat, masjidLon);
  return {
    within: distance <= radius,
    distance: distance
  };
}

