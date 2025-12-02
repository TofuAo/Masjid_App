import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Connection config - uses environment variables set in Docker, or defaults
const connectionConfig = {
  host: process.env.DB_HOST || 'mysql', // 'mysql' is the Docker service name
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'masjid_password',
  database: process.env.DB_NAME || 'masjid_app',
  multipleStatements: true
};

// The 3 admins to keep
const admins = [
  {
    nama: 'USTAZ AMIR HASIF BIN HATA',
    ic: '920312065113', // normalized from 920312-06-5113
    password: 'Amir920313'
  },
  {
    nama: 'USTAZ MUHAMAD KHAIRUL MUSTAKIM BIN CHE AZIZ',
    ic: '951220065759', // normalized from 951220-06-5759
    password: 'Khai951259'
  },
  {
    nama: 'USTAZ MUHAMMAD SYAIFUL IZZHAR BIN ZULKIFLI',
    ic: '941218075641', // normalized from 941218-07-5641
    password: 'Izz941241'
  }
];

async function migrateAdmins() {
  let connection;
  try {
    connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Connected to database');

    // Start transaction
    await connection.beginTransaction();

    // Get all existing admins
    const [existingAdmins] = await connection.execute(
      "SELECT ic, nama FROM users WHERE role = 'admin'"
    );

    console.log(`Found ${existingAdmins.length} existing admin(s)`);

    // Get list of ICs we want to keep
    const keepICs = admins.map(a => a.ic);

    // Delete admins that are not in our list
    const adminsToDelete = existingAdmins.filter(admin => !keepICs.includes(admin.ic));
    
    if (adminsToDelete.length > 0) {
      console.log(`Deleting ${adminsToDelete.length} admin(s) not in the new list:`);
      adminsToDelete.forEach(admin => {
        console.log(`  - ${admin.nama} (IC: ${admin.ic})`);
      });

      const deleteICs = adminsToDelete.map(a => a.ic);
      await connection.execute(
        `DELETE FROM users WHERE ic IN (${deleteICs.map(() => '?').join(',')}) AND role = 'admin'`,
        deleteICs
      );
    }

    // Insert or update each admin
    for (const admin of admins) {
      // Hash the password
      const hashedPassword = await bcrypt.hash(admin.password, 12);

      // Check if admin already exists
      const [existing] = await connection.execute(
        'SELECT ic, nama FROM users WHERE ic = ?',
        [admin.ic]
      );

      if (existing.length > 0) {
        // Update existing admin
        await connection.execute(
          `UPDATE users 
           SET nama = ?, password = ?, role = 'admin', status = 'aktif', updated_at = CURRENT_TIMESTAMP 
           WHERE ic = ?`,
          [admin.nama, hashedPassword, admin.ic]
        );
        console.log(`✅ Updated admin: ${admin.nama} (IC: ${admin.ic})`);
      } else {
        // Insert new admin
        await connection.execute(
          `INSERT INTO users (ic, nama, password, role, status, created_at, updated_at) 
           VALUES (?, ?, ?, 'admin', 'aktif', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [admin.ic, admin.nama, hashedPassword]
        );
        console.log(`✅ Created admin: ${admin.nama} (IC: ${admin.ic})`);
      }
    }

    // Commit transaction
    await connection.commit();
    console.log('\n✅ Migration completed successfully!');
    console.log('\nAdmin accounts:');
    admins.forEach((admin, index) => {
      console.log(`  ${index + 1}. ${admin.nama}`);
      console.log(`     IC: ${admin.ic}`);
      console.log(`     Password: ${admin.password}`);
    });

    process.exit(0);
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrateAdmins();

