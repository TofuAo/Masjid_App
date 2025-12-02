import { pool } from '../config/database.js';
import bcrypt from 'bcryptjs';

const createMasterAdmin = async () => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Store IC without hyphens (database format)
    const masterIC = '731014065251'; // 12 digits, no hyphens
    const masterName = 'IMAM BESAR';
    const masterPassword = 'Rizz731051';

    // Check if master admin already exists
    const [existing] = await connection.execute(
      'SELECT * FROM users WHERE ic = ?',
      [masterIC]
    );

    if (existing.length > 0) {
      // Update existing user to be admin
      const hashedPassword = await bcrypt.hash(masterPassword, 12);
      await connection.execute(
        `UPDATE users 
         SET nama = ?, password = ?, role = 'admin', status = 'aktif', updated_at = CURRENT_TIMESTAMP
         WHERE ic = ?`,
        [masterName, hashedPassword, masterIC]
      );
      console.log('Master admin updated successfully');
    } else {
      // Create new master admin
      const hashedPassword = await bcrypt.hash(masterPassword, 12);
      await connection.execute(
        `INSERT INTO users (ic, nama, password, role, status) 
         VALUES (?, ?, ?, 'admin', 'aktif')`,
        [masterIC, masterName, hashedPassword]
      );
      console.log('Master admin created successfully');
    }

    await connection.commit();
    console.log('Master admin setup completed');
    process.exit(0);
  } catch (error) {
    await connection.rollback();
    console.error('Error creating master admin:', error);
    process.exit(1);
  } finally {
    connection.release();
  }
};

createMasterAdmin();

