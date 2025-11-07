import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { exportDatabase, getExportHistory, downloadExportFile } from '../controllers/exportController.js';

const router = Router();

router.post(
  '/database',
  authenticateToken,
  requireRole(['admin']),
  exportDatabase
);

router.get(
  '/history',
  authenticateToken,
  requireRole(['admin']),
  getExportHistory
);

router.get(
  '/download/:fileName',
  authenticateToken,
  requireRole(['admin']),
  downloadExportFile
);

export default router;


