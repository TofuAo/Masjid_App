import { pool } from '../config/database.js';

/**
 * Ensures class change feature tables/columns exist:
 * - students: exam_class_id, exam_class_end_date; kelas_id and exam_class_id must be INT (fix "out of range" if TINYINT)
 * - class_change_log table for audit
 */
export const ensureClassChangeTables = async () => {
  try {
    // 0. Ensure kelas_id and exam_class_id are INT (avoid "Out of range value for column 'kelas_id'" when column was TINYINT/SMALLINT)
    const [typeRows] = await pool.execute(`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'students'
      AND column_name IN ('kelas_id', 'exam_class_id')
    `);
    const needInt = (typeRows || []).filter((r) => r.data_type && r.data_type.toLowerCase() !== 'int');
    for (const row of needInt) {
      const col = row.column_name;
      try {
        await pool.execute(
          `ALTER TABLE students MODIFY COLUMN \`${col}\` INT NULL COMMENT 'Class reference'`
        );
        console.log(`✓ students.${col} altered to INT`);
      } catch (alterErr) {
        console.error(`ensureClassChangeTables: could not alter students.${col} to INT:`, alterErr.message);
      }
    }

    // 1. Add exam_class_id and exam_class_end_date to students if missing
    const [cols] = await pool.execute(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'students'
      AND column_name IN ('exam_class_id', 'exam_class_end_date')
    `);
    const existing = (cols || []).map((r) => r.column_name);

    if (!existing.includes('exam_class_id')) {
      await pool.execute(`
        ALTER TABLE students
        ADD COLUMN exam_class_id INT NULL COMMENT 'Temporary exam class; NULL when not in exam class'
      `);
      console.log('✓ students.exam_class_id added');
    }
    if (!existing.includes('exam_class_end_date')) {
      await pool.execute(`
        ALTER TABLE students
        ADD COLUMN exam_class_end_date DATE NULL COMMENT 'When exam assignment ends'
      `);
      console.log('✓ students.exam_class_end_date added');
    }

    // 2. Create class_change_log if not exists
    const [tables] = await pool.execute(`
      SELECT COUNT(*) as count FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = 'class_change_log'
    `);
    if (tables[0].count === 0) {
      await pool.execute(`
        CREATE TABLE class_change_log (
          id INT AUTO_INCREMENT PRIMARY KEY,
          admin_ic VARCHAR(20) NOT NULL,
          student_ic VARCHAR(20) NOT NULL,
          from_class_id INT NULL,
          to_class_id INT NOT NULL,
          assignment_type ENUM('permanent', 'exam') NOT NULL DEFAULT 'permanent',
          end_date DATE NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_class_change_student (student_ic),
          INDEX idx_class_change_created (created_at),
          INDEX idx_class_change_admin (admin_ic)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✓ class_change_log table created');
    }
  } catch (err) {
    console.error('ensureClassChangeTables error:', err);
    throw err;
  }
};
