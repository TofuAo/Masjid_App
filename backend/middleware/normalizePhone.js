import { normalizePhone } from '../utils/phoneNormalizer.js';

/**
 * Middleware to normalize phone numbers in request body
 */
export const normalizePhoneMiddleware = (req, res, next) => {
  // Normalize phone in body
  if (req.body.telefon) {
    req.body.telefon = normalizePhone(req.body.telefon);
  }
  if (req.body.phone) {
    req.body.phone = normalizePhone(req.body.phone);
  }

  next();
};

