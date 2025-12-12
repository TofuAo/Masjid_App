import { pool } from '../config/database.js';

// Embed the migration SQL directly
const migrationSQL = `-- GAMIFICATION SYSTEM TABLES
CREATE TABLE IF NOT EXISTS user_points (
    user_ic VARCHAR(20) PRIMARY KEY,
    total_points INT DEFAULT 0,
    current_level INT DEFAULT 1,
    experience_points INT DEFAULT 0,
    points_to_next_level INT DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE,
    INDEX idx_total_points (total_points),
    INDEX idx_current_level (current_level)
);

CREATE TABLE IF NOT EXISTS user_streaks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_ic VARCHAR(20) NOT NULL,
    streak_type ENUM('attendance', 'login', 'fee_payment', 'exam_taken') NOT NULL,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE,
    UNIQUE KEY unique_user_streak (user_ic, streak_type),
    INDEX idx_user_streak (user_ic, streak_type),
    INDEX idx_streak_type (streak_type)
);

CREATE TABLE IF NOT EXISTS achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(100) DEFAULT 'trophy',
    category ENUM('attendance', 'academic', 'payment', 'social', 'milestone', 'special') NOT NULL,
    points_reward INT DEFAULT 0,
    requirement_type VARCHAR(50),
    requirement_value INT,
    badge_color VARCHAR(20) DEFAULT 'gold',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_is_active (is_active)
);

CREATE TABLE IF NOT EXISTS user_achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_ic VARCHAR(20) NOT NULL,
    achievement_id INT NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notified BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_achievement (user_ic, achievement_id),
    INDEX idx_user_achievements (user_ic),
    INDEX idx_unlocked_at (unlocked_at)
);

CREATE TABLE IF NOT EXISTS points_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_ic VARCHAR(20) NOT NULL,
    points INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    source_type VARCHAR(50),
    source_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE,
    INDEX idx_user_points (user_ic),
    INDEX idx_created_at (created_at),
    INDEX idx_source (source_type, source_id)
);

CREATE TABLE IF NOT EXISTS leaderboard_cache (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_ic VARCHAR(20) NOT NULL,
    rank_position INT NOT NULL,
    total_points INT NOT NULL,
    current_level INT NOT NULL,
    category VARCHAR(50) DEFAULT 'overall',
    period_start DATE,
    period_end DATE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE,
    UNIQUE KEY unique_user_category_period (user_ic, category, period_start),
    INDEX idx_category_period (category, period_start, period_end),
    INDEX idx_rank (rank_position)
);

INSERT INTO achievements (code, name, description, icon, category, points_reward, requirement_type, requirement_value, badge_color) VALUES
('first_attendance', 'Kemunculan Pertama', 'Hadir ke kelas untuk kali pertama', 'calendar-check', 'attendance', 10, 'attendance_count', 1, 'bronze'),
('perfect_week', 'Minggu Sempurna', 'Hadir setiap hari dalam seminggu', 'calendar-check', 'attendance', 50, 'attendance_streak', 7, 'silver'),
('perfect_month', 'Bulan Sempurna', 'Hadir setiap hari dalam sebulan', 'calendar-check', 'attendance', 200, 'attendance_streak', 30, 'gold'),
('attendance_10', '10 Hari Hadir', 'Mencapai 10 hari kehadiran', 'calendar-check', 'attendance', 30, 'attendance_count', 10, 'bronze'),
('attendance_50', '50 Hari Hadir', 'Mencapai 50 hari kehadiran', 'calendar-check', 'attendance', 150, 'attendance_count', 50, 'silver'),
('attendance_100', '100 Hari Hadir', 'Mencapai 100 hari kehadiran', 'calendar-check', 'attendance', 300, 'attendance_count', 100, 'gold'),
('streak_7', '7 Hari Berturut-turut', 'Streak kehadiran 7 hari', 'flame', 'attendance', 50, 'attendance_streak', 7, 'silver'),
('streak_30', '30 Hari Berturut-turut', 'Streak kehadiran 30 hari', 'flame', 'attendance', 200, 'attendance_streak', 30, 'gold'),
('streak_100', '100 Hari Berturut-turut', 'Streak kehadiran 100 hari - Luar Biasa!', 'flame', 'attendance', 500, 'attendance_streak', 100, 'platinum'),
('first_exam', 'Peperiksaan Pertama', 'Mengambil peperiksaan pertama', 'file-text', 'academic', 20, 'exam_count', 1, 'bronze'),
('top_score', 'Markah Tertinggi', 'Mendapat markah tertinggi dalam peperiksaan', 'award', 'academic', 100, 'exam_score', 95, 'gold'),
('perfect_score', 'Markah Sempurna', 'Mendapat 100 markah', 'star', 'academic', 150, 'exam_score', 100, 'platinum'),
('grade_a', 'Gred A', 'Mendapat gred A', 'medal', 'academic', 75, 'grade', 1, 'silver'),
('exam_10', '10 Peperiksaan', 'Mengambil 10 peperiksaan', 'file-text', 'academic', 100, 'exam_count', 10, 'silver'),
('first_payment', 'Bayaran Pertama', 'Membayar yuran untuk kali pertama', 'credit-card', 'payment', 25, 'payment_count', 1, 'bronze'),
('early_bird', 'Awal Bayar', 'Membayar yuran sebelum tarikh akhir', 'clock', 'payment', 50, 'early_payment', 1, 'silver'),
('perfect_payer', 'Pembayar Sempurna', 'Membayar semua yuran tepat pada masanya', 'credit-card', 'payment', 150, 'payment_streak', 6, 'gold'),
('level_5', 'Level 5', 'Mencapai Level 5', 'trending-up', 'milestone', 100, 'level', 5, 'silver'),
('level_10', 'Level 10', 'Mencapai Level 10', 'trending-up', 'milestone', 250, 'level', 10, 'gold'),
('level_20', 'Level 20', 'Mencapai Level 20 - Master!', 'trending-up', 'milestone', 500, 'level', 20, 'platinum'),
('points_1000', '1000 Mata', 'Mencapai 1000 mata', 'trophy', 'milestone', 200, 'points', 1000, 'gold'),
('points_5000', '5000 Mata', 'Mencapai 5000 mata', 'trophy', 'milestone', 500, 'points', 5000, 'platinum'),
('login_30', 'Pengguna Aktif', 'Log masuk 30 hari', 'log-in', 'social', 50, 'login_streak', 30, 'silver'),
('login_100', 'Pengguna Setia', 'Log masuk 100 hari', 'log-in', 'social', 150, 'login_streak', 100, 'gold'),
('new_year', 'Tahun Baharu', 'Aktif pada awal tahun baru', 'sparkles', 'special', 100, 'special_event', 1, 'gold'),
('ramadan', 'Ramadan Mubarak', 'Aktif semasa Ramadan', 'moon', 'special', 150, 'special_event', 1, 'platinum')
ON DUPLICATE KEY UPDATE name=VALUES(name);`;

async function runMigration() {
  try {
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pool.execute(statement);
          console.log('✓ Executed statement');
        } catch (error) {
          if (!error.message.includes('already exists') && 
              !error.message.includes('Duplicate') &&
              !error.message.includes('Unknown column')) {
            console.error('Error:', error.message);
            console.error('Statement:', statement.substring(0, 100));
          }
        }
      }
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();

