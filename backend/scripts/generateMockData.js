import { pool } from '../config/database.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../env.production') });

// Configuration
const CONFIG = {
  // Semester configuration
  SEMESTER_START_DATE: '2025-01-01',
  SEMESTER_END_DATE: '2025-06-30',
  CLASS_DAYS_PER_WEEK: 2, // Assuming classes meet 2 days per week
  WEEKS_PER_SEMESTER: 26, // ~6 months
  TOTAL_CLASS_DAYS: 52, // 26 weeks * 2 days
  
  // Data counts
  TARGET_STUDENTS: 500,
  TARGET_TEACHERS: 20,
  TARGET_CLASSES: 30,
  EXAMS_PER_SEMESTER: 4,
  MONTHS_PER_SEMESTER: 6,
  
  // Class configuration
  STUDENTS_PER_CLASS: 20,
};

// Helper functions
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => (Math.random() * (max - min) + min).toFixed(2);
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generateIC = (prefix = '') => {
  const year = randomInt(0, 5);
  const month = String(randomInt(1, 12)).padStart(2, '0');
  const day = String(randomInt(1, 28)).padStart(2, '0');
  const location = String(randomInt(1, 99)).padStart(2, '0');
  const sequence = String(randomInt(1, 9999)).padStart(4, '0');
  
  if (prefix === 'S') {
    return `S${year}${month}${day}${location}${sequence}`;
  }
  return `${year}${month}${day}-${location}-${sequence}`;
};

const generateName = (type = 'student') => {
  const firstNames = type === 'student' 
    ? ['Ahmad', 'Muhammad', 'Ali', 'Hassan', 'Hussein', 'Ibrahim', 'Ismail', 'Yusuf', 'Zain', 'Faris', 'Amir', 'Hakim', 'Rashid', 'Tariq', 'Khalil']
    : ['Ustaz', 'Ustazah'];
  const lastNames = ['bin Abdullah', 'bin Ahmad', 'bin Hassan', 'bin Ibrahim', 'binti Ahmad', 'binti Hassan', 'binti Ibrahim', 'al-Malaysi', 'al-Singapura'];
  
  return `${randomChoice(firstNames)} ${randomChoice(lastNames)}`;
};

const generateEmail = (name, role, index = null) => {
  const cleanName = name.toLowerCase().replace(/\s+/g, '.');
  const suffix = index !== null ? `.${index}` : `.${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
  return `${cleanName}${suffix}@${role === 'student' ? 'student' : 'teacher'}.masjid.edu.my`;
};

const generatePhone = () => {
  const prefix = randomChoice(['010', '011', '012', '013', '014', '016', '017', '018', '019']);
  const number = String(randomInt(1000000, 9999999));
  return `${prefix}${number}`;
};

const generateAddress = () => {
  const streets = ['Jalan Masjid', 'Jalan Pendidikan', 'Jalan Al-Quran', 'Jalan Ilmu', 'Jalan Dakwah'];
  const cities = ['Kuala Lumpur', 'Shah Alam', 'Petaling Jaya', 'Klang', 'Seremban', 'Melaka', 'Johor Bahru'];
  return `${randomInt(1, 999)} ${randomChoice(streets)}, ${randomChoice(cities)}`;
};

// Generate dates for semester
const generateClassDates = () => {
  const dates = [];
  const start = new Date(CONFIG.SEMESTER_START_DATE);
  const end = new Date(CONFIG.SEMESTER_END_DATE);
  let current = new Date(start);
  
  while (current <= end) {
    // Skip weekends (Saturday = 6, Sunday = 0)
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      dates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  
  // Take first 52 class days
  return dates.slice(0, CONFIG.TOTAL_CLASS_DAYS).map(d => d.toISOString().split('T')[0]);
};

const generateExamDates = () => {
  const dates = [];
  const start = new Date(CONFIG.SEMESTER_START_DATE);
  const months = [1, 2, 3, 4, 5, 6]; // Jan to Jun
  
  for (let i = 0; i < CONFIG.EXAMS_PER_SEMESTER; i++) {
    const month = months[Math.floor(i * (months.length / CONFIG.EXAMS_PER_SEMESTER))];
    const day = randomInt(15, 25); // Mid to end of month
    dates.push(new Date(2025, month - 1, day).toISOString().split('T')[0]);
  }
  
  return dates.sort();
};

const monthNames = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];

async function generateMockData() {
  console.log('🚀 Starting mock data generation...\n');
  
  const startTime = Date.now();
  let totalRecords = 0;
  let totalSizeBytes = 0;
  
  try {
    // Get existing counts
    const [existingStudents] = await pool.execute("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
    const [existingClasses] = await pool.execute("SELECT COUNT(*) as count FROM classes");
    const [existingTeachers] = await pool.execute("SELECT COUNT(*) as count FROM users WHERE role = 'teacher'");
    
    const currentStudents = existingStudents[0].count;
    const currentClasses = existingClasses[0].count;
    const currentTeachers = existingTeachers[0].count;
    
    console.log(`📊 Current Database State:`);
    console.log(`   Students: ${currentStudents}`);
    console.log(`   Teachers: ${currentTeachers}`);
    console.log(`   Classes: ${currentClasses}\n`);
    
    // Calculate how many to add
    const studentsToAdd = Math.max(0, CONFIG.TARGET_STUDENTS - currentStudents);
    const teachersToAdd = Math.max(0, CONFIG.TARGET_TEACHERS - currentTeachers);
    const classesToAdd = Math.max(0, CONFIG.TARGET_CLASSES - currentClasses);
    
    console.log(`📝 Generating:`);
    console.log(`   ${studentsToAdd} new students`);
    console.log(`   ${teachersToAdd} new teachers`);
    console.log(`   ${classesToAdd} new classes`);
    console.log(`   Attendance records for ${CONFIG.TOTAL_CLASS_DAYS} class days`);
    console.log(`   ${CONFIG.EXAMS_PER_SEMESTER} exams`);
    console.log(`   Exam results for all students`);
    console.log(`   Fees for ${CONFIG.MONTHS_PER_SEMESTER} months\n`);
    
    // 1. Generate Teachers
    const teacherICs = [];
    if (teachersToAdd > 0) {
      console.log('👨‍🏫 Generating teachers...');
      const teacherValues = [];
      for (let i = 0; i < teachersToAdd; i++) {
        const ic = generateIC();
        const name = generateName('teacher');
        teacherICs.push(ic);
        teacherValues.push([
          ic,
          name,
          randomInt(30, 60),
          generateAddress(),
          generatePhone(),
          generateEmail(name, 'teacher', i),
          '$2b$10$rQZ8K5XxXxXxXxXxXxXxXu', // Hashed password
          'teacher',
          'aktif'
        ]);
      }
      
      // Build VALUES clause
      const teacherPlaceholders = teacherValues.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
      const teacherFlatValues = teacherValues.flat();
      await pool.execute(`
        INSERT INTO users (ic, nama, umur, alamat, telefon, email, password, role, status)
        VALUES ${teacherPlaceholders}
      `, teacherFlatValues);
      
      const teacherExpertiseValues = teacherICs.map(ic => [ic, JSON.stringify(['Al-Quran', 'Tajwid', 'Fiqh', 'Aqidah'].slice(0, randomInt(2, 4)))]);
      const expertisePlaceholders = teacherExpertiseValues.map(() => '(?, ?)').join(', ');
      const expertiseFlatValues = teacherExpertiseValues.flat();
      await pool.execute(`
        INSERT INTO teachers (user_ic, kepakaran)
        VALUES ${expertisePlaceholders}
      `, expertiseFlatValues);
      
      totalRecords += teachersToAdd * 2;
      totalSizeBytes += teachersToAdd * 500; // ~500 bytes per teacher record
      console.log(`   ✓ Generated ${teachersToAdd} teachers\n`);
    } else {
      // Get existing teachers
      const [existing] = await pool.execute("SELECT ic FROM users WHERE role = 'teacher' LIMIT ?", [CONFIG.TARGET_TEACHERS]);
      teacherICs.push(...existing.map(r => r.ic));
    }
    
    // 2. Generate Classes
    const classIds = [];
    if (classesToAdd > 0) {
      console.log('📚 Generating classes...');
      const classNames = [
        'Al-Quran Asas', 'Al-Quran Pertengahan', 'Al-Quran Lanjutan',
        'Tajwid Asas', 'Tajwid Pertengahan', 'Tajwid Lanjutan',
        'Fiqh Asas', 'Fiqh Pertengahan', 'Fiqh Lanjutan',
        'Aqidah Asas', 'Aqidah Pertengahan', 'Aqidah Lanjutan',
        'Hadith Asas', 'Hadith Pertengahan', 'Hadith Lanjutan',
        'Sirah Asas', 'Sirah Pertengahan', 'Sirah Lanjutan',
        'Bahasa Arab Asas', 'Bahasa Arab Pertengahan', 'Bahasa Arab Lanjutan',
        'Tafsir Asas', 'Tafsir Pertengahan', 'Tafsir Lanjutan',
        'Usul Fiqh', 'Mustalah Hadith', 'Akhlak', 'Tasawwuf', 'Sejarah Islam'
      ];
      
      const classValues = [];
      for (let i = 0; i < classesToAdd; i++) {
        const className = classNames[i % classNames.length] + (i >= classNames.length ? ` ${Math.floor(i / classNames.length) + 1}` : '');
        const level = randomChoice(['Asas', 'Pertengahan', 'Lanjutan']);
        const days = randomChoice([['Isnin', 'Rabu'], ['Selasa', 'Khamis'], ['Sabtu', 'Ahad']]);
        const jadual = `${days[0]} & ${days[1]} ${randomInt(5, 7)}:00AM-${randomInt(7, 9)}:30AM`;
        
        classValues.push([
          className,
          level,
          jadual,
          JSON.stringify(days),
          parseFloat(randomFloat(100, 200)),
          randomChoice(teacherICs),
          CONFIG.STUDENTS_PER_CLASS,
          'aktif'
        ]);
      }
      
      const classPlaceholders = classValues.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
      const classFlatValues = classValues.flat();
      const [result] = await pool.execute(`
        INSERT INTO classes (nama_kelas, level, jadual, sessions, yuran, guru_ic, kapasiti, status)
        VALUES ${classPlaceholders}
      `, classFlatValues);
      
      // Get inserted class IDs
      const [insertedClasses] = await pool.execute(`
        SELECT id FROM classes ORDER BY id DESC LIMIT ?
      `, [classesToAdd]);
      classIds.push(...insertedClasses.map(c => c.id));
      
      totalRecords += classesToAdd;
      totalSizeBytes += classesToAdd * 300; // ~300 bytes per class
      console.log(`   ✓ Generated ${classesToAdd} classes\n`);
    } else {
      // Get existing classes
      const [existing] = await pool.execute("SELECT id FROM classes LIMIT ?", [CONFIG.TARGET_CLASSES]);
      classIds.push(...existing.map(c => c.id));
    }
    
    // 3. Generate Students
    const studentICs = [];
    if (studentsToAdd > 0) {
      console.log('👨‍🎓 Generating students...');
      const studentValues = [];
      const studentClassValues = [];
      
      for (let i = 0; i < studentsToAdd; i++) {
        const ic = randomChoice([generateIC(), generateIC('S')]); // Mix of formats
        const name = generateName('student');
        studentICs.push(ic);
        
        studentValues.push([
          ic,
          name,
          randomInt(7, 18),
          generateAddress(),
          generatePhone(),
          generateEmail(name, 'student', i),
          '$2b$10$rQZ8K5XxXxXxXxXxXxXxXu',
          'student',
          'aktif'
        ]);
        
        // Assign to class
        const classId = randomChoice(classIds);
        studentClassValues.push([
          ic,
          classId,
          CONFIG.SEMESTER_START_DATE
        ]);
      }
      
      const studentPlaceholders = studentValues.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
      const studentFlatValues = studentValues.flat();
      await pool.execute(`
        INSERT INTO users (ic, nama, umur, alamat, telefon, email, password, role, status)
        VALUES ${studentPlaceholders}
      `, studentFlatValues);
      
      const studentClassPlaceholders = studentClassValues.map(() => '(?, ?, ?)').join(', ');
      const studentClassFlatValues = studentClassValues.flat();
      await pool.execute(`
        INSERT INTO students (user_ic, kelas_id, tarikh_daftar)
        VALUES ${studentClassPlaceholders}
      `, studentClassFlatValues);
      
      totalRecords += studentsToAdd * 2;
      totalSizeBytes += studentsToAdd * 400; // ~400 bytes per student record
      console.log(`   ✓ Generated ${studentsToAdd} students\n`);
    } else {
      // Get existing students
      const [existing] = await pool.execute("SELECT ic FROM users WHERE role = 'student' AND status = 'aktif' LIMIT ?", [CONFIG.TARGET_STUDENTS]);
      studentICs.push(...existing.map(r => r.ic));
    }
    
    // Get all students with their classes
    const [studentsWithClasses] = await pool.execute(`
      SELECT s.user_ic, s.kelas_id 
      FROM students s
      JOIN users u ON s.user_ic = u.ic
      WHERE u.role = 'student' AND u.status = 'aktif'
      LIMIT ?
    `, [CONFIG.TARGET_STUDENTS]);
    
    const allStudents = studentsWithClasses;
    const totalStudents = allStudents.length;
    
    // 4. Generate Attendance Records
    console.log('📅 Generating attendance records...');
    const classDates = generateClassDates();
    const attendanceValues = [];
    const attendanceStatuses = ['Hadir', 'Tidak Hadir', 'Lewat', 'Sakit', 'Cuti'];
    
    for (const date of classDates) {
      for (const student of allStudents) {
        const status = randomChoice(attendanceStatuses);
        attendanceValues.push([
          student.user_ic,
          student.kelas_id,
          date,
          status
        ]);
      }
    }
    
    // Insert in batches of 1000
    const batchSize = 1000;
    for (let i = 0; i < attendanceValues.length; i += batchSize) {
      const batch = attendanceValues.slice(i, i + batchSize);
      const batchPlaceholders = batch.map(() => '(?, ?, ?, ?)').join(', ');
      const batchFlatValues = batch.flat();
      await pool.execute(`
        INSERT INTO attendance (student_ic, class_id, tarikh, status)
        VALUES ${batchPlaceholders}
      `, batchFlatValues);
    }
    
    totalRecords += attendanceValues.length;
    totalSizeBytes += attendanceValues.length * 150; // ~150 bytes per attendance record
    console.log(`   ✓ Generated ${attendanceValues.length} attendance records\n`);
    
    // 5. Generate Exams
    console.log('📝 Generating exams...');
    const examDates = generateExamDates();
    const examSubjects = ['Al-Quran', 'Tajwid', 'Fiqh', 'Aqidah', 'Hadith', 'Sirah', 'Bahasa Arab'];
    const examIds = [];
    
    for (const date of examDates) {
      for (const classId of classIds) {
        const subject = randomChoice(examSubjects);
        const [result] = await pool.execute(`
          INSERT INTO exams (class_id, subject, tarikh_exam)
          VALUES (?, ?, ?)
        `, [classId, subject, date]);
        examIds.push(result.insertId);
      }
    }
    
    totalRecords += examIds.length;
    totalSizeBytes += examIds.length * 200; // ~200 bytes per exam
    console.log(`   ✓ Generated ${examIds.length} exams\n`);
    
    // 6. Generate Exam Results
    console.log('📊 Generating exam results...');
    const resultValues = [];
    const grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];
    
    for (const examId of examIds) {
      // Get exam's class
      const [exam] = await pool.execute('SELECT class_id FROM exams WHERE id = ?', [examId]);
      const examClassId = exam[0].class_id;
      
      // Get students in this class
      const classStudents = allStudents.filter(s => s.kelas_id === examClassId);
      
      for (const student of classStudents) {
        const markah = randomInt(0, 100);
        let gred = 'F';
        if (markah >= 90) gred = 'A+';
        else if (markah >= 85) gred = 'A';
        else if (markah >= 80) gred = 'A-';
        else if (markah >= 75) gred = 'B+';
        else if (markah >= 70) gred = 'B';
        else if (markah >= 65) gred = 'B-';
        else if (markah >= 60) gred = 'C+';
        else if (markah >= 55) gred = 'C';
        else if (markah >= 50) gred = 'C-';
        else if (markah >= 40) gred = 'D';
        
        resultValues.push([
          student.user_ic,
          examId,
          markah,
          gred,
          null // slip_img
        ]);
      }
    }
    
    // Insert in batches
    for (let i = 0; i < resultValues.length; i += batchSize) {
      const batch = resultValues.slice(i, i + batchSize);
      const batchPlaceholders = batch.map(() => '(?, ?, ?, ?, ?)').join(', ');
      const batchFlatValues = batch.flat();
      await pool.execute(`
        INSERT INTO results (student_ic, exam_id, markah, gred, slip_img)
        VALUES ${batchPlaceholders}
      `, batchFlatValues);
    }
    
    totalRecords += resultValues.length;
    totalSizeBytes += resultValues.length * 200; // ~200 bytes per result
    console.log(`   ✓ Generated ${resultValues.length} exam results\n`);
    
    // 7. Generate Fees
    console.log('💰 Generating fees...');
    const feeValues = [];
    const feeStatuses = ['terbayar', 'tunggak'];
    
    for (let month = 0; month < CONFIG.MONTHS_PER_SEMESTER; month++) {
      const monthDate = new Date(2025, month, 1);
      const bulan = monthNames[month];
      const tahun = 2025;
      
      for (const student of allStudents) {
        // Get class fee
        const [classData] = await pool.execute('SELECT yuran FROM classes WHERE id = ?', [student.kelas_id]);
        const jumlah = parseFloat(classData[0].yuran || 150.00);
        const status = randomChoice(feeStatuses);
        const tarikh = monthDate.toISOString().split('T')[0];
        const tarikh_bayar = status === 'terbayar' ? tarikh : null;
        
        feeValues.push([
          student.user_ic,
          jumlah,
          status,
          tarikh
        ]);
      }
    }
    
    // Insert in batches
    for (let i = 0; i < feeValues.length; i += batchSize) {
      const batch = feeValues.slice(i, i + batchSize);
      const batchPlaceholders = batch.map(() => '(?, ?, ?, ?)').join(', ');
      const batchFlatValues = batch.flat();
      await pool.execute(`
        INSERT INTO fees (student_ic, jumlah, status, tarikh)
        VALUES ${batchPlaceholders}
      `, batchFlatValues);
    }
    
    totalRecords += feeValues.length;
    totalSizeBytes += feeValues.length * 250; // ~250 bytes per fee record
    console.log(`   ✓ Generated ${feeValues.length} fee records\n`);
    
    // Calculate database size
    console.log('📏 Calculating database size...');
    const [dbSize] = await pool.execute(`
      SELECT 
        table_schema AS 'Database',
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
      FROM information_schema.TABLES
      WHERE table_schema = 'masjid_app'
      GROUP BY table_schema
    `);
    
    const dbSizeMB = dbSize[0]['Size (MB)'];
    const dbSizeBytes = dbSizeMB * 1024 * 1024;
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // Final report
    console.log('\n' + '='.repeat(60));
    console.log('📊 MOCK DATA GENERATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`📝 Total Records Generated: ${totalRecords.toLocaleString()}`);
    console.log(`💾 Estimated Data Size: ${(totalSizeBytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🗄️  Total Database Size: ${dbSizeMB} MB`);
    console.log('\n📈 Breakdown:');
    console.log(`   Students: ${totalStudents}`);
    console.log(`   Teachers: ${teacherICs.length}`);
    console.log(`   Classes: ${classIds.length}`);
    console.log(`   Attendance Records: ${attendanceValues.length.toLocaleString()}`);
    console.log(`   Exams: ${examIds.length}`);
    console.log(`   Exam Results: ${resultValues.length.toLocaleString()}`);
    console.log(`   Fee Records: ${feeValues.length.toLocaleString()}`);
    console.log('\n📅 Semester Period:');
    console.log(`   Start: ${CONFIG.SEMESTER_START_DATE}`);
    console.log(`   End: ${CONFIG.SEMESTER_END_DATE}`);
    console.log(`   Class Days: ${CONFIG.TOTAL_CLASS_DAYS}`);
    console.log(`   Exams: ${CONFIG.EXAMS_PER_SEMESTER}`);
    console.log(`   Months: ${CONFIG.MONTHS_PER_SEMESTER}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error generating mock data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
generateMockData().catch(console.error);

