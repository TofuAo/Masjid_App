import { pool } from '../config/database.js';

/**
 * Ensures class-assignments design tables exist:
 * class_assignments, exam_sessions, admin_logs, permissions, role_permissions
 * (MySQL-safe; no CHECK constraints that older MySQL might ignore)
 */
export const ensureClassAssignmentsDesign = async () => {
  try {
    const [tables] = await pool.execute(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name IN ('class_assignments','exam_sessions','admin_logs','permissions','role_permissions')
    `);
    const existing = new Set((tables || []).map((r) => r.table_name));

    if (!existing.has('class_assignments')) {
      await pool.execute(`
        CREATE TABLE class_assignments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          student_ic VARCHAR(20) NOT NULL,
          class_id INT NOT NULL,
          assignment_type ENUM('permanent','exam') NOT NULL DEFAULT 'permanent',
          exam_session_id INT NULL,
          start_date DATE NULL,
          end_date DATE NULL,
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_ca_student (student_ic),
          INDEX idx_ca_class (class_id),
          INDEX idx_ca_active (is_active),
          INDEX idx_ca_dates (start_date, end_date),
          FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✓ class_assignments table created');
    }

    if (!existing.has('exam_sessions')) {
      await pool.execute(`
        CREATE TABLE exam_sessions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          start_date DATE NULL,
          end_date DATE NULL,
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_es_dates (start_date, end_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✓ exam_sessions table created');
    }

    if (!existing.has('admin_logs')) {
      await pool.execute(`
        CREATE TABLE admin_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          admin_ic VARCHAR(20) NOT NULL,
          action VARCHAR(100) NOT NULL,
          details JSON NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_al_admin (admin_ic),
          INDEX idx_al_created (created_at),
          INDEX idx_al_action (action)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✓ admin_logs table created');
    }

    if (!existing.has('permissions')) {
      await pool.execute(`
        CREATE TABLE permissions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          code VARCHAR(50) NOT NULL UNIQUE,
          description VARCHAR(255) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      await pool.execute(`
        INSERT IGNORE INTO permissions (code, description) VALUES
        ('class.view', 'View class list'),
        ('class.change', 'Change student class'),
        ('class.exam.assign', 'Assign exam class'),
        ('class.rollback', 'Undo class change')
      `);
      console.log('✓ permissions table created and seeded');
    }

    if (!existing.has('role_permissions')) {
      await pool.execute(`
        CREATE TABLE role_permissions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          role VARCHAR(50) NOT NULL,
          permission_code VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uk_role_perm (role, permission_code),
          INDEX idx_rp_role (role)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      await pool.execute(`
        INSERT IGNORE INTO role_permissions (role, permission_code)
        SELECT 'admin', code FROM permissions WHERE code LIKE 'class.%'
      `);
      await pool.execute(`
        INSERT IGNORE INTO role_permissions (role, permission_code)
        SELECT 'staff', code FROM permissions WHERE code LIKE 'class.%'
      `);
      await pool.execute(`
        INSERT IGNORE INTO role_permissions (role, permission_code) VALUES ('teacher', 'class.view')
      `);
      console.log('✓ role_permissions table created and seeded');
    }
  } catch (err) {
    console.error('ensureClassAssignmentsDesign error:', err);
    throw err;
  }
};
