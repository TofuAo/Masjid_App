import { normalizePhone } from '../utils/icNormalizer.js';

/**
 * Middleware to normalize IC numbers in request body and params
 */
export const normalizePhoneMiddleware = (req, res, next) => {
  // Normalize IC in body (only if normalization succeeds)
  if (req.body.ic) {
    const normalized = normalizePhone(req.body.ic);
    if (normalized) {
      req.body.ic = normalized;
    }
  }
  if (req.body.ic_number) {
    const normalized = normalizePhone(req.body.ic_number);
    if (normalized) {
      req.body.ic_number = normalized;
    }
  }
  if (req.body.guru_telefon) {
    const normalized = normalizePhone(req.body.guru_telefon);
    if (normalized) {
      req.body.guru_telefon = normalized;
    }
  }
  if (req.body.student_phone) {
    const normalized = normalizePhone(req.body.student_phone);
    if (normalized) {
      req.body.student_phone = normalized;
    }
  }
  if (req.body.icNumber) {
    const normalized = normalizePhone(req.body.icNumber);
    if (normalized) {
      req.body.icNumber = normalized;
    }
  }

  // Normalize IC in attendance_data array (for bulk attendance)
  if (req.body.attendance_data && Array.isArray(req.body.attendance_data)) {
    req.body.attendance_data = req.body.attendance_data.map(item => {
      if (item.student_phone) {
        const normalized = normalizePhone(item.student_phone);
        return { ...item, student_phone: normalized || item.student_phone };
      }
      return item;
    });
  }

  // Normalize IC in params (only if normalization succeeds, otherwise keep original)
  // This preserves special student IDs like SSITIHAWA001, SPUTERIZULAIQHA001, etc.
  if (req.params.telefon) {
    const normalized = normalizePhone(req.params.telefon);
    if (normalized) {
      req.params.telefon = normalized;
    }
    // If normalization returns null (invalid format like special student IDs), keep original
  }
  if (req.params.student_phone) {
    const normalized = normalizePhone(req.params.student_phone);
    if (normalized) {
      req.params.student_phone = normalized;
    }
    // If normalization returns null (invalid format like special student IDs), keep original
  }

  next();
};

