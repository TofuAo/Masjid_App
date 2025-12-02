import bcrypt from 'bcryptjs';
import { pool } from '../config/database.js';

const ibIC = '731014065251';
const ibNama = 'IB Master Admin';
const ibEmail = 'ib@masjid.app';
const ibPassword = 'Rizzal731051';

try {
  // First, ensure 'ib' role exists in ENUM
  console.log('Checking and updating role ENUM...');
  try {
    await pool.execute(
      `ALTER TABLE users 
       MODIFY COLUMN role ENUM('student','teacher','admin','pic','staff','ib') NOT NULL DEFAULT 'student'`
    );
    console.log('Role ENUM updated to include "ib"');
  } catch (enumError) {
    // If error, role might already be updated or table doesn't exist
    console.log('Role ENUM check completed (may already be updated)');
  }

  // Hash password
  console.log('Hashing password...');
  const hashedPassword = await bcrypt.hash(ibPassword, 12);
  
  // Check if user exists
  console.log('Checking if user exists...');
  const [existing] = await pool.execute(
    'SELECT * FROM users WHERE ic = ? OR REPLACE(ic, "-", "") = ?',
    [ibIC, ibIC]
  );

  if (existing.length > 0) {
    // Update existing user
    console.log('Updating existing user...');
    await pool.execute(
      `UPDATE users 
       SET nama = ?, email = ?, password = ?, role = 'ib', status = 'aktif', updated_at = CURRENT_TIMESTAMP
       WHERE ic = ? OR REPLACE(ic, "-", "") = ?`,
      [ibNama, ibEmail, hashedPassword, ibIC, ibIC]
    );
    console.log('IB user updated successfully!');
  } else {
    // Create new user
    console.log('Creating new user...');
    await pool.execute(
      `INSERT INTO users (ic, nama, email, password, role, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'ib', 'aktif', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [ibIC, ibNama, ibEmail, hashedPassword]
    );
    console.log('IB user created successfully!');
  }

  // Verify
  const [user] = await pool.execute(
    'SELECT ic, nama, email, role, status FROM users WHERE ic = ?',
    [ibIC]
  );
  
  console.log('\nIB User Details:');
  console.log('IC:', user[0].ic);
  console.log('Name:', user[0].nama);
  console.log('Email:', user[0].email);
  console.log('Role:', user[0].role);
  console.log('Status:', user[0].status);
  console.log('\nLogin Credentials:');
  console.log('IC: 731014-06-5251 or 731014065251');
  console.log('Password: Rizzal731051');
  
  process.exit(0);
} catch (error) {
  console.error('Error creating IB user:', error);
  process.exit(1);
}

