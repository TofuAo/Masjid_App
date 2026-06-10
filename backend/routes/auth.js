import express from 'express';
import { body } from 'express-validator';
import { login, studentLogin, getProfile, changePassword, register, registerExistingUser, adminChangePassword, requestPasswordReset, checkResetOptions, requestPasswordResetEmail, requestPasswordResetPhone, resetPassword, checkProfileComplete, updateProfile, getPendingRegistrations, approveRegistration, rejectRegistration, getPreferences, updatePreferences } from '../controllers/authController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { normalizePhoneMiddleware } from '../middleware/normalizePhone.js';
import { registrationLimiter, passwordResetLimiter, checkResetOptionsLimiter } from '../middleware/security.js';
// Add to imports at top
import { addUserRole, removeUserRole, getUserRoles } from '../controllers/authController.js';


const router = express.Router();
// Add these routes
router.get('/user-roles/:telefon', authenticateToken, requireRole(['admin']), getUserRoles);
router.post('/user-roles', authenticateToken, requireRole(['admin']), addUserRole);
router.delete('/user-roles', authenticateToken, requireRole(['admin']), removeUserRole);
const registerValidation = [
  body('nama')
    .notEmpty()
    .withMessage('Nama is required')
    .trim(),
  body('telefon')
    .notEmpty()
    .withMessage('Nombor telefon diperlukan')
    .custom((value) => {
      // STRICT: Reject T0-prefixed or any IC starting with non-digits
      if (value.toString().trim().startsWith('T0') || /^[^0-9]/.test(value.toString().trim())) {
        throw new Error('Format nombor telefon tidak sah');
      }
      // Remove hyphens and spaces for validation
      const cleaned = value.toString().replace(/[-\s]/g, '');
      if (cleaned.length !== 12) {
        throw new Error('Nombor telefon tidak sah');
      }
      if (!/^\d{12}$/.test(cleaned)) {
        throw new Error('Nombor telefon mesti mengandungi nombor sahaja');
      }
      return true;
    }),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Email must be valid')
    .normalizeEmail(),
  body('telefon')
    .optional({ checkFalsy: true })
    .isLength({ min: 1, max: 20 })
    .withMessage('Telefon must be between 1 and 20 characters'),
  body('umur')
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 150 })
    .withMessage('Umur must be between 1 and 150'),
  body('password')
    .optional({ checkFalsy: true })
    .custom((value) => {
      // Password is optional for student registration
      if (value && value.length > 0 && value.length < 6) {
        throw new Error('Password must be at least 6 characters if provided');
      }
      return true;
    }),
  body('confirmPassword')
    .optional()
    .custom((value, { req }) => {
      if (value && req.body.password && value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    })
];

const registerExistingValidation = [
  body('nama')
    .notEmpty()
    .withMessage('Nama diperlukan')
    .trim(),
  body('telefon')
    .notEmpty()
    .withMessage('Nombor telefon diperlukan')
    .custom((value) => {
      const cleaned = value.toString().replace(/[-\s]/g, '');
      if (cleaned.length !== 12) {
        throw new Error('Nombor telefon tidak sah');
      }
      if (!/^\d{12}$/.test(cleaned)) {
        throw new Error('Nombor telefon mesti mengandungi nombor sahaja');
      }
      return true;
    }),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Kata laluan mestilah sekurang-kurangnya 6 aksara'),
  body('confirmPassword')
    .optional()
    .custom((value, { req }) => {
      if (value && value !== req.body.password) {
        throw new Error('Kata laluan dan pengesahan tidak sepadan');
      }
      return true;
    })
];

// Login validation rules
const loginValidation = [
  body('telefon')
    .notEmpty()
    .withMessage('Nombor telefon diperlukan'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

// Change password validation rules
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
];

// Admin change password validation (no current password required)
const adminChangePasswordValidation = [
  body('user_telefon')
    .notEmpty()
    .withMessage('Nombor telefon pengguna diperlukan'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
];

// Password reset validation
const requestPasswordResetValidation = [
  body('telefon')
    .notEmpty()
    .withMessage('Nombor telefon diperlukan')
    .isLength({ min: 6 })
    .withMessage('IC number must be at least 6 characters')
];

const resetPasswordValidation = [
  body('token')
    .optional()
    .notEmpty()
    .withMessage('Reset token cannot be empty if provided'),
  body('code')
    .optional()
    .isLength({ min: 6, max: 6 })
    .withMessage('Reset code must be 6 digits'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
  body('token', 'code').custom((value, { req }) => {
    // At least one of token or code must be provided
    if (!req.body.token && !req.body.code) {
      throw new Error('Either reset token or code is required');
    }
    return true;
  })
];

// Update profile validation
const updateProfileValidation = [
  body('umur').optional().isInt({ min: 1, max: 150 }).withMessage('Umur must be between 1 and 150'),
  body('telefon').optional().isLength({ min: 1, max: 20 }).withMessage('Telefon must be between 1 and 20 characters'),
  body('email').optional().isEmail().withMessage('Email must be valid'),
  body('alamat').optional().isLength({ max: 255 }).withMessage('Alamat must be at most 255 characters'),
  body('kelas_id').optional().isInt().withMessage('Kelas ID must be an integer'),
  body('tarikh_daftar').optional().isISO8601().withMessage('Tarikh daftar must be a valid date'),
  body('kepakaran').optional().isArray().withMessage('Kepakaran must be an array'),
  body('academic_bio').optional().isLength({ max: 255 }).withMessage('Academic bio must be at most 255 characters'),
  body('class_track').optional().isIn(['Full-Time', 'Part-Time', 'Online', '']).withMessage('Class track must be Full-Time, Part-Time, or Online'),
  body('cover_photo').optional().isLength({ max: 255 }).withMessage('Cover photo path must be at most 255 characters')
];

// Student login validation (IC only, no password)
const studentLoginValidation = [
  body('telefon')
    .notEmpty()
    .withMessage('Nombor telefon diperlukan')
    .custom((value) => {
      const cleaned = value.toString().replace(/[-\s]/g, '');
      if (cleaned.length !== 12) {
        throw new Error('Nombor telefon tidak sah');
      }
      if (!/^\d{12}$/.test(cleaned)) {
        throw new Error('Nombor telefon mesti mengandungi nombor sahaja');
      }
      return true;
    })
];

// Routes with security rate limiting
router.post('/login', loginValidation, normalizePhoneMiddleware, login);
router.post('/student-login', studentLoginValidation, normalizePhoneMiddleware, studentLogin);
router.post('/register', registrationLimiter, registerValidation, normalizePhoneMiddleware, register);
router.post('/self-register', registrationLimiter, registerExistingValidation, normalizePhoneMiddleware, registerExistingUser);
router.get('/profile', authenticateToken, getProfile);
router.get('/profile/complete', authenticateToken, checkProfileComplete);
router.put('/profile', authenticateToken, updateProfileValidation, updateProfile);
router.put('/change-password', authenticateToken, changePasswordValidation, changePassword);
router.put('/admin/change-password', authenticateToken, requireRole(['admin']), adminChangePasswordValidation, normalizePhoneMiddleware, adminChangePassword);
router.post('/forgot-password', passwordResetLimiter, requestPasswordResetValidation, normalizePhoneMiddleware, requestPasswordReset);
router.post('/check-reset-options', checkResetOptionsLimiter, requestPasswordResetValidation, normalizePhoneMiddleware, checkResetOptions);
router.post('/request-reset-email', passwordResetLimiter, requestPasswordResetValidation, normalizePhoneMiddleware, requestPasswordResetEmail);
router.post('/request-reset-phone', passwordResetLimiter, requestPasswordResetValidation, normalizePhoneMiddleware, requestPasswordResetPhone);
router.post('/reset-password', passwordResetLimiter, resetPasswordValidation, resetPassword);

// Admin routes for managing pending registrations
router.get('/pending-registrations', authenticateToken, requireRole(['admin']), getPendingRegistrations);
router.post('/approve-registration', authenticateToken, requireRole(['admin']), body('user_telefon').notEmpty().withMessage('Nombor telefon pengguna diperlukan'), normalizePhoneMiddleware, approveRegistration);
router.post('/reject-registration', authenticateToken, requireRole(['admin']), body('user_telefon').notEmpty().withMessage('Nombor telefon pengguna diperlukan'), normalizePhoneMiddleware, rejectRegistration);

// User preferences routes (available to all authenticated users)
router.get('/preferences', authenticateToken, getPreferences);
router.put('/preferences', authenticateToken, updatePreferences);

export default router;

