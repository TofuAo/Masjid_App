import { pool } from '../config/database.js';

export async function ensureRemakeTables() {
  try {
    // 1. Global events table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS global_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_date DATE NOT NULL,
        label VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_event_date (event_date)
      )
    `);

    // 2. Appointments table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        details TEXT,
        tarikh DATE,
        hari VARCHAR(20),
        masa VARCHAR(50),
        guru_ic VARCHAR(20),
        status ENUM('pending','confirmed','cancelled') DEFAULT 'pending',
        created_by_ic VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tarikh (tarikh),
        INDEX idx_guru (guru_ic)
      )
    `);

    // 3. Add target_role to campus_life_items if not exists
    const [cols] = await pool.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'campus_life_items' AND COLUMN_NAME = 'target_role'"
    );
    if (!cols.length) {
      await pool.execute(
        'ALTER TABLE campus_life_items ADD COLUMN target_role VARCHAR(50) NULL COMMENT "Tag: pelajar, guru, pilihan"'
      );
      console.log('✅ campus_life_items.target_role column added');
    }

    // 4. Memo entries table (14-day timeline for Global Header)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS memo_entries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        content TEXT,
        created_by_ic VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_dates (start_date, end_date)
      )
    `);

    // 5. Add category to campus_life_items if not exists
    const [catCols] = await pool.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'campus_life_items' AND COLUMN_NAME = 'category'"
    );
    if (!catCols.length) {
      await pool.execute(
        'ALTER TABLE campus_life_items ADD COLUMN category VARCHAR(50) NULL COMMENT "takwim, garis_panduan, modul, fasiliti"'
      );
      console.log('✅ campus_life_items.category column added');
    }

    console.log('✅ Remake tables (global_events, appointments, target_role, memo_entries) ensured');
    return true;
  } catch (err) {
    console.error('❌ Failed to ensure remake tables:', err.message);
    throw err;
  }
}
