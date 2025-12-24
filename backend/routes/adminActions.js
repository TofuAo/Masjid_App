import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import {
  listUndoableActions,
  undoAction,
  listValidators,
  undoValidators
} from '../controllers/adminActionController.js';
import { pool } from '../config/database.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole(['admin']));

router.get('/', listValidators, listUndoableActions);
router.post('/:id/undo', undoValidators, undoAction);

// Diagnostic endpoint to check all snapshots (including expired/undone)
router.get('/debug/all-snapshots', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, entity_type, entity_id, operation, created_at, expires_at, was_undone, created_by
       FROM admin_action_snapshots
       ORDER BY created_at DESC
       LIMIT 100`
    );
    
    // Count by entity type
    const byType = {};
    rows.forEach(row => {
      byType[row.entity_type] = (byType[row.entity_type] || 0) + 1;
    });
    
    res.json({
      success: true,
      count: rows.length,
      byType,
      snapshots: rows
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Diagnostic endpoint to check attendance snapshots specifically
router.get('/debug/attendance-snapshots', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, entity_type, entity_id, operation, created_at, expires_at, was_undone, created_by, entity_identifier
       FROM admin_action_snapshots
       WHERE entity_type = 'attendance'
       ORDER BY created_at DESC
       LIMIT 50`
    );
    
    res.json({
      success: true,
      count: rows.length,
      snapshots: rows
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint to check if any attendance records exist and get one for testing
router.get('/debug/test-attendance', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, student_ic, class_id, tarikh, status 
       FROM attendance 
       ORDER BY id DESC 
       LIMIT 5`
    );
    
    res.json({
      success: true,
      count: rows.length,
      records: rows,
      message: 'These attendance IDs can be used for testing deletion'
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;


