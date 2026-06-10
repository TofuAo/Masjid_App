import express from 'express';
import { getAllUsers, getUserByIc } from '../controllers/userController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireRole(['admin']), getAllUsers);

// Get detail for a single user by IC (admin only)
router.get('/:ic', authenticateToken, requireRole(['admin']), getUserByIc);

export default router;


