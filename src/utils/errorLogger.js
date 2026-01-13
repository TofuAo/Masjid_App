/**
 * Error Logger Utility
 * Provides comprehensive error logging for admin debugging
 */

/**
 * Logs errors with context information for admin debugging
 * @param {Error|Object} error - The error object
 * @param {Object} context - Additional context (page, action, user, etc.)
 */
export const logError = (error, context = {}) => {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    error: {
      message: error?.message || String(error),
      stack: error?.stack,
      name: error?.name,
      status: error?.status || error?.response?.status,
      statusText: error?.statusText || error?.response?.statusText,
      data: error?.data || error?.response?.data,
    },
    context: {
      page: context.page || 'Unknown',
      action: context.action || 'Unknown',
      user: context.user ? {
        ic: context.user.ic,
        role: context.user.role || context.user.activeRole,
        email: context.user.email,
      } : null,
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...context.additionalInfo,
    },
  };

  // Log to console with structured format
  console.error('=== ERROR LOG ===');
  console.error('Timestamp:', errorInfo.timestamp);
  console.error('Page:', errorInfo.context.page);
  console.error('Action:', errorInfo.context.action);
  console.error('Error Message:', errorInfo.error.message);
  console.error('Error Status:', errorInfo.error.status);
  console.error('Error Data:', errorInfo.error.data);
  console.error('User:', errorInfo.context.user);
  console.error('Full Error:', error);
  console.error('Stack Trace:', errorInfo.error.stack);
  console.error('=================');

  // Store error in localStorage for admin review (last 10 errors)
  try {
    const errorHistory = JSON.parse(localStorage.getItem('errorHistory') || '[]');
    errorHistory.unshift(errorInfo);
    // Keep only last 10 errors
    const trimmedHistory = errorHistory.slice(0, 10);
    localStorage.setItem('errorHistory', JSON.stringify(trimmedHistory));
  } catch (e) {
    console.warn('Failed to store error in localStorage:', e);
  }

  // In production, you might want to send to an error tracking service
  // Example: sendToErrorTrackingService(errorInfo);
};

/**
 * Gets user-friendly error message for display
 * @param {Error|Object} error - The error object
 * @param {string} defaultMessage - Default message if error message can't be extracted
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error, defaultMessage = 'Ralat tidak dijangka berlaku.') => {
  if (!error) return defaultMessage;

  // Check for specific error messages
  if (error.message) {
    // Network errors
    if (error.message.includes('Network Error') || error.message.includes('ERR_NETWORK')) {
      return 'Tidak dapat menyambung ke pelayan. Sila semak sambungan internet anda.';
    }
    if (error.message.includes('timeout') || error.message.includes('ECONNABORTED')) {
      return 'Permintaan mengambil masa terlalu lama. Sila cuba lagi.';
    }
    // Auth errors
    if (error.message.includes('token') || error.message.includes('expired') || error.message.includes('unauthorized')) {
      return 'Sesi anda telah tamat tempoh. Sila log masuk semula.';
    }
    // Permission errors
    if (error.message.includes('permission') || error.message.includes('forbidden') || error.message.includes('403')) {
      return 'Anda tidak mempunyai kebenaran untuk melakukan tindakan ini.';
    }
    // Return the error message if it's user-friendly
    if (error.message && !error.message.includes('Error:') && !error.message.includes('at ')) {
      return error.message;
    }
  }

  // Check response data
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Check status codes
  if (error.status || error.response?.status) {
    const status = error.status || error.response.status;
    switch (status) {
      case 400:
        return 'Permintaan tidak sah. Sila semak maklumat yang dimasukkan.';
      case 401:
        return 'Sesi anda telah tamat tempoh. Sila log masuk semula.';
      case 403:
        return 'Anda tidak mempunyai kebenaran untuk melakukan tindakan ini.';
      case 404:
        return 'Sumber yang diminta tidak dijumpai.';
      case 409:
        return 'Data yang dimasukkan sudah wujud.';
      case 422:
        return 'Data yang dimasukkan tidak sah. Sila semak semula.';
      case 429:
        return 'Terlalu banyak permintaan. Sila cuba lagi selepas beberapa saat.';
      case 500:
        return 'Ralat pelayan. Sila hubungi pentadbir sistem.';
      case 502:
        return 'Pelayan tidak dapat dicapai. Sila cuba lagi kemudian.';
      case 503:
        return 'Perkhidmatan tidak tersedia buat masa ini. Sila cuba lagi kemudian.';
      default:
        return `Ralat ${status}. Sila cuba lagi atau hubungi pentadbir.`;
    }
  }

  // Check if it's a network error
  if (error.isNetworkError || error.code === 'ERR_NETWORK') {
    return 'Tidak dapat menyambung ke pelayan. Sila semak sambungan internet anda.';
  }

  // Default message
  return defaultMessage;
};

/**
 * Gets admin-friendly error details for debugging
 * @param {Error|Object} error - The error object
 * @returns {Object} Admin-friendly error details
 */
export const getAdminErrorDetails = (error) => {
  return {
    message: error?.message || String(error),
    status: error?.status || error?.response?.status,
    statusText: error?.statusText || error?.response?.statusText,
    data: error?.response?.data,
    url: error?.config?.url || error?.url,
    method: error?.config?.method || error?.method,
    stack: error?.stack,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Checks if user is admin for showing detailed error info
 * @returns {boolean} True if user is admin
 */
export const isAdmin = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return false;
    const user = JSON.parse(userStr);
    return user.role === 'admin' || user.roles?.includes('admin');
  } catch {
    return false;
  }
};

/**
 * Gets error history from localStorage
 * @returns {Array} Array of error logs
 */
export const getErrorHistory = () => {
  try {
    return JSON.parse(localStorage.getItem('errorHistory') || '[]');
  } catch {
    return [];
  }
};

/**
 * Clears error history
 */
export const clearErrorHistory = () => {
  try {
    localStorage.removeItem('errorHistory');
  } catch (e) {
    console.warn('Failed to clear error history:', e);
  }
};
