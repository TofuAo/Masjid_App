import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../controllers/notificationController.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getNotifications);
router.post('/:id/read', markNotificationRead);
router.post('/mark-all-read', markAllNotificationsRead);

export default router;
