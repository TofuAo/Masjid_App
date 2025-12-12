/**
 * Migration Script: Insert Staff Teachers from Staff List
 * MASJID NEGERI SULTAN AHMAD 1, KUANTAN
 * 
 * This script adds teachers from the staff list with their actual IC numbers
 * Run with: node database/migration_insert_staff_teachers_2025.js
 */

import { pool } from '../backend/config/database.js';
import bcrypt from '../backend/node_modules/bcryptjs/index.js';

// Teacher data from the staff list image
const teachers = [
  { nama: 'TUAN HAJI MOHD RIZZAL BIN MOHD ALI NAFIAH', ic: '731014-06-5251' },
  { nama: 'MUHAMMAD \'IZZAN BIN IDRIS', ic: '950717-06-5661' },
  { nama: 'ZANAL ABIDIN BIN ISMAIL', ic: '660322-06-5653' },
  { nama: 'A. ZUNNOR BIN ABD RAHMAN', ic: '710515-06-5193' },
  { nama: 'MOHD NOOR BIN DIN', ic: '701108-06-5175' },
  { nama: 'KHAIRUL AZZURA BINTI ISMAIL', ic: '740101-06-5000' },
  { nama: 'SHAIFUDDIN BIN NGAH', ic: '720323-06-5059' },
  { nama: 'SYAHIRAH AISYAH BINTI SUFIAN', ic: '930929-06-5390' },
  { nama: 'MUHAMMAD IHSAN BIN MHD ZAHARI', ic: '911210-06-5097' },
  { nama: 'MOHAMAD IZWANUDDIN BIN MOHD DAHALAN', ic: '900102-06-6005' },
  { nama: 'SYED FIRMAN SYAMIL BIN SYED AFFENDY', ic: '870526-06-5845' },
  { nama: 'AHMAD SHARIZAL BIN SAFFRIM', ic: '770704-06-5541' },
  { nama: 'MOHD HASBULLAH BIN ABDULLAH @ ISMAIL', ic: '811026-06-5435' },
  { nama: 'AMIR HASIF BIN HATA', ic: '920312-06-5113' },
  { nama: 'MUHAMMAD HAFIZUDDIN BIN TAJUDDIN', ic: '960505-06-5909' },
  { nama: 'MUHAMAD KHAIRUL MUSTAKIM BIN CHE AZIZ', ic: '951220-06-5759' },
  { nama: 'MUHAMMAD SYAIFUL IZZHAR BIN ZULKIFLI', ic: '941218-07-5641' },
  { nama: 'PUTRI ANATI BINTI AZAHAR', ic: '921125-06-5606' },
  { nama: 'NURAIN NASUHA BINTI MOHD YUSOFF', ic: '951209-06-5192' },
  { nama: 'AHMAD HAYATUL FAIZ BIN ABD LATIF', ic: '931129-06-5047' },
  { nama: 'NABIJAH BINTI ZAKARIA', ic: '840714-02-5376' },
  { nama: 'NURUL SYAZWANI AISYAH BINTI RUSLI', ic: '911115-06-5216' },
  { nama: 'WAN MOHAMAD SYAFIQ BIN WAN NOORAZIZAN', ic: '891003-06-5929' },
  { nama: 'MUHAMMAD ARIF HAFIZUDDIN BIN MOHD FADZLI', ic: '990124-06-5179' },
  { nama: 'RUSDAN BIN ABDUL JALIL', ic: '720301-06-5533' },
  { nama: 'MOHAMMAD WAZAR BIN MOHD DAWI', ic: '691222-06-5287' },
  { nama: 'MOHAMAD SADIQ UMAIR BIN NAHAR', ic: '991002-01-6189' }
];

// Valid kepakaran options
const kepakaranOptions = [
  'Al-Quran', 'Tajwid', 'Fardhu Ain', 'Hadith', 'Fiqh', 
  'Seerah', 'Tafsir', 'Bahasa Arab', 'Akidah', 'Tasawwuf'
];

// Generate random kepakaran (1-3 random selections)
function getRandomKepakaran() {
  const count = Math.floor(Math.random() * 3) + 1; // 1-3 items
  const shuffled = [...kepakaranOptions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Normalize IC (remove hyphens)
function normalizeIC(ic) {
  return ic.replace(/-/g, '');
}

// Generate a default phone number from IC (for placeholder)
function generatePhoneFromIC(ic) {
  const normalized = normalizeIC(ic);
  // Use last 9 digits of IC as phone number
  const phoneDigits = normalized.slice(-9);
  return `01${phoneDigits}`;
}

async function insertTeachers() {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    console.log(`\n📝 Starting migration: Adding ${teachers.length} teachers...\n`);
    
    const defaultPassword = 'password123'; // Default password for all teachers
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const teacher of teachers) {
      try {
        const normalizedIC = normalizeIC(teacher.ic);
        const telefon = generatePhoneFromIC(teacher.ic);
        const kepakaran = getRandomKepakaran();
        
        // Check if teacher already exists
        const [existing] = await connection.execute(
          'SELECT ic FROM users WHERE ic = ?',
          [normalizedIC]
        );
        
        if (existing.length > 0) {
          console.log(`⏭️  Skipping ${teacher.nama} (IC: ${normalizedIC}) - already exists`);
          skipCount++;
          continue;
        }
        
        // Insert into users table
        await connection.execute(
          `INSERT INTO users (ic, nama, telefon, role, status, password) 
           VALUES (?, ?, ?, 'teacher', 'aktif', ?)`,
          [normalizedIC, teacher.nama, telefon, hashedPassword]
        );
        
        // Insert into teachers table
        await connection.execute(
          `INSERT INTO teachers (user_ic, kepakaran) 
           VALUES (?, ?)`,
          [normalizedIC, JSON.stringify(kepakaran)]
        );
        
        console.log(`✅ Added: ${teacher.nama} (IC: ${normalizedIC}, Kepakaran: ${kepakaran.join(', ')})`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error adding ${teacher.nama}:`, error.message);
        errorCount++;
      }
    }
    
    await connection.commit();
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Successfully added: ${successCount}`);
    console.log(`   ⏭️  Skipped (already exists): ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`\n⚠️  Default password for all teachers: ${defaultPassword}`);
    console.log(`   Please remind teachers to change their password after first login.\n`);
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Run the migration
insertTeachers()
  .then(() => {
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });

