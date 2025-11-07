import { Router } from 'express';
import authRoutes from './auth.js';
import studentRoutes from './students.js';
import teacherRoutes from './teachers.js';
import classRoutes from './classes.js';
import attendanceRoutes from './attendance.js';
import examRoutes from './exams.js';
import feeRoutes from './fees.js';
import resultRoutes from './results.js';
import migrationRoutes from './migration.js';
import settingsRoutes from './settings.js';
import announcementRoutes from './announcements.js';
import googleFormRoutes from './googleForm.js';
import staffCheckInRoutes from './staffCheckIn.js';
import exportRoutes from './export.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/teachers', teacherRoutes);
router.use('/classes', classRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/exams', examRoutes);
router.use('/fees', feeRoutes);
router.use('/results', resultRoutes);
router.use('/migration', migrationRoutes);
router.use('/settings', settingsRoutes);
router.use('/announcements', announcementRoutes);
router.use('/google-form', googleFormRoutes);
router.use('/staff-checkin', staffCheckInRoutes);
router.use('/export', exportRoutes);

export default router;
