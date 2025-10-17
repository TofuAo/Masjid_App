import express from 'express';
import { body } from 'express-validator';
import { login, getProfile, changePassword, register } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

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

// Routes
router.post('/login', loginValidation, login);
router.post('/register', registerValidation, register);
router.get('/profile', authenticateToken, getProfile);
router.put('/change-password', authenticateToken, changePasswordValidation, changePassword);

export default router;
