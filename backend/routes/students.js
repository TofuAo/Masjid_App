import express from 'express';
import { body, param } from 'express-validator';
import {
  getSelf,           // ← MODIFICATION 1 (new)
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentStats
} from '../controllers/studentController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { isValidPhoneFormat } from '../utils/phoneNormalizer.js';
import { normalizePhoneMiddleware } from '../middleware/normalizePhone.js';
import { requirePicApproval } from '../middleware/picApproval.js';
import { pool } from '../config/database.js';
import { fetchStudentByPhone } from '../services/studentService.js';

const normalizePhoneForQuery = (value) => (typeof value === 'string' ? value.replace(/-/g, '') : value);

const router = express.Router();

// Validation rules for creating students
const studentValidation = [
  body('nama')
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('telefon')
    .notEmpty().withMessage('Nombor telefon diperlukan')
    .custom((value) => {
      if (!isValidPhoneFormat(value)) {
        throw new Error('IC must be 12 digits (format: 123456-78-9012 or 123456789012)');
      }
      return true;
    }),
  body('umur')
    .isInt({ min: 5, max: 100 }).withMessage('Age must be between 5 and 100'),
  body('alamat')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 10, max: 500 }).withMessage('Address must be between 10 and 500 characters'),
  body('kelas_id')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      return Number.isInteger(Number(value));
    })
    .withMessage('Class ID must be a valid integer or empty'),
  body('status')
    .optional()
    .isIn(['aktif', 'tidak_aktif'])
    .withMessage('Status must be one of: aktif, tidak_aktif'),
  body('tarikh_daftar')
    .isISO8601().withMessage('Registration date must be a valid date'),
  body('email').isEmail().withMessage('Must be a valid email'),
  body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 chars long')
];

// Validation rules for updating students
const studentUpdateValidation = [
  body('nama')
    .optional()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('telefon')
    .optional()
    .custom((value) => {
      if (value && !isValidPhoneFormat(value)) {
        throw new Error('IC must be 12 digits (format: 123456-78-9012 or 123456789012)');
      }
      return true;
    }),
  body('umur')
    .optional()
    .isInt({ min: 5, max: 100 }).withMessage('Age must be between 5 and 100'),
  body('alamat')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 10, max: 500 }).withMessage('Address must be between 10 and 500 characters'),
  body('kelas_id')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      return Number.isInteger(Number(value));
    })
    .withMessage('Class ID must be a valid integer or empty'),
  // ── MODIFICATION 2: 'tamat' added to allowed status values ──
  body('status')
    .optional()
    .isIn(['aktif', 'tidak_aktif', 'cuti', 'pending', 'tamat'])
    .withMessage('Status mesti salah satu daripada: aktif, tidak_aktif, cuti, pending, tamat'),
  body('tarikh_daftar')
    .optional()
    .isISO8601().withMessage('Registration date must be a valid date'),
  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (!value || value.trim() === '') return true;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) throw new Error('Must be a valid email');
      return true;
    })
    .withMessage('Must be a valid email'),
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

// Apply authentication to all routes
router.use(authenticateToken);
// GET /api/students/me  — student views their own full profile
router.get('/me', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const ic = req.user.ic;
    const [rows] = await db.query(
      `SELECT u.IC as ic, u.nama, u.email, u.telefon, u.alamat, u.status,
              u.created_at, u.updated_at,
              s.kelas_id, s.tarikh_daftar, s.no_kecemasan,
              k.nama_kelas
       FROM users u
       LEFT JOIN students s ON s.student_ic = u.IC
       LEFT JOIN kelas k ON k.id = s.kelas_id
       WHERE u.IC = ?`,
      [ic]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Profil tidak dijumpai.' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── MODIFICATION 1: GET /api/students/me ────────────────────
// Student views their own full profile.
// MUST be declared BEFORE /:ic to prevent Express treating "me" as a param.
// requireRole(['student']) ensures only students can call this.


// ── Standard routes (unchanged order/logic) ─────────────────
router.get('/', getAllStudents);
router.get('/stats', getStudentStats);
router.get('/:ic', icValidation, normalizePhoneMiddleware, getStudentById);

router.post(
  '/',
  requireRole(['admin', 'staff', 'pic']),
  studentValidation,
  normalizePhoneMiddleware,
  normalizePhoneMiddleware,
  requirePicApproval({
    actionKey: 'students:create',
    entityType: 'student',
    message: 'Permintaan menambah pelajar dihantar untuk kelulusan admin.',
    prepare: async (req) => ({
      metadata: {
        summary: `Tambah pelajar ${req.body?.nama || ''}`,
        nama: req.body?.nama,
        ic: req.body?.ic
      }
    })
  }),
  createStudent
);

router.put(
  '/:ic',
  requireRole(['admin', 'staff', 'pic']),
  icValidation,
  studentUpdateValidation,
  normalizePhoneMiddleware,
  normalizePhoneMiddleware,
  requirePicApproval({
    actionKey: 'students:update',
    entityType: 'student',
    message: 'Permintaan kemaskini pelajar dihantar untuk kelulusan admin.',
    prepare: async (req) => {
      console.log('requirePicApproval prepare: IC from params:', req.params.telefon);
      let student = await fetchStudentByPhone(req.params.telefon);

      if (!student && req.params.telefon) {
        const cleanedIc = normalizePhoneForQuery(req.params.telefon);
        if (!student && cleanedIc) {
          student = await fetchStudentByPhone(cleanedIc);
        }
      }

      if (!student && req.params.telefon) {
        const cleanedIc = normalizePhoneForQuery(req.params.telefon);
        if (cleanedIc.length === 12) {
          const normalizedIc = `${cleanedIc.substring(0, 6)}-${cleanedIc.substring(6, 8)}-${cleanedIc.substring(8, 12)}`;
          if (normalizedIc && normalizedIc !== req.params.telefon) {
            student = await fetchStudentByPhone(normalizedIc);
          }
        }
      }

      if (!student) {
        console.error('requirePicApproval: Student not found after all attempts. IC:', req.params.telefon);
        const error = new Error('Pelajar tidak dijumpai.');
        error.status = 404;
        throw error;
      }

      console.log('requirePicApproval: Found student:', student.telefon, student.nama);
      const cleanedIc = normalizePhoneForQuery(student.telefon || req.params.telefon);

      return {
        entityId: cleanedIc,
        metadata: {
          summary: `Kemaskini pelajar ${student.nama}`,
          current: student,
          requested: {
            ...req.body,
            ic: normalizePhoneForQuery(req.body?.ic || student.telefon || cleanedIc)
          }
        }
      };
    }
  }),
  updateStudent
);

router.delete(
  '/:ic',
  requireRole(['admin', 'pic']),
  (req, res, next) => {
    req.originalIc = req.params.telefon;
    next();
  },
  normalizePhoneMiddleware,
  requirePicApproval({
    actionKey: 'students:delete',
    entityType: 'student',
    message: 'Permintaan padam pelajar dihantar untuk kelulusan admin.',
    prepare: async (req) => {
      const ic = req.params.telefon || req.originalIc;
      if (!ic) {
        const error = new Error('IC pelajar diperlukan.');
        error.status = 400;
        throw error;
      }

      const cleanedIc = normalizePhoneForQuery(ic);
      console.log('[PIC Delete Prepare] Looking up student with IC:', ic, 'cleaned:', cleanedIc);

      // Strategy 1: Direct match
      let [rows] = await pool.execute(
        `SELECT u.telefon, u.nama, u.email, u.telefon, s.kelas_id, s.tarikh_daftar
         FROM users u
         LEFT JOIN students s ON u.telefon = s.user_telefon
         WHERE u.telefon = ? AND u.role = 'student'`,
        [ic]
      );

      // Strategy 2: Cleaned IC
      if (rows.length === 0 && cleanedIc !== ic && cleanedIc.length === 12) {
        [rows] = await pool.execute(
          `SELECT u.telefon, u.nama, u.email, u.telefon, s.kelas_id, s.tarikh_daftar
           FROM users u
           LEFT JOIN students s ON u.telefon = s.user_telefon
           WHERE REPLACE(u.telefon, '-', '') = ? AND u.role = 'student'`,
          [cleanedIc]
        );
      }

      // Strategy 3: Case-insensitive
      if (rows.length === 0) {
        [rows] = await pool.execute(
          `SELECT u.telefon, u.nama, u.email, u.telefon, s.kelas_id, s.tarikh_daftar
           FROM users u
           LEFT JOIN students s ON u.telefon = s.user_telefon
           WHERE UPPER(u.telefon) = UPPER(?) AND u.role = 'student'`,
          [ic]
        );
      }

      // Strategy 4: Original IC from URL
      if (rows.length === 0 && req.originalIc && req.originalIc !== ic) {
        [rows] = await pool.execute(
          `SELECT u.telefon, u.nama, u.email, u.telefon, s.kelas_id, s.tarikh_daftar
           FROM users u
           LEFT JOIN students s ON u.telefon = s.user_telefon
           WHERE u.telefon = ? AND u.role = 'student'`,
          [req.originalIc]
        );
      }

      if (rows.length === 0) {
        const error = new Error('Pelajar tidak dijumpai.');
        error.status = 404;
        throw error;
      }

      return {
        entityId: rows[0].ic,
        metadata: {
          summary: `Padam pelajar ${rows[0].nama}`,
          current: rows[0]
        }
      };
    }
  }),
  deleteStudent
);

export default router;
