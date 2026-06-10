import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as globalEventsController from '../controllers/globalEventsController.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', globalEventsController.list);

export default router;

