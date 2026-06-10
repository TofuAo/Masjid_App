import { pool } from './config/database.js';
import bcrypt from 'bcryptjs';

const roles = ['admin', 'teacher', 'student', 'pic', 'staff', 'ib'];

async function insertMasterUser() {
  try {
    const rawTelefon = '010-2715677';
    // KEEP dashes because authController normalizePhone ADDS dashes and searches with dashes
    const telefon = rawTelefon;
    const plainPassword = 'xcvxcv123S!';
    const password = await bcrypt.hash(plainPassword, 12);
    const nama = 'Master User';
    const email = 'master@example.com';
    
    // Check if user exists in the 'users' table
    const [existing] = await pool.query('SELECT * FROM users WHERE telefon = ?', [telefon]);
    if (existing.length === 0) {
      await pool.query(
        'INSERT INTO users (nama, telefon, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
        [nama, telefon, email, password, 'admin', 'aktif']
      );
      console.log(`Inserted master user with telefon: ${telefon}`);
    } else {
      // If user exists, just update their password to make sure it matches
      await pool.query('UPDATE users SET password = ?, role = ?, status = ? WHERE telefon = ?', [password, 'admin', 'aktif', telefon]);
      console.log(`Master user already existed. Updated password and set primary role to admin for telefon: ${telefon}`);
    }
    
    // Add all roles to user_roles
    for (const role of roles) {
      const [existingRole] = await pool.query('SELECT * FROM user_roles WHERE user_telefon = ? AND role = ?', [telefon, role]);
      if (existingRole.length === 0) {
         await pool.query('INSERT INTO user_roles (user_telefon, role) VALUES (?, ?)', [telefon, role]);
         console.log(`Granted role: ${role}`);
      } else {
         console.log(`Role ${role} already granted`);
      }
    }
    
    console.log(`Finished setting up master user. Phone: ${telefon}, Password: ${plainPassword}`);
  } catch (err) {
    console.error('Error inserting master user:', err);
  } finally {
    process.exit(0);
  }
}

insertMasterUser();
