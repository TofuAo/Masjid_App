import express from 'express';
import { body, param } from 'express-validator';
import {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} from '../controllers/announcementController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { requirePicApproval } from '../middleware/picApproval.js';
import { pool } from '../config/database.js';

const router = express.Router();

// Validation rules
const announcementValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be one of: draft, published, archived'),
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, normal, high, urgent'),
  body('target_audience')
    .optional()
    .isIn(['all', 'students', 'teachers', 'admin', 'pic'])
    .withMessage('Target audience must be one of: all, students, teachers, admin, pic'),
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
];

const idValidation = [
  param('id')
    .isInt()
    .withMessage('ID must be a valid integer')
];

// Apply authentication to all routes
router.use(authenticateToken);

// Routes - all users can view, only admin can CRUD
router.get('/', getAllAnnouncements);
router.get('/:id', idValidation, getAnnouncementById);
router.post(
  '/',
  requireRole(['admin', 'pic']),
  announcementValidation,
  requirePicApproval({
    actionKey: 'announcements:create',
    entityType: 'announcement',
    message: 'Pengumuman baharu dihantar untuk kelulusan admin.'
  }),
  createAnnouncement
);
router.put(
  '/:id',
  requireRole(['admin', 'pic']),
  idValidation,
  announcementValidation,
  requirePicApproval({
    actionKey: 'announcements:update',
    entityType: 'announcement',
    message: 'Kemaskini pengumuman dihantar untuk kelulusan admin.',
    prepare: async (req) => {
      const { id } = req.params;
      const [rows] = await pool.execute('SELECT * FROM announcements WHERE id = ?', [id]);
      if (rows.length === 0) {
        const error = new Error('Announcement not found');
        error.status = 404;
        throw error;
      }
      const current = rows[0];
      return {
        entityId: id,
        metadata: {
          current,
          summary: `Kemaskini pengumuman "${current.title}"`
        }
      };
    }
  }),
  updateAnnouncement
);
router.delete(
  '/:id',
  requireRole(['admin', 'pic']),
  idValidation,
  requirePicApproval({
    actionKey: 'announcements:delete',
    entityType: 'announcement',
    message: 'Permintaan padam pengumuman dihantar untuk kelulusan admin.',
    prepare: async (req) => {
      const { id } = req.params;
      const [rows] = await pool.execute('SELECT * FROM announcements WHERE id = ?', [id]);
      if (rows.length === 0) {
        const error = new Error('Announcement not found');
        error.status = 404;
        throw error;
      }
      const current = rows[0];
      return {
        entityId: id,
        metadata: {
          current,
          summary: `Padam pengumuman "${current.title}"`
        }
      };
    }
  }),
  deleteAnnouncement
);

export default router;

