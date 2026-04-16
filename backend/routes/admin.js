import express from 'express';
import adminClassesRoutes from './adminClasses.js';
import { getAdminStudentHistory } from '../controllers/adminClassController.js';
import { getPendingApprovalsSummary } from '../controllers/adminController.js';
import { authenticateToken, requirePermission, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/pending-approvals-summary', requireRole(['admin']), getPendingApprovalsSummary);
router.use('/classes', adminClassesRoutes);

router.get('/students/:id/history', requirePermission('class.view'), getAdminStudentHistory);

export default router;
