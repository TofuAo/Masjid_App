import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import {
  listUndoableActions,
  undoAction,
  listValidators,
  undoValidators
} from '../controllers/adminActionController.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole(['admin']));

router.get('/', listValidators, listUndoableActions);
router.post('/:id/undo', undoValidators, undoAction);

export default router;


