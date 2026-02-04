import express from 'express';
import { body } from 'express-validator';
import { getMyResitEligible, applyResit } from '../controllers/resitController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', requireRole(['student']), getMyResitEligible);

router.post(
  '/apply',
  requireRole(['student']),
  [body('result_id').isInt().withMessage('result_id must be an integer')],
  applyResit
);

export default router;
