import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'masjid_app',
  });

  try {
    const [rows] = await pool.query('SHOW TABLES');
    console.log(rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
