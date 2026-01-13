import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { logError, getErrorMessage, getAdminErrorDetails, isAdmin } from '../utils/errorLogger';

/**
 * Custom hook for comprehensive error handling
 * @param {Object} options - Configuration options
 * @param {string} options.pageName - Name of the page/component
 * @param {boolean} options.showToast - Whether to show toast notifications (default: true)
 * @param {boolean} options.logToConsole - Whether to log to console (default: true)
 * @param {Function} options.onError - Custom error handler callback
 * @returns {Object} Error handling utilities
 */
const useErrorHandler = (options = {}) => {
  const {
    pageName = 'Unknown Page',
    showToast = true,
    logToConsole = true,
    onError,
  } = options;

  const [error, setError] = useState(null);
  const [isError, setIsError] = useState(false);

  /**
   * Handles errors with comprehensive logging and user feedback
   * @param {Error|Object} error - The error to handle
   * @param {Object} context - Additional context (action, user, etc.)
   */
  const handleError = useCallback((error, context = {}) => {
    // Get user info for logging
    let user = null;
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        user = JSON.parse(userStr);
      }
    } catch (e) {
      // Ignore parsing errors
    }

    // Log error with context
    if (logToConsole) {
      logError(error, {
        page: pageName,
        action: context.action || 'Unknown Action',
        user,
        additionalInfo: context.additionalInfo || {},
      });
    }

    // Set error state
    const errorMessage = getErrorMessage(error, context.defaultMessage);
    setError({
      message: errorMessage,
      originalError: error,
      adminDetails: isAdmin() ? getAdminErrorDetails(error) : null,
      ...context,
    });
    setIsError(true);

    // Show toast notification
    if (showToast && !context.silent) {
      toast.error(errorMessage, {
        autoClose: 5000,
        position: 'top-right',
      });
    }

    // Call custom error handler if provided
    if (onError) {
      onError(error, context);
    }
  }, [pageName, showToast, logToConsole, onError]);

  /**
   * Handles async operations with automatic error handling
   * @param {Function} asyncFn - Async function to execute
   * @param {Object} context - Additional context for error handling
   * @returns {Promise} Promise that resolves with the result or rejects with handled error
   */
  const handleAsync = useCallback(async (asyncFn, context = {}) => {
    try {
      setIsError(false);
      setError(null);
      const result = await asyncFn();
      return result;
    } catch (err) {
      handleError(err, context);
      throw err; // Re-throw so caller can handle if needed
    }
  }, [handleError]);

  /**
   * Clears error state
   */
  const clearError = useCallback(() => {
    setError(null);
    setIsError(false);
  }, []);

  /**
   * Wraps an async function with error handling
   * @param {Function} asyncFn - Async function to wrap
   * @param {Object} context - Context for error handling
   * @returns {Function} Wrapped function
   */
  const wrapAsync = useCallback((asyncFn, context = {}) => {
    return async (...args) => {
      try {
        setIsError(false);
        setError(null);
        return await asyncFn(...args);
      } catch (err) {
        handleError(err, {
          ...context,
          action: context.action || asyncFn.name || 'Async Operation',
        });
        throw err;
      }
    };
  }, [handleError]);

  return {
    error,
    isError,
    handleError,
    handleAsync,
    clearError,
    wrapAsync,
  };
};

export default useErrorHandler;
