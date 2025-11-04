import express from 'express';
import { body, param } from 'express-validator';
import {
  getSettings,
  updateSetting,
  getQRCodeSettings
} from '../controllers/settingsController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const updateSettingValidation = [
  body('value')
    .optional()
    .isString()
    .withMessage('Value must be a string'),
  body('type')
    .optional()
    .isIn(['text', 'image', 'link', 'json'])
    .withMessage('Type must be one of: text, image, link, json'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
];

const settingKeyValidation = [
  param('key')
    .notEmpty()
    .withMessage('Setting key is required')
    .isString()
    .withMessage('Setting key must be a string')
];

// Apply authentication to all routes
router.use(authenticateToken);

// Routes
router.get('/', getSettings);
router.get('/qr-code', getQRCodeSettings);
router.put('/:key', requireRole(['admin']), settingKeyValidation, updateSettingValidation, updateSetting);

export default router;

