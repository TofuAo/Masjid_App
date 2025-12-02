import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const connectionConfig = {
  host: process.env.DB_HOST || 'mysql',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'masjid_password',
  database: process.env.DB_NAME || 'masjid_app',
};

const admins = [
  { ic: '920312065113', password: 'Amir920313' },
  { ic: '951220065759', password: 'Khai951259' },
  { ic: '941218075641', password: 'Izz941241' }
];

async function updatePasswords() {
  let connection;
  try {
    connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Connected to database');

    for (const admin of admins) {
      const hashedPassword = await bcrypt.hash(admin.password, 12);
      await connection.execute(
        'UPDATE users SET password = ? WHERE ic = ?',
        [hashedPassword, admin.ic]
      );
      console.log(`✅ Updated password for IC: ${admin.ic}`);
    }

    console.log('\n✅ All passwords updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

updatePasswords();

