/**
 * Utility functions for consistent API response handling
 * Ensures all API responses are handled uniformly across the application
 */

/**
 * Safely extracts data array from API response
 * Handles various response formats:
 * - Direct array: [1, 2, 3]
 * - Object with data: { success: true, data: [...] }
 * - Object with nested data: { data: { data: [...] } }
 * @param {any} response - The API response
 * @param {any} defaultValue - Default value if extraction fails (default: [])
 * @returns {Array} - Extracted data array
 */
export const extractDataArray = (response, defaultValue = []) => {
  if (!response) return defaultValue;
  
  // If already an array, return it
  if (Array.isArray(response)) {
    return response;
  }
  
  // If response has data property
  if (response.data) {
    // If data is an array, return it
    if (Array.isArray(response.data)) {
      return response.data;
    }
    // If data has nested data property
    if (response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
  }
  
  // If response has success and data
  if (response.success && response.data) {
    if (Array.isArray(response.data)) {
      return response.data;
    }
  }
  
  // Fallback to default
  return defaultValue;
};

/**
 * Safely extracts a single data object from API response
 * @param {any} response - The API response
 * @param {any} defaultValue - Default value if extraction fails (default: null)
 * @returns {Object|null} - Extracted data object
 */
export const extractDataObject = (response, defaultValue = null) => {
  if (!response) return defaultValue;
  
  // If response is already an object (not array), return it
  if (typeof response === 'object' && !Array.isArray(response)) {
    // If it has a data property, return that
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      return response.data;
    }
    // If it has success and data
    if (response.success && response.data) {
      return response.data;
    }
    // Otherwise return the response itself
    return response;
  }
  
  // If it's an array with one item, return that item
  if (Array.isArray(response) && response.length > 0) {
    return response[0];
  }
  
  return defaultValue;
};

/**
 * Safely extracts error message from error object
 * @param {any} error - The error object
 * @param {string} defaultMessage - Default error message
 * @returns {string} - Error message
 */
export const extractErrorMessage = (error, defaultMessage = 'An error occurred') => {
  if (!error) return defaultMessage;
  
  // If error is a string, return it
  if (typeof error === 'string') {
    return error;
  }
  
  // If error has message property
  if (error.message) {
    return error.message;
  }
  
  // If error has response.data.message
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  // If error has errors array
  if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
    return error.errors.map(e => e.message || e.msg || e).join(', ');
  }
  
  return defaultMessage;
};

/**
 * Checks if API response indicates success
 * @param {any} response - The API response
 * @returns {boolean} - True if response indicates success
 */
export const isSuccessResponse = (response) => {
  if (!response) return false;
  
  // If response has success property
  if (typeof response.success === 'boolean') {
    return response.success;
  }
  
  // If response is an array or object with data, consider it successful
  if (Array.isArray(response) || (response.data !== undefined)) {
    return true;
  }
  
  return false;
};

