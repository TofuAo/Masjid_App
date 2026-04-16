import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as campusLifeController from '../controllers/campusLifeController.js';

const router = Router();

router.use(authenticateToken);

router.get('/', campusLifeController.list);
router.post('/', campusLifeController.create);
router.get('/:id', campusLifeController.getById);
router.post('/:id/approve', campusLifeController.approve);
router.post('/:id/reject', campusLifeController.reject);

export default router;
