import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import {
  listPicRecycleBin,
  getPicRecycleBinItem,
  cancelPendingPicRequest,
  undoPicAction,
  listValidators,
  getValidators
} from '../controllers/picRecycleBinController.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole(['pic']));

router.get('/', listValidators, listPicRecycleBin);
router.delete('/pending/:id', cancelPendingPicRequest); // Cancel pending request (DELETE method)
router.get('/:id', getValidators, getPicRecycleBinItem);
router.post('/:id/undo', getValidators, undoPicAction); // Create undo request

export default router;

