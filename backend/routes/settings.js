import express from 'express';
import { body, param } from 'express-validator';
import {
  getSettings,
  updateSetting,
  getQRCodeSettings,
  getMasjidLocationSettings
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

// Apply authentication to all routes EXCEPT masjid-location
// Custom middleware that checks path before applying auth
router.use((req, res, next) => {
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
  authenticateToken(req, res, next);
});

// Routes (these require authentication)
router.get('/', getSettings);
router.get('/qr-code', getQRCodeSettings);
router.put('/:key', requireRole(['admin']), settingKeyValidation, updateSettingValidation, updateSetting);

export default router;
