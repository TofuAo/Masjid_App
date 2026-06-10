import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { getHealth } from '../controllers/systemController.js';

const router = Router();

router.get('/health', authenticateToken, authorizeRoles('admin'), getHealth);

export default router;

