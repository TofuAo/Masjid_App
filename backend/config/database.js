// backend/config/database.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// ✅ Create connection pool for masjid_app database
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'masjid_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ✅ Add connection tester for debugging and startup check
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to database:', process.env.DB_NAME || 'masjid_app');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

export { pool };
