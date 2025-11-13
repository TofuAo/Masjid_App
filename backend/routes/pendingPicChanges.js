import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import {
  listPendingChanges,
  getPendingChange,
  approvePendingChange,
  rejectPendingChange,
  listValidators,
  decisionValidators,
  getValidators
} from '../controllers/pendingPicChangeController.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole(['admin']));

router.get('/', listValidators, listPendingChanges);
router.get('/:id', getValidators, getPendingChange);
router.post('/:id/approve', decisionValidators, approvePendingChange);
router.post('/:id/reject', decisionValidators, rejectPendingChange);

export default router;

