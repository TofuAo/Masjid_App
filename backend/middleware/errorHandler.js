/**
 * Global Error Handler Middleware
 * Handles all errors consistently across the application
 */

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Database errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Data already exists in the system',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  if (err.code === 'ER_BAD_FIELD_ERROR') {
    return res.status(500).json({
      success: false,
      message: 'Database schema error. Please contact administrator.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Validation errors
  if (err.name === 'ValidationError' || err.type === 'validation') {
    return res.status(400).json({
      success: false,
      message: err.message || 'Validation failed',
      errors: err.errors || []
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message: message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Standard error response formatter
 */
export const sendErrorResponse = (res, statusCode, message, errors = null, devError = null) => {
  const response = {
    success: false,
    message: message
  };

  if (errors) {
    response.errors = errors;
  }

  if (devError && process.env.NODE_ENV === 'development') {
    response.error = devError;
  }

  return res.status(statusCode).json(response);
};

/**
 * Standard success response formatter
 */
export const sendSuccessResponse = (res, statusCode, message, data = null) => {
  const response = {
    success: true,
    message: message
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

