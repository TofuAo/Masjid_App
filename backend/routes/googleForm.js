import express from 'express';
import { body, param } from 'express-validator';
import {
  receiveGoogleFormData,
  getClassGoogleFormUrl,
  setClassGoogleFormUrl
} from '../controllers/googleFormController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const googleFormWebhookValidation = [
  body('class_id')
    .isInt()
    .withMessage('Class ID must be a valid integer'),
  body('tarikh')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),
  body('attendance_data')
    .isArray({ min: 1 })
    .withMessage('Attendance data must be a non-empty array'),
  body('attendance_data.*.student_ic')
    .notEmpty()
    .withMessage('Student IC is required'),
  body('attendance_data.*.status')
    .optional()
    .isString()
    .withMessage('Status must be a string'),
  body('secret_key')
    .optional()
    .isString()
    .withMessage('Secret key must be a string')
];

const setFormUrlValidation = [
  body('google_form_url')
    .isURL()
    .withMessage('Google Form URL must be a valid URL')
];

const classIdValidation = [
  param('class_id')
    .isInt()
    .withMessage('Class ID must be a valid integer')
];

// Webhook endpoint (can be called without authentication if using secret_key)
router.post('/webhook', googleFormWebhookValidation, receiveGoogleFormData);

// Admin routes for managing Google Form URLs
router.get('/class/:class_id', authenticateToken, classIdValidation, getClassGoogleFormUrl);
router.put('/class/:class_id', requireRole(['admin']), classIdValidation, setFormUrlValidation, setClassGoogleFormUrl);

export default router;

