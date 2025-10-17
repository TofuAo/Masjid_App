import jwt from 'jsonwebtoken';
import { pool, testConnection } from '../config/database.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user still exists and is active
    const [users] = await pool.execute(
      'SELECT ic, full_name, email, role, is_active FROM users WHERE ic = ? AND is_active = 1',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    const user = users[0];

    // Fetch related data based on user role
    if (user.role === 'teacher') {
      const [classes] = await pool.execute(
        'SELECT * FROM classes WHERE guru_ic = ?',
        [user.ic]
      );
      user.classes = classes;
    } else if (user.role === 'student') {
      const [student] = await pool.execute(
        'SELECT * FROM students WHERE ic = ?',
        [user.ic]
      );
      user.student = student[0];

      if (user.student) { // Only fetch if student profile exists
        const [attendance] = await pool.execute(
          'SELECT * FROM attendance WHERE pelajar_ic = ?',
          [user.ic]
        );
        user.attendance = attendance;

        const [fees] = await pool.execute(
          'SELECT * FROM fees WHERE pelajar_ic = ?',
          [user.ic]
        );
        user.fees = fees;

        const [results] = await pool.execute(
          'SELECT * FROM results WHERE pelajar_ic = ?',
          [user.ic]
        );
        user.results = results;
      }
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    // Allow admin to bypass role check
    if (req.user.role === 'admin') {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};
