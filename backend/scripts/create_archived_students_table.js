import { pool } from '../config/database.js';

const createArchivedStudentsTable = async () => {
  try {
    console.log('Checking/creating archived_students table...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS archived_students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_ic VARCHAR(20) NOT NULL,
        nama VARCHAR(100) NOT NULL,
        umur INT,
        alamat VARCHAR(255),
        telefon VARCHAR(20),
        email VARCHAR(100),
        kelas_id INT,
        tarikh_daftar DATE,
        tarikh_arkib DATE DEFAULT CURRENT_TIMESTAMP,
        alasan_arkib VARCHAR(500),
        archived_by VARCHAR(20),
        original_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_ic (user_ic),
        INDEX idx_tarikh_arkib (tarikh_arkib),
        FOREIGN KEY (kelas_id) REFERENCES classes(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ archived_students table verified');
  } catch (error) {
    console.error('✗ Error creating archived_students table:', error);
    // Don't throw - allow server to start even if table creation fails
    // The error will be logged but won't prevent server startup
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createArchivedStudentsTable()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export default createArchivedStudentsTable;

