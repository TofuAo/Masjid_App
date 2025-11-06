import express from 'express';
import { body } from 'express-validator';
import { login, getProfile, changePassword, register, adminChangePassword, requestPasswordReset, resetPassword, checkProfileComplete, updateProfile, getPendingRegistrations, approveRegistration, rejectRegistration } from '../controllers/authController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { normalizeICMiddleware } from '../middleware/normalizeIC.js';

const router = express.Router();

const registerValidation = [
  body('nama')
    .notEmpty()
    .withMessage('Nama is required')
    .trim(),
  body('ic_number')
    .notEmpty()
    .withMessage('IC Number is required')
    .custom((value) => {
      // Remove hyphens and spaces for validation
      const cleaned = value.toString().replace(/[-\s]/g, '');
      if (cleaned.length !== 12) {
        throw new Error('IC Number must be exactly 12 digits');
      }
      if (!/^\d{12}$/.test(cleaned)) {
        throw new Error('IC Number must contain only digits');
      }
      return true;
    }),
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be valid')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

// Login validation rules
const loginValidation = [
  body('icNumber')
    .notEmpty()
    .withMessage('IC Number is required'),
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
  body('user_ic')
    .notEmpty()
    .withMessage('User IC is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
];

// Password reset validation
const requestPasswordResetValidation = [
  body('icNumber')
    .notEmpty()
    .withMessage('IC number is required')
    .isLength({ min: 6 })
    .withMessage('IC number must be at least 6 characters')
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
];

// Update profile validation
const updateProfileValidation = [
  body('umur').optional().isInt({ min: 1, max: 150 }).withMessage('Umur must be between 1 and 150'),
  body('telefon').optional().isLength({ min: 1, max: 20 }).withMessage('Telefon must be between 1 and 20 characters'),
  body('email').optional().isEmail().withMessage('Email must be valid'),
  body('kelas_id').optional().isInt().withMessage('Kelas ID must be an integer'),
  body('tarikh_daftar').optional().isISO8601().withMessage('Tarikh daftar must be a valid date'),
  body('kepakaran').optional().isArray().withMessage('Kepakaran must be an array')
];

// Routes
router.post('/login', loginValidation, normalizeICMiddleware, login);
router.post('/register', registerValidation, normalizeICMiddleware, register);
router.get('/profile', authenticateToken, getProfile);
router.get('/profile/complete', authenticateToken, checkProfileComplete);
router.put('/profile', authenticateToken, updateProfileValidation, updateProfile);
router.put('/change-password', authenticateToken, changePasswordValidation, changePassword);
router.put('/admin/change-password', authenticateToken, requireRole(['admin']), adminChangePasswordValidation, normalizeICMiddleware, adminChangePassword);
router.post('/forgot-password', requestPasswordResetValidation, normalizeICMiddleware, requestPasswordReset);
router.post('/reset-password', resetPasswordValidation, resetPassword);

// Admin routes for managing pending registrations
router.get('/pending-registrations', authenticateToken, requireRole(['admin', 'teacher']), getPendingRegistrations);
router.post('/approve-registration', authenticateToken, requireRole(['admin', 'teacher']), body('user_ic').notEmpty().withMessage('User IC is required'), normalizeICMiddleware, approveRegistration);
router.post('/reject-registration', authenticateToken, requireRole(['admin', 'teacher']), body('user_ic').notEmpty().withMessage('User IC is required'), normalizeICMiddleware, rejectRegistration);

export default router;
