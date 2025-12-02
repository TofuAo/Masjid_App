// backend/config/database.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// ✅ Create connection pool for masjid_app database
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'masjid_user',
  password: process.env.DB_PASSWORD || 'masjid_password',
  database: process.env.DB_NAME || 'masjid_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000,
  // Note: acquireTimeout and timeout are not valid for mysql2 pool
  // They are handled automatically by the pool
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
