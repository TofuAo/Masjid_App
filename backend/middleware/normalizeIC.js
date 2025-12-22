import { normalizeIC } from '../utils/icNormalizer.js';

/**
 * Middleware to normalize IC numbers in request body and params
 */
export const normalizeICMiddleware = (req, res, next) => {
  // Normalize IC in body (only if normalization succeeds)
  if (req.body.ic) {
    const normalized = normalizeIC(req.body.ic);
    if (normalized) {
      req.body.ic = normalized;
    }
  }
  if (req.body.ic_number) {
    const normalized = normalizeIC(req.body.ic_number);
    if (normalized) {
      req.body.ic_number = normalized;
    }
  }
  if (req.body.guru_ic) {
    const normalized = normalizeIC(req.body.guru_ic);
    if (normalized) {
      req.body.guru_ic = normalized;
    }
  }
  if (req.body.student_ic) {
    const normalized = normalizeIC(req.body.student_ic);
    if (normalized) {
      req.body.student_ic = normalized;
    }
  }
  if (req.body.icNumber) {
    const normalized = normalizeIC(req.body.icNumber);
    if (normalized) {
      req.body.icNumber = normalized;
    }
  }

  // Normalize IC in attendance_data array (for bulk attendance)
  if (req.body.attendance_data && Array.isArray(req.body.attendance_data)) {
    req.body.attendance_data = req.body.attendance_data.map(item => {
      if (item.student_ic) {
        const normalized = normalizeIC(item.student_ic);
        return { ...item, student_ic: normalized || item.student_ic };
      }
      return item;
    });
  }

  // Normalize IC in params (only if normalization succeeds, otherwise keep original)
  // This preserves special student IDs like SSITIHAWA001, SPUTERIZULAIQHA001, etc.
  if (req.params.ic) {
    const normalized = normalizeIC(req.params.ic);
    if (normalized) {
      req.params.ic = normalized;
    }
    // If normalization returns null (invalid format like special student IDs), keep original
  }
  if (req.params.student_ic) {
    const normalized = normalizeIC(req.params.student_ic);
    if (normalized) {
      req.params.student_ic = normalized;
    }
    // If normalization returns null (invalid format like special student IDs), keep original
  }

  next();
};

