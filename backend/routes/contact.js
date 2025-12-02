import express from 'express';
import { body } from 'express-validator';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import {
  submitContactForm,
  getContactSubmissions
} from '../controllers/contactController.js';

const router = express.Router();

// Validation middleware
const contactFormValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Nama diperlukan')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nama mestilah antara 2 hingga 100 aksara'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Emel diperlukan')
    .isEmail()
    .withMessage('Format emel tidak sah'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Nombor telefon diperlukan')
    .matches(/^(\+?6?01)[0-46-9]-?[0-9]{7,8}$/)
    .withMessage('Format nombor telefon tidak sah'),
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subjek diperlukan')
    .isLength({ min: 3, max: 200 })
    .withMessage('Subjek mestilah antara 3 hingga 200 aksara'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Mesej diperlukan')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Mesej mestilah antara 10 hingga 2000 aksara'),
  body('contact_method')
    .optional()
    .isIn(['email', 'whatsapp', 'both'])
    .withMessage('Kaedah perhubungan tidak sah')
];

// Public endpoint - anyone can submit contact form
router.post('/', contactFormValidation, submitContactForm);

// Admin only - view contact submissions
router.get(
  '/submissions',
  authenticateToken,
  requireRole(['admin']),
  getContactSubmissions
);

export default router;

