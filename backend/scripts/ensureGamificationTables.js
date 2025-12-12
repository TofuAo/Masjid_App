import { pool } from '../config/database.js';

async function ensureTables() {
  try {
    console.log('Checking gamification tables...');
    
    // Check if tables exist
    const [tables] = await pool.execute("SHOW TABLES LIKE 'user_points'");
    
    if (tables.length === 0) {
      console.log('Creating gamification tables...');
      
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS user_points (
          user_ic VARCHAR(20) PRIMARY KEY,
          total_points INT DEFAULT 0,
          current_level INT DEFAULT 1,
          experience_points INT DEFAULT 0,
          points_to_next_level INT DEFAULT 100,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE
        )
      `);
      
      await pool.execute(`
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
          UNIQUE KEY unique_user_streak (user_ic, streak_type)
        )
      `);
      
      await pool.execute(`
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
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS user_achievements (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_ic VARCHAR(20) NOT NULL,
          achievement_id INT NOT NULL,
          unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          notified BOOLEAN DEFAULT FALSE,
          FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE,
          FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
          UNIQUE KEY unique_user_achievement (user_ic, achievement_id)
        )
      `);
      
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS points_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_ic VARCHAR(20) NOT NULL,
          points INT NOT NULL,
          reason VARCHAR(255) NOT NULL,
          source_type VARCHAR(50),
          source_id INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE
        )
      `);
      
      console.log('✓ Tables created successfully');
    } else {
      console.log('✓ Tables already exist');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

ensureTables();

