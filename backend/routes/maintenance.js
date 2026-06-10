import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { requireAdminForMaintenance } from '../middleware/maintenanceMode.js';
import {
  getStatus,
  activate,
  deactivate,
  emergencyStop,
  schedule,
  getHistory,
  getTypes
} from '../controllers/maintenanceController.js';

const router = express.Router();

/**
 * Maintenance Mode Routes
 * 
 * Public routes:
 * - GET /api/maintenance/status - Check maintenance status
 * - GET /api/maintenance/types - Get available maintenance types
 * 
 * Admin-only routes:
 * - POST /api/admin/maintenance/activate - Activate maintenance mode
 * - POST /api/admin/maintenance/deactivate - Deactivate maintenance mode
 * - POST /api/admin/maintenance/emergency - Emergency shutdown
 * - POST /api/admin/maintenance/schedule - Schedule future maintenance
 * - GET /api/admin/maintenance/history - Get maintenance history
 */

// ==================== PUBLIC ROUTES ====================

/**
 * @route   GET /api/maintenance/status
 * @desc    Get current maintenance status
 * @access  Public
 */
router.get('/status', getStatus);

/**
 * @route   GET /api/maintenance/types
 * @desc    Get available maintenance types and their descriptions
 * @access  Public
 */
router.get('/types', getTypes);

// ==================== ADMIN ROUTES ====================

/**
 * @route   POST /api/admin/maintenance/activate
 * @desc    Activate maintenance mode
 * @access  Admin only
 * @body    { modeType, reason, scheduledEnd? }
 */
router.post(
  '/admin/activate',
  authenticateToken,
  requireRole(['admin']),
  requireAdminForMaintenance,
  activate
);

/**
 * @route   POST /api/admin/maintenance/deactivate
 * @desc    Deactivate maintenance mode
 * @access  Admin only
 * @body    { reason? }
 */
router.post(
  '/admin/deactivate',
  authenticateToken,
  requireRole(['admin']),
  requireAdminForMaintenance,
  deactivate
);

/**
 * @route   POST /api/admin/maintenance/emergency
 * @desc    Activate emergency shutdown
 * @access  Admin only
 * @body    { reason }
 */
router.post(
  '/admin/emergency',
  authenticateToken,
  requireRole(['admin']),
  requireAdminForMaintenance,
  emergencyStop
);

/**
 * @route   POST /api/admin/maintenance/schedule
 * @desc    Schedule future maintenance
 * @access  Admin only
 * @body    { startTime, endTime, reason }
 */
router.post(
  '/admin/schedule',
  authenticateToken,
  requireRole(['admin']),
  requireAdminForMaintenance,
  schedule
);

/**
 * @route   GET /api/admin/maintenance/history
 * @desc    Get maintenance history
 * @access  Admin only
 */
router.get(
  '/admin/history',
  authenticateToken,
  requireRole(['admin']),
  requireAdminForMaintenance,
  getHistory
);

export default router;

