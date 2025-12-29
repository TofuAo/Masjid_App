import express from 'express';
import { body, param } from 'express-validator';
import {
  getAttendance,
  markAttendance,
  bulkMarkAttendance,
  bulkMarkAttendanceWithProof,
  getAttendanceStats,
  getStudentAttendanceHistory,
  deleteAttendance,
  confirmAttendanceDocument
} from '../controllers/attendanceController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { isValidICFormat } from '../utils/icNormalizer.js';
import { normalizeICMiddleware } from '../middleware/normalizeIC.js';
import { uploadAttendanceProof } from '../middleware/upload.js';
import { requirePicApproval } from '../middleware/picApproval.js';
import { pool } from '../config/database.js';
// Import service to register approval handlers
import '../services/attendanceService.js';

const router = express.Router();

// Validation rules
const attendanceValidation = [
  body('student_ic')
    .custom((value) => {
      if (!isValidICFormat(value)) {
        throw new Error('Student IC must be 12 digits (format: 123456-78-9012 or 123456789012)');
      }
      return true;
    }),
  body('class_id')
    .isInt()
    .withMessage('Class ID must be a valid integer'),
  body('tarikh')
    .isISO8601()
    .withMessage('Date must be a valid date'),
  body('status')
    .isIn(['Hadir', 'Tidak Hadir', 'Cuti'])
    .withMessage('Status must be one of: Hadir, Tidak Hadir, Cuti'),
];

const bulkAttendanceValidation = [
  body('class_id')
    .isInt()
    .withMessage('Class ID must be a valid integer'),
  body('tarikh')
    .isISO8601()
    .withMessage('Date must be a valid date'),
  body('attendance_data')
    .isArray({ min: 1 })
    .withMessage('Attendance data must be a non-empty array'),
  body('attendance_data.*.student_ic')
    .custom((value) => {
      if (!isValidICFormat(value)) {
        throw new Error('Student IC must be 12 digits (format: 123456-78-9012 or 123456789012)');
      }
      return true;
    }),
  body('attendance_data.*.status')
    .isIn(['Hadir', 'Tidak Hadir', 'Cuti'])
    .withMessage('Status must be one of: Hadir, Tidak Hadir, Cuti'),
];

const icValidation = [
  param('student_ic')
    .custom((value) => {
      if (!isValidICFormat(value)) {
        throw new Error('IC must be 12 digits (format: 123456-78-9012 or 123456789012)');
      }
      return true;
    })
];

const idValidation = [
  param('id')
    .isInt()
    .withMessage('ID must be a valid integer')
];

// Apply authentication to all routes
router.use(authenticateToken);

// ============================================
// CLEAR ROUTING LOGGING - Track all requests
// ============================================
router.use((req, res, next) => {
  // Log ALL requests to attendance router for debugging
  if (req.method === 'DELETE' || req.path.match(/\d+$/)) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`[ATTENDANCE ROUTER] 🔴🔴🔴 REQUEST REACHED ATTENDANCE ROUTER 🔴🔴🔴`);
    console.log(`[ATTENDANCE ROUTER] Method: ${req.method}`);
    console.log(`[ATTENDANCE ROUTER] Path: ${req.path}`);
    console.log(`[ATTENDANCE ROUTER] URL: ${req.url}`);
    console.log(`[ATTENDANCE ROUTER] Original URL: ${req.originalUrl}`);
    console.log(`[ATTENDANCE ROUTER] Base URL: ${req.baseUrl}`);
    console.log(`[ATTENDANCE ROUTER] User: ${req.user?.ic} (${req.user?.role})`);
    console.log(`[ATTENDANCE ROUTER] Params:`, req.params);
    console.log(`[ATTENDANCE ROUTER] Timestamp: ${new Date().toISOString()}`);
    if (req.method === 'DELETE') {
      console.log(`[ATTENDANCE ROUTER] 🔴🔴🔴 DELETE REQUEST DETECTED IN ROUTER 🔴🔴🔴`);
    }
    console.log(`${'='.repeat(80)}\n`);
  }
  next();
});

// Routes
router.get('/', getAttendance);
router.get('/stats', getAttendanceStats);
router.get('/student/:student_ic', icValidation, normalizeICMiddleware, getStudentAttendanceHistory);
router.post(
  '/',
  requireRole(['admin', 'staff', 'teacher', 'pic']),
  attendanceValidation,
  normalizeICMiddleware,
  requirePicApproval({
    actionKey: 'attendance:create',
    entityType: 'attendance',
    message: 'Permintaan kehadiran dihantar untuk kelulusan admin.',
    prepare: async (req) => {
      const { student_ic, class_id, tarikh } = req.body;
      // Try to find existing attendance to determine if this is create or update
      const attendanceDate = tarikh || new Date().toISOString().split('T')[0];
      const [existing] = await pool.execute(
        'SELECT id, status FROM attendance WHERE student_ic = ? AND class_id = ? AND tarikh = ?',
        [student_ic, class_id, attendanceDate]
      );
      return {
        entityId: existing.length > 0 ? existing[0].id.toString() : null,
        metadata: {
          summary: existing.length > 0 
            ? `Kemaskini kehadiran untuk ${student_ic}` 
            : `Tambah kehadiran untuk ${student_ic}`,
          student_ic,
          class_id,
          tarikh: attendanceDate,
          current_status: existing.length > 0 ? existing[0].status : null
        }
      };
    }
  }),
  markAttendance
);
router.post(
  '/bulk',
  requireRole(['admin', 'staff', 'teacher', 'pic']),
  bulkAttendanceValidation,
  normalizeICMiddleware,
  requirePicApproval({
    actionKey: 'attendance:bulk-create',
    entityType: 'attendance',
    message: 'Permintaan kehadiran bulk dihantar untuk kelulusan admin.',
    prepare: async (req) => {
      const { class_id, tarikh, attendance_data } = req.body;
      const attendanceDate = tarikh || new Date().toISOString().split('T')[0];
      return {
        payload: {
          class_id,
          tarikh: attendanceDate,
          attendance_data
        },
        metadata: {
          summary: `Tambah kehadiran bulk untuk kelas ${class_id} pada ${attendanceDate}`,
          class_id,
          tarikh: attendanceDate,
          record_count: attendance_data?.length || 0
        }
      };
    }
  }),
  bulkMarkAttendance
);
router.post(
  '/bulk-with-proof',
  requireRole(['admin', 'staff', 'teacher', 'pic']),
  uploadAttendanceProof,
  normalizeICMiddleware,
  requirePicApproval({
    actionKey: 'attendance:bulk-create-with-proof',
    entityType: 'attendance',
    message: 'Permintaan kehadiran bulk dengan bukti dihantar untuk kelulusan admin.',
    prepare: async (req) => {
      const { class_id, tarikh, attendance_data } = req.body;
      const attendanceDate = tarikh || new Date().toISOString().split('T')[0];
      const proofImagePath = req.file ? `uploads/${req.file.filename}` : null;
      const markedBy = req.user?.ic || null;
      
      // Parse attendance_data if it's a string (from FormData)
      let parsedAttendanceData;
      try {
        parsedAttendanceData = typeof attendance_data === 'string' 
          ? JSON.parse(attendance_data) 
          : attendance_data;
      } catch (parseError) {
        throw new Error('Invalid attendance_data format');
      }
      
      return {
        payload: {
          class_id,
          tarikh: attendanceDate,
          attendance_data: parsedAttendanceData,
          proof_image: proofImagePath,
          marked_by: markedBy
        },
        metadata: {
          summary: `Tambah kehadiran bulk dengan bukti untuk kelas ${class_id} pada ${attendanceDate}`,
          class_id,
          tarikh: attendanceDate,
          record_count: parsedAttendanceData?.length || 0,
          has_proof: !!proofImagePath
        }
      };
    }
  }),
  bulkMarkAttendanceWithProof
);
router.put(
  '/:id',
  requireRole(['admin', 'pic']),
  idValidation,
  attendanceValidation,
  normalizeICMiddleware,
  requirePicApproval({
    actionKey: 'attendance:update',
    entityType: 'attendance',
    message: 'Permintaan kemaskini kehadiran dihantar untuk kelulusan admin.',
    prepare: async (req) => {
      const { id } = req.params;
      const [existing] = await pool.execute(
        'SELECT * FROM attendance WHERE id = ?',
        [id]
      );
      if (existing.length === 0) {
        const error = new Error('Attendance record not found');
        error.status = 404;
        throw error;
      }
      return {
        entityId: id,
        metadata: {
          summary: `Kemaskini kehadiran ID ${id}`,
          current: existing[0],
          requested: req.body
        }
      };
    }
  }),
  markAttendance
);
// ============================================
// DELETE ROUTE - Clear step-by-step flow
// ============================================
router.delete('/:id', 
  // STEP 0: Authentication (REQUIRED for requireRole)
  authenticateToken,
  // STEP 1: Route matched - log immediately
  (req, res, next) => {
    console.log(`\n${'🟢'.repeat(40)}`);
    console.log('[DELETE ROUTE] ✅ ROUTE MATCHED: DELETE /:id');
    console.log(`[DELETE ROUTE] ID: ${req.params.id}`);
    console.log(`[DELETE ROUTE] User: ${req.user?.ic} (${req.user?.role})`);
    console.log(`${'🟢'.repeat(40)}\n`);
    next();
  },
  
  // STEP 2: Role check
  requireRole(['admin', 'pic', 'teacher']),
  (req, res, next) => {
    console.log('[DELETE ROUTE] ✅ STEP 2: Role check passed');
    next();
  },
  
  // STEP 3: Validation
  idValidation,
  (req, res, next) => {
    console.log('[DELETE ROUTE] ✅ STEP 3: ID validation passed');
    next();
  },
  
  // STEP 4: Normalize IC
  normalizeICMiddleware,
  (req, res, next) => {
    console.log('[DELETE ROUTE] ✅ STEP 4: IC normalization passed');
    next();
  },
  
  // STEP 5: PIC approval check (bypasses for admin/teacher, intercepts for PIC)
  requirePicApproval({
    actionKey: 'attendance:delete',
    entityType: 'attendance',
    message: 'Permintaan padam kehadiran dihantar untuk kelulusan admin.',
    prepare: async (req) => {
      console.log('[DELETE ROUTE] STEP 5: PIC approval prepare - user role:', req.user?.role);
      const { id } = req.params;
      const [existing] = await pool.execute(
        'SELECT * FROM attendance WHERE id = ?',
        [id]
      );
      if (existing.length === 0) {
        const error = new Error('Attendance record not found');
        error.status = 404;
        throw error;
      }
      return {
        entityId: id,
        metadata: {
          summary: `Padam kehadiran ID ${id}`,
          current: existing[0]
        }
      };
    }
  }),
  (req, res, next) => {
    console.log('[DELETE ROUTE] ✅ STEP 5: PIC approval check passed (or bypassed for admin/teacher)');
    next();
  },
  
  // STEP 6: Call controller
  (req, res, next) => {
    console.log(`[DELETE ROUTE] ✅ STEP 6: Calling deleteAttendance controller for ID: ${req.params.id}`);
    next();
  },
  deleteAttendance
);

// Catch-all for DELETE requests that don't match (for debugging)
router.delete('*', (req, res, next) => {
  console.log(`\n${'⚠️'.repeat(40)}`);
  console.log('[DELETE ROUTE] ❌ NO ROUTE MATCHED!');
  console.log(`[DELETE ROUTE] Path: ${req.path}`);
  console.log(`[DELETE ROUTE] Original URL: ${req.originalUrl}`);
  console.log(`[DELETE ROUTE] Method: ${req.method}`);
  console.log(`${'⚠️'.repeat(40)}\n`);
  res.status(404).json({
    success: false,
    message: 'DELETE route not found'
  });
});

router.post('/:id/confirm-document', requireRole(['admin', 'pic', 'ib']), idValidation, confirmAttendanceDocument);

// IMPORTANT: This must be LAST - catch-all for any DELETE that doesn't match above
// This helps debug if DELETE requests aren't matching the /:id route
export default router;
