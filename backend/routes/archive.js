import express from 'express';
import { requireRole } from '../middleware/auth.js';
import { archiveStudent, unarchiveStudent, getArchivedStudents } from '../services/archiveService.js';

const router = express.Router();

// Get all archived students
router.get(
  '/students',
  requireRole(['admin', 'staff']),
  async (req, res) => {
    try {
      const { search, page = 1, limit = 1000 } = req.query;
      const result = await getArchivedStudents(search, page, limit);
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get archived students error:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }
);

// Archive a student
router.post(
  '/students/:ic',
  requireRole(['admin', 'staff']),
  async (req, res) => {
    try {
      const { ic } = req.params;
      const { reason } = req.body;
      const archivedBy = req.user?.ic;
      
      const result = await archiveStudent(ic, reason, archivedBy);
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Archive student error:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }
);

// Unarchive a student
router.post(
  '/students/:ic/unarchive',
  requireRole(['admin', 'staff']),
  async (req, res) => {
    try {
      const { ic } = req.params;
      
      const result = await unarchiveStudent(ic);
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Unarchive student error:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }
);

export default router;


