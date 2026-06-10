// ============================================================
// File: backend/dto/studentDto.js
//
// MODIFICATION 2: Added 'tamat' to the allowed status values
//   in the updateStudentValidation array.
// ============================================================

import { body } from 'express-validator';

// ── Create student validation ─────────────────────────────────
export const createStudentValidation = [
  body('nama')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('ic')
    .trim()
    .matches(/^\d{6}-?\d{2}-?\d{4}$/)
    .withMessage('Format IC tidak sah. Sila masukkan 12 digit nombor IC.'),

  body('umur')
    .optional()
    .isInt({ min: 5, max: 100 })
    .withMessage('Age must be between 5 and 100'),

  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage('Invalid email format'),

  body('telefon')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 1, max: 20 })
    .withMessage('Phone number too long'),

  body('alamat')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 5, max: 500 })
    .withMessage('Address must be between 5 and 500 characters'),

  body('kelas_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Invalid class ID'),
];

// ── Update student validation ─────────────────────────────────
// MODIFICATION 2: 'tamat' is now a valid status value.
export const updateStudentValidation = [
  body('nama')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('umur')
    .optional()
    .isInt({ min: 5, max: 100 })
    .withMessage('Age must be between 5 and 100'),

  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage('Invalid email format'),

  body('telefon')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 1, max: 20 })
    .withMessage('Phone number too long'),

  body('alamat')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 5, max: 500 })
    .withMessage('Address must be between 5 and 500 characters'),

  body('kelas_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Invalid class ID'),

  // ← MODIFICATION 2: added 'tamat' to the allowed list
  body('status')
    .optional()
    .isIn(['aktif', 'tidak_aktif', 'cuti', 'pending', 'tamat'])
    .withMessage(
      "Status mesti salah satu daripada: aktif, tidak_aktif, cuti, pending, tamat"
    ),
];
