import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import {
  exportDatabase,
  getExportHistory,
  downloadExportFile,
  archiveYearData,
  verifyBackupIntegrity,
} from '../controllers/exportController.js';

const router = Router();

router.post(
  '/database',
  authenticateToken,
  requireRole(['admin']),
  exportDatabase
);

router.post(
  '/archive-year',
  authenticateToken,
  requireRole(['admin']),
  archiveYearData
);

router.post(
  '/verify-integrity',
  authenticateToken,
  requireRole(['admin']),
  verifyBackupIntegrity
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



