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

export default router;
