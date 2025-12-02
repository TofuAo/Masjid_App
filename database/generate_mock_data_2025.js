// Script to generate comprehensive mock data from Jan 1 to Nov 17, 2025
// Run with: node database/generate_mock_data_2025.js

const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'masjid_user',
  password: process.env.DB_PASSWORD || 'masjid_password',
  database: process.env.DB_NAME || 'masjid_app',
};

// Day name mapping
const dayMap = {
  'ISNIN': 1, 'Isnin': 1, 'Monday': 1,
  'SELASA': 2, 'Selasa': 2, 'Tuesday': 2,
  'RABU': 3, 'Rabu': 3, 'Wednesday': 3,
  'KHAMIS': 4, 'Khamis': 4, 'Thursday': 4,
  'JUMAAT': 5, 'Jumaat': 5, 'Friday': 5,
  'SABTU': 6, 'Sabtu': 6, 'Saturday': 6,
  'AHAD': 0, 'Ahad': 0, 'Sunday': 0,
};

// Get day of week (0 = Sunday, 1 = Monday, etc.)
function getDayOfWeek(date) {
  return date.getDay();
}

// Check if date matches class session days
function isClassDay(date, sessions) {
  const dayOfWeek = getDayOfWeek(date);
  return sessions.some(session => {
    const sessionDay = dayMap[session.toUpperCase()];
    return sessionDay !== undefined && sessionDay === dayOfWeek;
  });
}

// Generate dates between start and end
function* dateRange(startDate, endDate) {
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    yield new Date(current);
    current.setDate(current.getDate() + 1);
  }
}

// Generate attendance status (realistic distribution)
function getAttendanceStatus() {
  const rand = Math.random();
  if (rand < 0.75) return 'Hadir';      // 75% present
  if (rand < 0.85) return 'Tidak Hadir'; // 10% absent
  if (rand < 0.92) return 'Lewat';      // 7% late
  if (rand < 0.97) return 'Sakit';     // 5% sick
  return 'Cuti';                        // 3% leave
}

// Generate exam marks (realistic distribution)
function getExamMark() {
  const rand = Math.random();
  if (rand < 0.1) return Math.floor(Math.random() * 20) + 80; // 10% A (80-100)
  if (rand < 0.3) return Math.floor(Math.random() * 15) + 65; // 20% B (65-79)
  if (rand < 0.6) return Math.floor(Math.random() * 15) + 50; // 30% C (50-64)
  if (rand < 0.85) return Math.floor(Math.random() * 10) + 40; // 25% D (40-49)
  return Math.floor(Math.random() * 20) + 20; // 15% F (20-39)
}

// Get grade from mark
function getGrade(mark) {
  if (mark >= 80) return 'A';
  if (mark >= 65) return 'B';
  if (mark >= 50) return 'C';
  if (mark >= 40) return 'D';
  return 'F';
}

// Month names in Malay
const monthNames = [
  'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
  'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
];

async function generateMockData() {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('Connected to database');

    // Get all students with their classes
    const [students] = await connection.execute(`
      SELECT u.ic, u.nama, s.kelas_id, c.nama_kelas, c.sessions, c.yuran
      FROM users u
      JOIN students s ON u.ic = s.user_ic
      JOIN classes c ON s.kelas_id = c.id
      WHERE u.role = 'student'
    `);

    console.log(`Found ${students.length} students`);

    if (students.length === 0) {
      console.log('No students found. Please ensure students exist in the database.');
      return;
    }

    // Get all classes
    const [classes] = await connection.execute(`
      SELECT id, nama_kelas, sessions, yuran
      FROM classes
    `);

    console.log(`Found ${classes.length} classes`);

    // Date range: Jan 1, 2025 to Nov 17, 2025
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-11-17');

    // ============================================
    // 1. GENERATE ATTENDANCE RECORDS
    // ============================================
    console.log('\n=== Generating Attendance Records ===');
    const attendanceValues = [];
    let attendanceCount = 0;

    for (const student of students) {
      const sessions = JSON.parse(student.sessions || '[]');
      if (!Array.isArray(sessions) || sessions.length === 0) continue;

      for (const date of dateRange(startDate, endDate)) {
        // Only create attendance for class session days
        if (isClassDay(date, sessions)) {
          const status = getAttendanceStatus();
          const dateStr = date.toISOString().split('T')[0];
          
          attendanceValues.push([
            student.ic,
            student.kelas_id,
            dateStr,
            status,
            status === 'Tidak Hadir' || status === 'Sakit' ? 
              (status === 'Sakit' ? 'Sakit' : 'Tiada maklumat') : null,
            null, // proof_image
            '990101-01-0101' // marked_by (admin)
          ]);

          attendanceCount++;
          
          // Insert in batches of 1000
          if (attendanceValues.length >= 1000) {
            await connection.execute(`
              INSERT INTO attendance (student_ic, class_id, tarikh, status, catatan, proof_image, marked_by)
              VALUES ?
            `, [attendanceValues]);
            console.log(`Inserted ${attendanceValues.length} attendance records...`);
            attendanceValues.length = 0;
          }
        }
      }
    }

    // Insert remaining attendance records
    if (attendanceValues.length > 0) {
      await connection.execute(`
        INSERT INTO attendance (student_ic, class_id, tarikh, status, catatan, proof_image, marked_by)
        VALUES ?
      `, [attendanceValues]);
      console.log(`Inserted ${attendanceValues.length} attendance records...`);
    }

    console.log(`Total attendance records generated: ${attendanceCount}`);

    // ============================================
    // 2. GENERATE MONTHLY FEES (Jan to Nov 2025)
    // ============================================
    console.log('\n=== Generating Monthly Fees ===');
    const feeValues = [];
    let feeCount = 0;

    for (const student of students) {
      const yuran = parseFloat(student.yuran) || 150.00;
      
      for (let month = 1; month <= 11; month++) {
        const tarikh = `2025-${String(month).padStart(2, '0')}-01`;
        const bulan = monthNames[month - 1];
        
        // 70% paid, 20% pending, 10% tunggak
        const rand = Math.random();
        let status, tarikh_bayar, cara_bayar, no_resit;
        
        if (rand < 0.7) {
          status = 'terbayar';
          tarikh_bayar = tarikh; // Paid on due date
          cara_bayar = Math.random() < 0.5 ? 'Tunai' : 'Online';
          no_resit = `R${String(month).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
        } else if (rand < 0.9) {
          status = 'pending';
          tarikh_bayar = null;
          cara_bayar = null;
          no_resit = null;
        } else {
          status = 'tunggak';
          tarikh_bayar = null;
          cara_bayar = null;
          no_resit = null;
        }

        feeValues.push([
          student.ic,
          yuran,
          status,
          tarikh,
          tarikh_bayar,
          bulan,
          2025,
          cara_bayar,
          no_resit,
          null // resit_img
        ]);

        feeCount++;
      }
    }

    if (feeValues.length > 0) {
      await connection.execute(`
        INSERT INTO fees (student_ic, jumlah, status, tarikh, tarikh_bayar, bulan, tahun, cara_bayar, no_resit, resit_img)
        VALUES ?
      `, [feeValues]);
      console.log(`Total fee records generated: ${feeCount}`);
    }

    // ============================================
    // 3. GENERATE END OF YEAR EXAMS
    // ============================================
    console.log('\n=== Generating End of Year Exams ===');
    const examValues = [];
    const examMap = {}; // Map to store exam IDs by class_id and subject

    // Create 2 exams per class: Writing and Memorizing
    for (const classData of classes) {
      // Writing exam - mid November
      examValues.push([
        classData.id,
        'Menulis (Writing)',
        '2025-11-10'
      ]);

      // Memorizing exam - late November
      examValues.push([
        classData.id,
        'Menghafal (Memorizing)',
        '2025-11-15'
      ]);
    }

    if (examValues.length > 0) {
      await connection.execute(`
        INSERT INTO exams (class_id, subject, tarikh_exam)
        VALUES ?
      `, [examValues]);
      console.log(`Total exams created: ${examValues.length}`);

      // Get the inserted exam IDs
      const [insertedExams] = await connection.execute(`
        SELECT id, class_id, subject
        FROM exams
        WHERE tarikh_exam IN ('2025-11-10', '2025-11-15')
        ORDER BY id DESC
        LIMIT ?
      `, [examValues.length]);

      // Create map: class_id -> {writing: exam_id, memorizing: exam_id}
      for (const exam of insertedExams) {
        if (!examMap[exam.class_id]) {
          examMap[exam.class_id] = {};
        }
        if (exam.subject.includes('Menulis') || exam.subject.includes('Writing')) {
          examMap[exam.class_id].writing = exam.id;
        } else if (exam.subject.includes('Menghafal') || exam.subject.includes('Memorizing')) {
          examMap[exam.class_id].memorizing = exam.id;
        }
      }
    }

    // ============================================
    // 4. GENERATE EXAM RESULTS
    // ============================================
    console.log('\n=== Generating Exam Results ===');
    const resultValues = [];
    let resultCount = 0;

    for (const student of students) {
      const classExams = examMap[student.kelas_id];
      if (!classExams) continue;

      // Writing exam results
      if (classExams.writing) {
        const mark = getExamMark();
        resultValues.push([
          student.ic,
          classExams.writing,
          mark,
          getGrade(mark),
          null, // slip_img
          mark >= 80 ? 'Prestasi cemerlang' : mark >= 50 ? 'Prestasi memuaskan' : 'Perlu peningkatan'
        ]);
        resultCount++;
      }

      // Memorizing exam results
      if (classExams.memorizing) {
        const mark = getExamMark();
        resultValues.push([
          student.ic,
          classExams.memorizing,
          mark,
          getGrade(mark),
          null, // slip_img
          mark >= 80 ? 'Prestasi cemerlang' : mark >= 50 ? 'Prestasi memuaskan' : 'Perlu peningkatan'
        ]);
        resultCount++;
      }
    }

    if (resultValues.length > 0) {
      await connection.execute(`
        INSERT INTO results (student_ic, exam_id, markah, gred, slip_img, catatan)
        VALUES ?
      `, [resultValues]);
      console.log(`Total exam results generated: ${resultCount}`);
    }

    console.log('\n=== Mock Data Generation Complete ===');
    console.log(`Summary:`);
    console.log(`- Attendance records: ${attendanceCount}`);
    console.log(`- Fee records: ${feeCount}`);
    console.log(`- Exams created: ${examValues.length}`);
    console.log(`- Exam results: ${resultCount}`);

  } catch (error) {
    console.error('Error generating mock data:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

// Run the script
generateMockData()
  .then(() => {
    console.log('\n✅ Mock data generation completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });

