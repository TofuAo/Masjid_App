/**
 * Safely parses JSON from MySQL JSON column
 * MySQL JSON columns can return either objects or strings depending on the driver
 * @param {any} value - The value to parse (could be object, string, or null)
 * @param {any} defaultValue - Default value if parsing fails (default: [])
 * @returns {any} - Parsed value or default
 */
export const safeParseJSON = (value, defaultValue = []) => {
  if (!value) {
    return defaultValue;
  }
  
  // If already an object/array, return as is
  if (typeof value === 'object') {
    return Array.isArray(value) ? value : (Array.isArray(defaultValue) ? defaultValue : value);
  }
  
  // If it's a string, try to parse it
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      // Ensure it matches the expected type
      if (Array.isArray(defaultValue)) {
        return Array.isArray(parsed) ? parsed : defaultValue;
      }
      return parsed;
    } catch (e) {
      console.warn('Failed to parse JSON:', e);
      return defaultValue;
    }
  }
  
  return defaultValue;
};

