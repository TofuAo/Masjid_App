// Middleware to ensure only one IB user exists at a time
// When assigning IB role, remove IB role from all other users

import { pool } from '../config/database.js';

export async function ensureSingleIb(newIbIc) {
  try {
    // Get all current IB users
    const [currentIbs] = await pool.execute(
      "SELECT ic, nama FROM users WHERE role = 'ib'"
    );

    // If there are other IB users, remove their IB role
    const otherIbs = currentIbs.filter(ib => ib.ic !== newIbIc);
    
    if (otherIbs.length > 0) {
      // Change their role to 'staff' or keep their previous role if stored
      for (const otherIb of otherIbs) {
        // Try to find if they have another role (e.g., admin, teacher)
        const [user] = await pool.execute(
          "SELECT * FROM users WHERE ic = ?",
          [otherIb.ic]
        );

        if (user.length > 0) {
          // Check if user has admin or teacher role in other tables
          const [isAdmin] = await pool.execute(
            "SELECT COUNT(*) as count FROM users WHERE ic = ? AND role = 'admin'",
            [otherIb.ic]
          );
          
          const [isTeacher] = await pool.execute(
            "SELECT COUNT(*) as count FROM teachers WHERE user_ic = ?",
            [otherIb.ic]
          );

          let newRole = 'staff'; // Default fallback
          if (isAdmin[0].count > 0) {
            newRole = 'admin';
          } else if (isTeacher[0].count > 0) {
            newRole = 'teacher';
          }

          await pool.execute(
            "UPDATE users SET role = ? WHERE ic = ?",
            [newRole, otherIb.ic]
          );
          
          console.log(`✅ Removed IB role from ${otherIb.nama} (IC: ${otherIb.ic}), set to ${newRole}`);
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error ensuring single IB:', error);
    throw error;
  }
}

