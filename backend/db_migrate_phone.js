import { pool } from './config/database.js';

async function migrate() {
  const connection = await pool.getConnection();
  try {
    await connection.query('SET FOREIGN_KEY_CHECKS=0');
    
    // First, find all foreign keys referencing 'users' and drop them
    const [fks] = await connection.query(`
      SELECT TABLE_NAME, CONSTRAINT_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE REFERENCED_TABLE_SCHEMA = 'masjid_app' AND REFERENCED_TABLE_NAME = 'users'
    `);
    
    for (const fk of fks) {
      try {
        await connection.query(`ALTER TABLE ${fk.TABLE_NAME} DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
        console.log(`Dropped FK ${fk.CONSTRAINT_NAME} from ${fk.TABLE_NAME}`);
      } catch(e) {}
    }

    // Now create the users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(100) NOT NULL,
        telefon VARCHAR(20) NOT NULL UNIQUE,
        email VARCHAR(100),
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        status VARCHAR(50) DEFAULT 'pending',
        umur INT NULL,
        ic VARCHAR(20) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
    console.log('Users table created.');

    // Now modify the referencing tables to use telefon
    const tablesWithUserPhone = ['user_roles', 'teachers', 'students', 'staff_checkin', 'password_reset_tokens'];
    for (const tbl of tablesWithUserPhone) {
      try {
        await connection.query(`ALTER TABLE ${tbl} CHANGE user_phone user_telefon VARCHAR(20)`);
        console.log(`Renamed user_phone to user_telefon in ${tbl}`);
        await connection.query(`ALTER TABLE ${tbl} ADD CONSTRAINT fk_${tbl}_users FOREIGN KEY (user_telefon) REFERENCES users(telefon) ON DELETE CASCADE`);
      } catch(e) { console.log(e.message); }
    }
    
    try {
      await connection.query(`ALTER TABLE classes CHANGE teacher_phone guru_telefon VARCHAR(20)`);
      await connection.query(`ALTER TABLE classes ADD CONSTRAINT fk_classes_users FOREIGN KEY (guru_telefon) REFERENCES users(telefon) ON DELETE SET NULL`);
      console.log('Renamed teacher_phone to guru_telefon in classes');
    } catch(e) { console.log(e.message); }

    await connection.query('SET FOREIGN_KEY_CHECKS=1');
    console.log('Migration completed successfully.');
  } catch (e) {
    console.error(e);
  } finally {
    connection.release();
    process.exit(0);
  }
}
migrate();
