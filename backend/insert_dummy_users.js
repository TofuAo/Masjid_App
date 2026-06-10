import { pool } from './config/database.js';
import bcrypt from 'bcryptjs';

const roles = ['admin', 'teacher', 'student', 'pic', 'staff', 'ib'];

async function insertDummyUsers() {
  try {
    const password = await bcrypt.hash('password123', 12);
    
    for (let i = 0; i < roles.length; i++) {
      const role = roles[i];
      const telefon = `01${i+1}1111111`;
      const nama = `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`;
      const email = `test${role}@example.com`;
      
      // Check if user exists
      const [existing] = await pool.query('SELECT * FROM users WHERE telefon = ?', [telefon]);
      if (existing.length === 0) {
        await pool.query(
          'INSERT INTO users (nama, telefon, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
          [nama, telefon, email, password, role, 'aktif']
        );
        console.log(`Inserted user for role: ${role} with telefon: ${telefon}`);
      } else {
        console.log(`User for role ${role} already exists with telefon: ${telefon}`);
      }
      
      // Ensure user_roles entry
      const [existingRole] = await pool.query('SELECT * FROM user_roles WHERE user_telefon = ? AND role = ?', [telefon, role]);
      if (existingRole.length === 0) {
         await pool.query('INSERT INTO user_roles (user_telefon, role) VALUES (?, ?)', [telefon, role]);
         console.log(`Inserted user_roles mapping for role: ${role}`);
      }
    }
    console.log('Finished inserting dummy users. Password is: password123');
  } catch (err) {
    console.error('Error inserting dummy users:', err);
  } finally {
    process.exit(0);
  }
}

insertDummyUsers();
