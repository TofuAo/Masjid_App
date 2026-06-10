import express from 'express';
import { body, param } from 'express-validator';
import {
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin
} from '../controllers/adminController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { requireMasterAdmin } from '../middleware/requireMasterAdmin.js';
import { isValidPhoneFormat } from '../utils/phoneNormalizer.js';
import { normalizePhoneMiddleware } from '../middleware/normalizePhone.js';

const router = express.Router();

// Validation rules for creating admin
const createAdminValidation = [
  body('nama')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('telefon')
    .notEmpty()
    .withMessage('Nombor telefon diperlukan')
    .custom((value) => {
      if (!isValidPhoneFormat(value)) {
        throw new Error('IC must be 12 digits (format: 123456-78-9012 or 123456789012)');
      }
      return true;
    }),
  body('telefon')
    .notEmpty()
    .withMessage('Phone number is required')
    .custom((value) => {
      if (!isValidPhoneFormat(value)) {
        throw new Error('Phone must be a valid Malaysian mobile number (format: 012-3456789 or 0123456789)');
      }
      return true;
    }),
  body('status')
    .optional()
    .isIn(['aktif', 'tidak_aktif', 'cuti'])
    .withMessage('Status must be one of: aktif, tidak_aktif, cuti'),
  body('email')
    .optional()
    .custom((value) => {
      // Only validate if email is provided
      if (value !== undefined && value !== null && value !== '') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          throw new Error('Must be a valid email');
        }
      }
      return true;
    }),
  body('password')
    .notEmpty()
    .withMessage('Password is required for new admins')
    .isLength({ min: 5 })
    .withMessage('Password must be at least 5 chars long')
];

// Validation rules for updating admin
const updateAdminValidation = [
  body('nama')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('telefon')
    .notEmpty()
    .withMessage('Nombor telefon diperlukan')
    .custom((value) => {
      if (!isValidPhoneFormat(value)) {
        throw new Error('IC must be 12 digits (format: 123456-78-9012 or 123456789012)');
      }
      return true;
    }),
  body('telefon')
    .optional()
    .custom((value) => {
      if (value && !isValidPhoneFormat(value)) {
        throw new Error('Phone must be a valid Malaysian mobile number (format: 012-3456789 or 0123456789)');
      }
      return true;
    }),
  body('status')
    .optional()
    .isIn(['aktif', 'tidak_aktif', 'cuti'])
    .withMessage('Status must be one of: aktif, tidak_aktif, cuti'),
  body('email')
    .optional()
    .custom((value) => {
      // Only validate if email is provided
      if (value !== undefined && value !== null && value !== '') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          throw new Error('Must be a valid email');
        }
      }
      return true;
    }),
  body('password')
    .optional()
    .custom((value) => {
      // Only validate if password is provided
      if (value !== undefined && value !== null && value !== '') {
        if (String(value).trim().length < 5) {
          throw new Error('Password must be at least 5 chars long');
        }
      }
      return true;
    }),
    body('role')
    .optional()
    .isIn(['pic', 'ib'])
    .withMessage('Peranan mesti "pic" atau "ib".')
];

const icValidation = [
  param('ic')
    .custom((value) => {
      if (!isValidPhoneFormat(value)) {
        throw new Error('IC must be 12 digits (format: 123456-78-9012 or 123456789012)');
      }
      return true;
    })
];

// GET routes: All admins can view admin details
router.get('/', authenticateToken, requireRole(['admin']), getAllAdmins);
router.get('/:ic', authenticateToken, requireRole(['admin']), icValidation, normalizePhoneMiddleware, getAdminById);

// POST, PUT, DELETE routes: Only master admin can create/update/delete admins
router.post('/', authenticateToken, requireRole(['admin']), requireMasterAdmin, createAdminValidation, normalizePhoneMiddleware, normalizePhoneMiddleware, createAdmin);
router.put('/:ic', authenticateToken, requireRole(['admin']), requireMasterAdmin, icValidation, updateAdminValidation, normalizePhoneMiddleware, normalizePhoneMiddleware, updateAdmin);
router.delete('/:ic', authenticateToken, requireRole(['admin']), requireMasterAdmin, icValidation, normalizePhoneMiddleware, deleteAdmin);

export default router;


