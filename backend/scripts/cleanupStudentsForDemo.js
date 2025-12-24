/**
 * Cleanup Students for Demo/Testing
 * 
 * This script removes all students except 40 students distributed across 2 classes.
 * All classes are preserved.
 * 
 * Usage: node backend/scripts/cleanupStudentsForDemo.js
 */

import { pool } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const STUDENTS_TO_KEEP = 40;
const CLASSES_TO_USE = 2;
const STUDENTS_PER_CLASS = Math.floor(STUDENTS_TO_KEEP / CLASSES_TO_USE);

async function cleanupStudents() {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    console.log('🔄 Starting student cleanup for demo...');
    
    // Step 1: Get all classes (we'll keep all classes)
    const [allClasses] = await connection.execute(
      `SELECT id, nama_kelas, level FROM classes ORDER BY id LIMIT ${CLASSES_TO_USE}`
    );
    
    if (allClasses.length < CLASSES_TO_USE) {
      console.log(`⚠️  Warning: Only ${allClasses.length} classes found. Using available classes.`);
    }
    
    if (allClasses.length === 0) {
      console.log('❌ No classes found. Cannot proceed.');
      await connection.rollback();
      return;
    }
    
    console.log(`✅ Found ${allClasses.length} class(es) to use:`);
    allClasses.forEach((cls, idx) => {
      console.log(`   ${idx + 1}. ${cls.nama_kelas} (ID: ${cls.id}, Level: ${cls.level || 'N/A'})`);
    });
    
    // Step 2: Get all students (we'll prioritize those in selected classes)
    const classIds = allClasses.map(c => c.id);
    const placeholders = classIds.map(() => '?').join(',');
    
    // First, get students from selected classes
    const [studentsInClasses] = await connection.execute(
      `SELECT s.user_ic, s.kelas_id, u.nama, u.ic
       FROM students s
       JOIN users u ON s.user_ic = u.ic
       WHERE s.kelas_id IN (${placeholders})
       AND u.role = 'student'
       ORDER BY s.kelas_id, u.nama`,
      classIds
    );
    
    // If we don't have enough students in selected classes, get from all classes
    let allStudents = [...studentsInClasses];
    if (allStudents.length < STUDENTS_TO_KEEP) {
      const needed = STUDENTS_TO_KEEP - studentsInClasses.length;
      if (studentsInClasses.length > 0) {
        const [additionalStudents] = await connection.execute(
          `SELECT s.user_ic, s.kelas_id, u.nama, u.ic
           FROM students s
           JOIN users u ON s.user_ic = u.ic
           WHERE u.role = 'student'
           AND s.user_ic NOT IN (${placeholders})
           ORDER BY s.kelas_id, u.nama
           LIMIT ${needed}`,
          classIds
        );
        allStudents = [...studentsInClasses, ...additionalStudents];
      } else {
        const [additionalStudents] = await connection.execute(
          `SELECT s.user_ic, s.kelas_id, u.nama, u.ic
           FROM students s
           JOIN users u ON s.user_ic = u.ic
           WHERE u.role = 'student'
           ORDER BY s.kelas_id, u.nama
           LIMIT ${needed}`
        );
        allStudents = [...additionalStudents];
      }
    }
    
    console.log(`\n📊 Found ${allStudents.length} students total (${studentsInClasses.length} in selected classes)`);
    
    // Step 3: Distribute students evenly across selected classes
    const studentsToKeep = [];
    const studentsPerClass = Math.floor(STUDENTS_TO_KEEP / allClasses.length);
    const remainder = STUDENTS_TO_KEEP % allClasses.length;
    
    // First, assign students from their current classes
    for (let i = 0; i < allClasses.length; i++) {
      const classId = allClasses[i].id;
      const countForThisClass = studentsPerClass + (i < remainder ? 1 : 0);
      
      const studentsForClass = allStudents
        .filter(s => s.kelas_id === classId)
        .slice(0, countForThisClass);
      
      studentsToKeep.push(...studentsForClass);
    }
    
    // If we still need more students, assign them to the first class(es)
    if (studentsToKeep.length < STUDENTS_TO_KEEP) {
      const needed = STUDENTS_TO_KEEP - studentsToKeep.length;
      const availableStudents = allStudents
        .filter(s => !studentsToKeep.some(kept => kept.user_ic === s.user_ic))
        .slice(0, needed);
      
      // Assign to first class if it exists
      if (availableStudents.length > 0 && allClasses.length > 0) {
        // Update their kelas_id to the first class
        for (const student of availableStudents) {
          student.kelas_id = allClasses[0].id;
        }
        studentsToKeep.push(...availableStudents);
      }
    }
    
    // Update students to be assigned to selected classes if they're not already
    for (const student of studentsToKeep) {
      if (!classIds.includes(student.kelas_id)) {
        // Assign to first class
        student.kelas_id = allClasses[0].id;
      }
    }
    
    // Show distribution
    console.log(`\n📋 Student distribution:`);
    for (const cls of allClasses) {
      const count = studentsToKeep.filter(s => s.kelas_id === cls.id).length;
      console.log(`   ${cls.nama_kelas}: ${count} students`);
    }
    
    const studentsToKeepICs = studentsToKeep.map(s => s.user_ic);
    console.log(`\n✅ Keeping ${studentsToKeepICs.length} students`);
    
    // Step 4: Count students to delete
    const [allStudentsCount] = await connection.execute(
      `SELECT COUNT(*) as total FROM students`
    );
    const totalStudents = allStudentsCount[0].total;
    const studentsToDelete = totalStudents - studentsToKeepICs.length;
    
    console.log(`📊 Total students: ${totalStudents}`);
    console.log(`🗑️  Students to delete: ${studentsToDelete}`);
    
    if (studentsToDelete <= 0) {
      console.log('✅ No students to delete. All students are within the limit.');
      await connection.commit();
      return;
    }
    
    // Step 4: Update kelas_id for students that need to be reassigned
    console.log('\n🔄 Updating student class assignments...');
    for (const student of studentsToKeep) {
      await connection.execute(
        `UPDATE students SET kelas_id = ? WHERE user_ic = ?`,
        [student.kelas_id, student.user_ic]
      );
    }
    console.log(`   ✅ Updated ${studentsToKeep.length} student class assignments`);
    
    // Step 5: Delete students not in the keep list
    // First, delete related data (attendance, results, fees)
    if (studentsToKeepICs.length === 0) {
      console.log('⚠️  No students to keep. Deleting all students...');
      // Delete all related data
      await connection.execute(`DELETE FROM attendance`);
      await connection.execute(`DELETE FROM results`);
      await connection.execute(`DELETE FROM fees`);
      await connection.execute(`DELETE FROM students`);
      await connection.execute(`DELETE FROM users WHERE role = 'student'`);
      console.log('   ✅ Deleted all student data');
    } else {
      const deletePlaceholders = studentsToKeepICs.map(() => '?').join(',');
      
      console.log('\n🗑️  Deleting related data...');
      
      // Delete attendance records
      const [attendanceDeleted] = await connection.execute(
        `DELETE FROM attendance WHERE student_ic NOT IN (${deletePlaceholders})`,
        studentsToKeepICs
      );
      console.log(`   ✅ Deleted ${attendanceDeleted.affectedRows} attendance records`);
      
      // Delete results
      const [resultsDeleted] = await connection.execute(
        `DELETE FROM results WHERE student_ic NOT IN (${deletePlaceholders})`,
        studentsToKeepICs
      );
      console.log(`   ✅ Deleted ${resultsDeleted.affectedRows} result records`);
      
      // Delete fees
      const [feesDeleted] = await connection.execute(
        `DELETE FROM fees WHERE student_ic NOT IN (${deletePlaceholders})`,
        studentsToKeepICs
      );
      console.log(`   ✅ Deleted ${feesDeleted.affectedRows} fee records`);
      
      // Delete from students table (this will cascade to users if CASCADE is set)
      const [studentsDeleted] = await connection.execute(
        `DELETE FROM students WHERE user_ic NOT IN (${deletePlaceholders})`,
        studentsToKeepICs
      );
      console.log(`   ✅ Deleted ${studentsDeleted.affectedRows} student records`);
      
      // Delete from users table (only students that are not in keep list)
      const [usersDeleted] = await connection.execute(
        `DELETE FROM users 
         WHERE role = 'student' 
         AND ic NOT IN (${deletePlaceholders})`,
        studentsToKeepICs
      );
      console.log(`   ✅ Deleted ${usersDeleted.affectedRows} user records`);
    }
    
    // Step 6: Verify final counts
    const [finalCount] = await connection.execute(
      `SELECT COUNT(*) as total FROM students`
    );
    const finalStudentCount = finalCount[0].total;
    
    console.log(`\n✅ Cleanup complete!`);
    console.log(`📊 Final student count: ${finalStudentCount}`);
    console.log(`📚 All classes preserved: ${allClasses.length} classes`);
    
    // Show final distribution
    console.log('\n📋 Final student distribution:');
    for (const cls of allClasses) {
      const [classStudents] = await connection.execute(
        `SELECT COUNT(*) as count FROM students WHERE kelas_id = ?`,
        [cls.id]
      );
      console.log(`   ${cls.nama_kelas}: ${classStudents[0].count} students`);
    }
    
    await connection.commit();
    console.log('\n✅ Transaction committed successfully!');
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Run the cleanup
cleanupStudents()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

