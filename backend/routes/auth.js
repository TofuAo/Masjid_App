import express from 'express';
import { body } from 'express-validator';
import { login, getProfile, changePassword, register, adminChangePassword, requestPasswordReset, resetPassword } from '../controllers/authController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { normalizeICMiddleware } from '../middleware/normalizeIC.js';

const router = express.Router();

const registerValidation = [
  body('nama')
    .notEmpty()
    .withMessage('Nama is required'),
  body('email')
    .notEmpty()
    .withMessage('Email is required'),
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
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be a valid email address')
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
];

// Routes
router.post('/login', loginValidation, normalizeICMiddleware, login);
router.post('/register', registerValidation, register);
router.get('/profile', authenticateToken, getProfile);
router.put('/change-password', authenticateToken, changePasswordValidation, changePassword);
router.put('/admin/change-password', authenticateToken, requireRole(['admin']), adminChangePasswordValidation, normalizeICMiddleware, adminChangePassword);
router.post('/forgot-password', requestPasswordResetValidation, requestPasswordReset);
router.post('/reset-password', resetPasswordValidation, resetPassword);

export default router;
