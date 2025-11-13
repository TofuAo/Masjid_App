/**
 * Input sanitization middleware
 * Prevents XSS attacks by sanitizing user input
 */

import { body, param, query } from 'express-validator';

// HTML sanitization function
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  // Remove potentially dangerous characters and HTML tags
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .trim();
};

// Sanitize object recursively
const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
};

// Middleware to sanitize request body, params, and query
export const sanitizeInput = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  next();
};

// Express-validator sanitization chains
export const sanitizeStringField = (field) => {
  return body(field).customSanitizer((value) => {
    return sanitizeString(value);
  });
};

export const sanitizeParamField = (field) => {
  return param(field).customSanitizer((value) => {
    return sanitizeString(value);
  });
};

export const sanitizeQueryField = (field) => {
  return query(field).customSanitizer((value) => {
    return sanitizeString(value);
  });
};

