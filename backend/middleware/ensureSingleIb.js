// Middleware to ensure only one IB user exists at a time
// When assigning IB role, remove IB role from all other users

import { pool } from '../config/database.js';

// Ensures only one user has role = 'ib' at a time.
// After phone-centric auth migration, the identifier is users.telefon.
export async function ensureSingleIb(newIbTelefon) {
  try {
    // Get all current IB users
    const [currentIbs] = await pool.execute(
      "SELECT telefon, nama FROM users WHERE role = 'ib'"
    );

    // If there are other IB users, remove their IB role
    const otherIbs = currentIbs.filter(ib => ib.telefon !== newIbTelefon);
    
    if (otherIbs.length > 0) {
      // Change their role to 'staff' or keep their previous role if stored
      for (const otherIb of otherIbs) {
        // Try to find if they have another role (e.g., admin, teacher)
        const [user] = await pool.execute(
          "SELECT * FROM users WHERE telefon = ?",
          [otherIb.telefon]
        );

        if (user.length > 0) {
          // Check if user has admin or teacher role in other tables
          const [isAdmin] = await pool.execute(
            "SELECT COUNT(*) as count FROM users WHERE telefon = ? AND role = 'admin'",
            [otherIb.telefon]
          );
          
          const [isTeacher] = await pool.execute(
            "SELECT COUNT(*) as count FROM teachers WHERE user_telefon = ?",
            [otherIb.telefon]
          );

          let newRole = 'staff'; // Default fallback
          if (isAdmin[0].count > 0) {
            newRole = 'admin';
          } else if (isTeacher[0].count > 0) {
            newRole = 'teacher';
          }

          await pool.execute(
            "UPDATE users SET role = ? WHERE telefon = ?",
            [newRole, otherIb.telefon]
          );
          
          console.log(`✅ Removed IB role from ${otherIb.nama} (telefon: ${otherIb.telefon}), set to ${newRole}`);
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error ensuring single IB:', error);
    throw error;
  }
}

