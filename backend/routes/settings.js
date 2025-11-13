import express from 'express';
import { body, param } from 'express-validator';
import {
  getSettings,
  updateSetting,
  getQRCodeSettings,
  getMasjidLocationSettings,
  getGradeRanges,
  updateGradeRanges
} from '../controllers/settingsController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Public route: Masjid location settings (for check-in)
// MUST be defined before authentication middleware
// This route does NOT require authentication
router.get('/masjid-location', getMasjidLocationSettings);

// Validation rules
const updateSettingValidation = [
  body('value')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value === null || value === undefined || typeof value === 'string') {
        return true;
      }
      throw new Error('Value must be a string or null');
    }),
  body('type')
    .optional()
    .isIn(['text', 'image', 'link', 'json'])
    .withMessage('Type must be one of: text, image, link, json'),
  body('description')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value === null || value === undefined || typeof value === 'string') {
        return true;
      }
      throw new Error('Description must be a string or null');
    })
];

const settingKeyValidation = [
  param('key')
    .notEmpty()
    .withMessage('Setting key is required')
    .isString()
    .withMessage('Setting key must be a string')
];

const gradeRangesValidation = [
  body('ranges')
    .isArray({ min: 1 })
    .withMessage('Ranges must be a non-empty array'),
  body('ranges.*.grade')
    .notEmpty()
    .withMessage('Grade label is required')
    .isString()
    .withMessage('Grade label must be a string'),
  body('ranges.*.min')
    .notEmpty()
    .withMessage('Minimum mark is required')
    .custom((value) => !Number.isNaN(Number(value)))
    .withMessage('Minimum mark must be a number'),
  body('ranges.*.max')
    .optional({ nullable: true })
    .custom((value) => value === null || value === '' || !Number.isNaN(Number(value)))
    .withMessage('Maximum mark must be a number or empty'),
];

// Apply authentication to all routes EXCEPT masjid-location
// Custom middleware that checks path before applying auth
router.use(async (req, res, next) => {
  // Skip authentication for masjid-location endpoint
  const path = req.path || '';
  const originalUrl = req.originalUrl || '';
  
  if (path === '/masjid-location' || 
      path.includes('masjid-location') ||
      originalUrl.includes('/masjid-location') ||
      originalUrl.includes('/api/settings/masjid-location')) {
    // Skip auth for this route
    return next();
  }
  
  // Apply authentication to all other routes
  // authenticateToken is async, so we need to await it or let Express handle the promise
  return authenticateToken(req, res, next);
});

// Routes (these require authentication)
// IMPORTANT: Specific routes must be defined BEFORE parameterized routes (/:key)
router.get('/grade-ranges', getGradeRanges);
router.put('/grade-ranges', requireRole(['admin']), gradeRangesValidation, updateGradeRanges);
router.get('/qr-code', getQRCodeSettings);
router.get('/', getSettings);
router.put('/:key', requireRole(['admin']), settingKeyValidation, updateSettingValidation, updateSetting);

export default router;
