import { normalizeIC } from '../utils/icNormalizer.js';

/**
 * Middleware to normalize IC numbers in request body and params
 */
export const normalizeICMiddleware = (req, res, next) => {
  // Normalize IC in body
  if (req.body.ic) {
    req.body.ic = normalizeIC(req.body.ic);
  }
  if (req.body.guru_ic) {
    req.body.guru_ic = normalizeIC(req.body.guru_ic);
  }
  if (req.body.student_ic) {
    req.body.student_ic = normalizeIC(req.body.student_ic);
  }
  if (req.body.icNumber) {
    req.body.icNumber = normalizeIC(req.body.icNumber);
  }

  // Normalize IC in attendance_data array (for bulk attendance)
  if (req.body.attendance_data && Array.isArray(req.body.attendance_data)) {
    req.body.attendance_data = req.body.attendance_data.map(item => {
      if (item.student_ic) {
        return { ...item, student_ic: normalizeIC(item.student_ic) };
      }
      return item;
    });
  }

  // Normalize IC in params
  if (req.params.ic) {
    req.params.ic = normalizeIC(req.params.ic);
  }
  if (req.params.student_ic) {
    req.params.student_ic = normalizeIC(req.params.student_ic);
  }

  next();
};

