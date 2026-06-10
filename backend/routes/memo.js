import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import * as memoController from '../controllers/memoController.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', memoController.list);
router.post('/', requireRole(['admin', 'pic']), memoController.create);
router.put('/:id', requireRole(['admin', 'pic']), memoController.update);
router.delete('/:id', requireRole(['admin', 'pic']), memoController.remove);

export default router;

