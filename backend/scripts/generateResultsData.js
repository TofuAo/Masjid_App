import { pool } from '../config/database.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../env.production') });

// Helper functions
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const calculateGrade = (markah) => {
  if (markah >= 90) return 'A+';
  if (markah >= 85) return 'A';
  if (markah >= 80) return 'A-';
  if (markah >= 75) return 'B+';
  if (markah >= 70) return 'B';
  if (markah >= 65) return 'B-';
  if (markah >= 60) return 'C+';
  if (markah >= 55) return 'C';
  if (markah >= 50) return 'C-';
  if (markah >= 40) return 'D';
  return 'F';
};

async function generateResultsData() {
  console.log('🚀 Starting results (keputusan) data generation...\n');
  
  const startTime = Date.now();
  let totalRecords = 0;
  
  try {
    // Get all active students
    const [students] = await pool.execute(`
      SELECT s.user_ic, s.kelas_id, u.nama
      FROM students s
      JOIN users u ON s.user_ic = u.ic
      WHERE u.role = 'student' AND u.status = 'aktif'
      ORDER BY s.user_ic
    `);
    
    console.log(`📊 Found ${students.length} active students\n`);
    
    if (students.length === 0) {
      console.log('❌ No students found. Please ensure students exist in the database.');
      return;
    }
    
    // Get all exams
    const [exams] = await pool.execute(`
      SELECT id, class_id, subject, tarikh_exam
      FROM exams
      ORDER BY tarikh_exam, class_id
    `);
    
    console.log(`📝 Found ${exams.length} exams\n`);
    
    if (exams.length === 0) {
      console.log('❌ No exams found. Please ensure exams exist in the database.');
      return;
    }
    
    // Group exams by class
    const examsByClass = {};
    for (const exam of exams) {
      if (!examsByClass[exam.class_id]) {
        examsByClass[exam.class_id] = [];
      }
      examsByClass[exam.class_id].push(exam);
    }
    
    // Generate results for each student
    console.log('📊 Generating results for all students...\n');
    const resultValues = [];
    const batchSize = 1000;
    
    for (const student of students) {
      const classExams = examsByClass[student.kelas_id] || [];
      
      if (classExams.length === 0) {
        console.log(`   ⚠️  Student ${student.nama} (${student.user_ic}) has no exams for their class (${student.kelas_id})`);
        continue;
      }
      
      for (const exam of classExams) {
        // Check if result already exists
        const [existing] = await pool.execute(
          'SELECT id FROM results WHERE student_ic = ? AND exam_id = ?',
          [student.user_ic, exam.id]
        );
        
        // Skip if result already exists
        if (existing.length > 0) {
          continue;
        }
        
        // Generate random mark (0-100)
        // Use different distributions for more realistic data:
        // 70% chance of passing (50-100), 30% chance of failing (0-49)
        const passChance = Math.random();
        const markah = passChance > 0.3 
          ? randomInt(50, 100)  // Passing marks
          : randomInt(0, 49);    // Failing marks
        
        const gred = calculateGrade(markah);
        
        resultValues.push([
          student.user_ic,
          exam.id,
          markah,
          gred,
          null // slip_img
        ]);
      }
    }
    
    console.log(`   ✓ Prepared ${resultValues.length} result records\n`);
    
    if (resultValues.length === 0) {
      console.log('ℹ️  All students already have results for all exams.\n');
      return;
    }
    
    // Insert in batches
    console.log('💾 Inserting results into database...\n');
    let inserted = 0;
    for (let i = 0; i < resultValues.length; i += batchSize) {
      const batch = resultValues.slice(i, i + batchSize);
      const batchPlaceholders = batch.map(() => '(?, ?, ?, ?, ?)').join(', ');
      const batchFlatValues = batch.flat();
      
      await pool.execute(`
        INSERT INTO results (student_ic, exam_id, markah, gred, slip_img)
        VALUES ${batchPlaceholders}
      `, batchFlatValues);
      
      inserted += batch.length;
      process.stdout.write(`   Progress: ${inserted}/${resultValues.length} records inserted\r`);
    }
    
    console.log(`\n   ✓ Successfully inserted ${inserted} result records\n`);
    
    totalRecords = inserted;
    
    // Calculate statistics
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_results,
        AVG(markah) as avg_markah,
        MIN(markah) as min_markah,
        MAX(markah) as max_markah,
        SUM(CASE WHEN markah >= 50 THEN 1 ELSE 0 END) as lulus,
        SUM(CASE WHEN markah < 50 THEN 1 ELSE 0 END) as gagal
      FROM results
    `);
    
    const [gradeStats] = await pool.execute(`
      SELECT 
        gred,
        COUNT(*) as count,
        AVG(markah) as avg_markah
      FROM results
      GROUP BY gred
      ORDER BY 
        CASE gred
          WHEN 'A+' THEN 1
          WHEN 'A' THEN 2
          WHEN 'A-' THEN 3
          WHEN 'B+' THEN 4
          WHEN 'B' THEN 5
          WHEN 'B-' THEN 6
          WHEN 'C+' THEN 7
          WHEN 'C' THEN 8
          WHEN 'C-' THEN 9
          WHEN 'D' THEN 10
          WHEN 'F' THEN 11
          ELSE 12
        END
    `);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // Final report
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTS DATA GENERATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`📝 Total Records Generated: ${totalRecords.toLocaleString()}`);
    console.log('\n📈 Statistics:');
    console.log(`   Total Results: ${stats[0].total_results}`);
    console.log(`   Average Mark: ${parseFloat(stats[0].avg_markah).toFixed(2)}`);
    console.log(`   Minimum Mark: ${stats[0].min_markah}`);
    console.log(`   Maximum Mark: ${stats[0].max_markah}`);
    console.log(`   Lulus (Passed): ${stats[0].lulus} (${((stats[0].lulus / stats[0].total_results) * 100).toFixed(1)}%)`);
    console.log(`   Gagal (Failed): ${stats[0].gagal} (${((stats[0].gagal / stats[0].total_results) * 100).toFixed(1)}%)`);
    
    console.log('\n📊 Grade Distribution:');
    for (const grade of gradeStats) {
      const percentage = ((grade.count / stats[0].total_results) * 100).toFixed(1);
      console.log(`   ${grade.gred.padEnd(3)}: ${grade.count.toString().padStart(5)} students (${percentage}%) - Avg: ${parseFloat(grade.avg_markah).toFixed(1)}`);
    }
    
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error generating results data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
generateResultsData().catch(console.error);

