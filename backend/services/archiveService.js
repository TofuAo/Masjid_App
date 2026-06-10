import { pool } from '../config/database.js';
import { flushStudentCache } from '../utils/studentCache.js';

const normalizePhoneForQuery = (ic) => (typeof ic === 'string' ? ic.replace(/-/g, '') : ic);

/**
 * Archive a student - move them from active students to archived_students table
 */
export const archiveStudent = async (ic, reason = null, archivedBy = null) => {
  const cleanedIc = normalizePhoneForQuery(ic);
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Fetch the complete student record
    const [users] = await connection.execute(
      `SELECT u.*, s.kelas_id, s.tarikh_daftar, c.nama_kelas
       FROM users u
       LEFT JOIN students s ON u.telefon = s.user_telefon
       LEFT JOIN classes c ON s.kelas_id = c.id
       WHERE REPLACE(u.telefon, '-', '') = ? AND u.role = 'student'`,
      [cleanedIc]
    );
    
    if (users.length === 0) {
      const error = new Error('Pelajar tidak dijumpai.');
      error.status = 404;
      throw error;
    }
    
    const student = users[0];
    
    // Insert into archived_students table
    await connection.execute(
      `INSERT INTO archived_students 
       (user_telefon, nama, umur, alamat, telefon, email, kelas_id, tarikh_daftar, alasan_arkib, archived_by, original_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        student.telefon,
        student.nama,
        student.umur,
        student.alamat,
        student.telefon,
        student.email,
        student.kelas_id,
        student.tarikh_daftar,
        reason,
        archivedBy,
        JSON.stringify(student)
      ]
    );
    
    // Delete from students table (but keep in users table for historical reference)
    await connection.execute(
      `DELETE FROM students WHERE REPLACE(user_telefon, '-', '') = ?`,
      [cleanedIc]
    );
    
    await connection.commit();
    flushStudentCache();
    
    return { success: true, message: 'Pelajar berjaya diarkibkan.' };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Unarchive a student - move them back from archived_students to active students
 */
export const unarchiveStudent = async (ic) => {
  const cleanedIc = normalizePhoneForQuery(ic);
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Fetch from archived_students
    const [archived] = await connection.execute(
      `SELECT * FROM archived_students WHERE REPLACE(user_telefon, '-', '') = ? ORDER BY tarikh_arkib DESC LIMIT 1`,
      [cleanedIc]
    );
    
    if (archived.length === 0) {
      const error = new Error('Rekod arkib tidak dijumpai.');
      error.status = 404;
      throw error;
    }
    
    const archivedStudent = archived[0];
    
    // Restore to students table
    await connection.execute(
      `INSERT INTO students (user_telefon, kelas_id, tarikh_daftar)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
       kelas_id = VALUES(kelas_id),
       tarikh_daftar = VALUES(tarikh_daftar)`,
      [
        archivedStudent.user_telefon,
        archivedStudent.kelas_id,
        archivedStudent.tarikh_daftar
      ]
    );
    
    // Optionally delete from archived_students (or keep for history)
    // For now, we'll keep it for historical records
    
    await connection.commit();
    flushStudentCache();
    
    return { success: true, message: 'Pelajar berjaya dipulihkan.' };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Get all archived students
 */
export const getArchivedStudents = async (search = null, page = 1, limit = 1000) => {
  let query = `
    SELECT a.*, c.nama_kelas
    FROM archived_students a
    LEFT JOIN classes c ON a.kelas_id = c.id
    WHERE 1=1
  `;
  
  const queryParams = [];
  
  if (search) {
    query += ` AND (a.nama LIKE ? OR a.user_telefon LIKE ?)`;
    const searchTerm = `%${search}%`;
    queryParams.push(searchTerm, searchTerm);
  }
  
  const safeLimit = Math.max(1, parseInt(limit));
  const offset = (Math.max(1, parseInt(page)) - 1) * safeLimit;
  query += ` ORDER BY a.tarikh_arkib DESC LIMIT ${safeLimit} OFFSET ${offset}`;
  
  const [archived] = await pool.execute(query, queryParams);
  
  // Get total count
  let countQuery = `SELECT COUNT(*) as total FROM archived_students WHERE 1=1`;
  const countParams = [];
  
  if (search) {
    countQuery += ` AND (nama LIKE ? OR user_telefon LIKE ?)`;
    const searchTerm = `%${search}%`;
    countParams.push(searchTerm, searchTerm);
  }
  
  const [countResult] = await pool.execute(countQuery, countParams);
  const total = countResult[0].total;
  
  return {
    data: archived,
    pagination: {
      page: parseInt(page),
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit)
    }
  };
};

