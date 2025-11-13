import express from 'express';
import { body } from 'express-validator';
import { checkIn, checkOut, getCheckInHistory, getStaffList, getTodayStatus, quickCheckIn, quickCheckOut, quickCheckInShift, quickCheckOutShift, quickGetLastAction } from '../controllers/staffCheckInController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const checkInValidation = [
  body('latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be a valid coordinate'),
  body('longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be a valid coordinate')
];

const quickCheckInValidation = [
  body('icNumber')
    .notEmpty()
    .withMessage('IC Number is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be a valid coordinate'),
  body('longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be a valid coordinate')
];

const quickLastActionValidation = [
  body('icNumber')
    .notEmpty()
    .withMessage('IC Number is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Public routes (no authentication required)
// Quick check-in/out with IC and password
router.post('/quick-check-in', quickCheckInValidation, quickCheckIn);
router.post('/quick-check-out', quickCheckInValidation, quickCheckOut);
router.post('/quick-check-in-shift', quickCheckInValidation, quickCheckInShift);
router.post('/quick-check-out-shift', quickCheckInValidation, quickCheckOutShift);
router.post('/quick-last-action', quickLastActionValidation, quickGetLastAction);

// Protected routes (require authentication)
router.use(authenticateToken);

// Staff listing (admin only)
router.get('/staff', requireRole(['admin']), getStaffList);

// Check-in
router.post('/check-in', checkInValidation, checkIn);

// Check-out
router.post('/check-out', checkInValidation, checkOut);

// Get today's status
router.get('/today-status', getTodayStatus);

// Get check-in history
router.get('/history', getCheckInHistory);

export default router;
