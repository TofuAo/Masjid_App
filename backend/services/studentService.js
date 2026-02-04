import { pool } from '../config/database.js';
import { flushStudentCache } from '../utils/studentCache.js';
import { createSnapshot, SNAPSHOT_TTL_HOURS } from '../utils/adminActionSnapshots.js';
import { registerPendingPicHandler } from '../utils/pendingPicChanges.js';

const normalizeIcForQuery = (ic) => (typeof ic === 'string' ? ic.replace(/-/g, '') : ic);

const sanitizeStudentInput = (input = {}) => {
  const {
    ic,
    nama,
    umur = null,
    alamat = null,
    telefon = null,
    email = null,
    password = null,
    kelas_id = null,
    tarikh_daftar = null
  } = input;

  return {
    ic: typeof ic === 'string' ? ic.trim() : ic,
    nama: nama?.toString().trim() || '',
    umur,
    alamat: alamat?.toString().trim() || null,
    telefon: telefon?.toString().trim() || null,
    email: email?.toString().trim() || null,
    password,
    kelas_id: kelas_id === '' || kelas_id === undefined ? null : kelas_id,
    status,
    tarikh_daftar
  };
};

export const fetchStudentByIc = async (ic, connection = null) => {
  if (!ic) {
    console.log('fetchStudentByIc: No IC provided');
    return null;
  }
  
  const executor = connection ?? pool;
  
  // Normalize IC - remove all hyphens for consistent querying
  const cleanedIc = normalizeIcForQuery(ic);
  
  if (!cleanedIc || cleanedIc.length !== 12) {
    console.error('Invalid IC format:', ic, 'cleaned:', cleanedIc);
    return null;
  }
  
  // Also try normalized format (with hyphens) for searching
  const { normalizeIC } = await import('../utils/icNormalizer.js');
  const normalizedIc = normalizeIC(ic);
  
  console.log('fetchStudentByIc: Searching for IC:', ic, 'cleaned:', cleanedIc, 'normalized:', normalizedIc);
  
  // Try multiple query strategies to find the student
  // Strategy 1: Query using REPLACE to handle any hyphen format in database (most reliable)
  try {
    const [rows1] = await executor.execute(
      `SELECT u.ic, u.nama, u.email, u.telefon, u.umur, u.alamat,
              s.kelas_id, s.tarikh_daftar, c.nama_kelas
       FROM users u
       LEFT JOIN students s ON REPLACE(COALESCE(u.ic, ''), '-', '') = REPLACE(COALESCE(s.user_ic, ''), '-', '')
       LEFT JOIN classes c ON s.kelas_id = c.id
       WHERE REPLACE(COALESCE(u.ic, ''), '-', '') = ? AND u.role = 'student'
       LIMIT 1`,
      [cleanedIc]
    );
    
    if (rows1.length > 0) {
      console.log('fetchStudentByIc: Found student with strategy 1:', rows1[0].ic, rows1[0].nama);
      return rows1[0];
    }
  } catch (error) {
    console.error('Error in fetchStudentByIc strategy 1:', error);
  }
  
  // Strategy 2: Direct match with normalized IC (with hyphens) - this is the standard format
  if (normalizedIc && normalizedIc !== ic) {
    try {
      const [rows2] = await executor.execute(
        `SELECT u.ic, u.nama, u.email, u.telefon, u.umur, u.alamat,
                s.kelas_id, s.tarikh_daftar, c.nama_kelas
         FROM users u
         LEFT JOIN students s ON u.ic = s.user_ic
         LEFT JOIN classes c ON s.kelas_id = c.id
         WHERE u.ic = ? AND u.role = 'student'
         LIMIT 1`,
        [normalizedIc]
      );
      
      if (rows2.length > 0) {
        console.log('fetchStudentByIc: Found student with strategy 2 (normalized):', rows2[0].ic, rows2[0].nama);
        return rows2[0];
      }
    } catch (error) {
      console.error('Error in fetchStudentByIc strategy 2:', error);
    }
  }
  
  // Strategy 3: Direct match with cleaned IC (no hyphens) - for legacy data
  try {
    const [rows3] = await executor.execute(
      `SELECT u.ic, u.nama, u.email, u.telefon, u.umur, u.alamat,
              s.kelas_id, s.tarikh_daftar, c.nama_kelas
       FROM users u
       LEFT JOIN students s ON u.ic = s.user_ic
       LEFT JOIN classes c ON s.kelas_id = c.id
       WHERE u.ic = ? AND u.role = 'student'
       LIMIT 1`,
      [cleanedIc]
    );
    
    if (rows3.length > 0) {
      console.log('fetchStudentByIc: Found student with strategy 3 (cleaned):', rows3[0].ic, rows3[0].nama);
      return rows3[0];
    }
  } catch (error) {
    console.error('Error in fetchStudentByIc strategy 3:', error);
  }
  
  // Strategy 4: Use original IC format if it was provided (exact match)
  if (ic && typeof ic === 'string' && ic !== cleanedIc && ic !== normalizedIc) {
    try {
      const [rows4] = await executor.execute(
        `SELECT u.ic, u.nama, u.email, u.telefon, u.umur, u.alamat,
                s.kelas_id, s.tarikh_daftar, c.nama_kelas
         FROM users u
         LEFT JOIN students s ON u.ic = s.user_ic
         LEFT JOIN classes c ON s.kelas_id = c.id
         WHERE u.ic = ? AND u.role = 'student'
         LIMIT 1`,
        [ic]
      );
      
      if (rows4.length > 0) {
        console.log('fetchStudentByIc: Found student with strategy 4 (original):', rows4[0].ic, rows4[0].nama);
        return rows4[0];
      }
    } catch (error) {
      console.error('Error in fetchStudentByIc strategy 4:', error);
    }
  }
  
  // Strategy 5: Try to find by checking all users with role student and matching cleaned IC
  try {
    const [rows5] = await executor.execute(
      `SELECT u.ic, u.nama, u.email, u.telefon, u.umur, u.alamat,
              s.kelas_id, s.tarikh_daftar, c.nama_kelas
       FROM users u
       LEFT JOIN students s ON REPLACE(COALESCE(u.ic, ''), '-', '') = REPLACE(COALESCE(s.user_ic, ''), '-', '')
       LEFT JOIN classes c ON s.kelas_id = c.id
       WHERE u.role = 'student' AND (REPLACE(COALESCE(u.ic, ''), '-', '') = ? OR u.ic = ? OR u.ic = ?)
       LIMIT 1`,
      [cleanedIc, cleanedIc, ic]
    );
    
    if (rows5.length > 0) {
      console.log('fetchStudentByIc: Found student with strategy 5:', rows5[0].ic, rows5[0].nama);
      return rows5[0];
    }
  } catch (error) {
    console.error('Error in fetchStudentByIc strategy 5:', error);
  }
  
  // Strategy 6: Last resort - check if student exists in users table even without students entry
  try {
    const [rows6] = await executor.execute(
      `SELECT u.ic, u.nama, u.email, u.telefon, u.umur, u.alamat,
              NULL as kelas_id, NULL as tarikh_daftar, NULL as nama_kelas
       FROM users u
       WHERE u.role = 'student' AND (REPLACE(COALESCE(u.ic, ''), '-', '') = ? OR u.ic = ? OR u.ic = ?)
       LIMIT 1`,
      [cleanedIc, cleanedIc, ic]
    );
    
    if (rows6.length > 0) {
      console.log('fetchStudentByIc: Found student in users table only (strategy 6):', rows6[0].ic, rows6[0].nama);
      // Create students table entry if it doesn't exist
      try {
        await executor.execute(
          `INSERT IGNORE INTO students (user_ic, kelas_id, tarikh_daftar) VALUES (?, NULL, CURDATE())`,
          [rows6[0].ic]
        );
        console.log('fetchStudentByIc: Created students table entry for:', rows6[0].ic);
      } catch (insertError) {
        console.log('fetchStudentByIc: Could not create students entry (may already exist):', insertError.message);
      }
      return rows6[0];
    }
  } catch (error) {
    console.error('Error in fetchStudentByIc strategy 6:', error);
  }
  
  console.error('Student not found with IC:', ic, 'cleaned:', cleanedIc);
  return null;
};

export const createStudentRecord = async (input, { actorIc, requestedBy = null } = {}, connection = null) => {
  const studentData = sanitizeStudentInput(input);
  if (!studentData.ic || !studentData.nama) {
    const error = new Error('Nama dan IC diperlukan.');
    error.status = 400;
    throw error;
  }

  // Ensure IC is stored in normalized format (with hyphens) for consistency
  // The middleware should have normalized it, but we ensure it here
  const { normalizeIC } = await import('../utils/icNormalizer.js');
  const normalizedIc = normalizeIC(studentData.ic);
  if (!normalizedIc || normalizedIc.replace(/[-\s]/g, '').length !== 12) {
    const error = new Error('Format IC tidak sah. IC mestilah 12 digit.');
    error.status = 400;
    throw error;
  }

  const ownConnection = connection ?? await pool.getConnection();
  const shouldManageTransaction = !connection;

  try {
    if (shouldManageTransaction) {
      await ownConnection.beginTransaction();
    }

    // Check if student already exists (by IC, handling both formats)
    const cleanedIc = normalizeIcForQuery(normalizedIc);
    const [existing] = await ownConnection.execute(
      `SELECT ic FROM users WHERE ic = ? OR REPLACE(ic, '-', '') = ?`,
      [normalizedIc, cleanedIc]
    );

    if (existing.length > 0) {
      const error = new Error('Pelajar dengan IC ini sudah wujud.');
      error.status = 400;
      throw error;
    }

    await ownConnection.execute(
      `INSERT INTO users (ic, nama, umur, alamat, telefon, email, password, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'student')`,
      [
        normalizedIc, // Store with normalized format (with hyphens)
        studentData.nama,
        studentData.umur,
        studentData.alamat,
        studentData.telefon,
        studentData.email,
        studentData.password
      ]
    );

    // Format tarikh_daftar to date-only format if provided
    let tarikhDaftar = studentData.tarikh_daftar;
    if (tarikhDaftar) {
      if (typeof tarikhDaftar === 'string' && tarikhDaftar.includes('T')) {
        // Extract just the date part from ISO datetime string
        tarikhDaftar = tarikhDaftar.split('T')[0];
      } else if (tarikhDaftar instanceof Date) {
        // Convert Date object to yyyy-MM-dd format
        tarikhDaftar = tarikhDaftar.toISOString().split('T')[0];
      }
    }
    
    await ownConnection.execute(
      `INSERT INTO students (user_ic, kelas_id, tarikh_daftar)
       VALUES (?, ?, ?)`,
      [normalizedIc, studentData.kelas_id, tarikhDaftar] // Use normalized IC
    );

    if (shouldManageTransaction) {
      await ownConnection.commit();
    }

  const student = await fetchStudentByIc(normalizedIc, ownConnection);
    flushStudentCache();

    return {
      student,
      metadata: {
        requestedBy,
        actorIc
      }
    };
  } catch (error) {
    if (shouldManageTransaction) {
      await ownConnection.rollback();
    }
    throw error;
  } finally {
    if (shouldManageTransaction) {
      ownConnection.release();
    }
  }
};

export const updateStudentRecord = async (
  ic,
  input,
  { actorIc, requestedBy = null } = {},
  connection = null
) => {
  console.log('updateStudentRecord: Called with IC:', ic, 'Input keys:', Object.keys(input || {}));
  
  // IC might come in with or without hyphens, normalize it for query
  // The middleware should have normalized it to have hyphens, but we try all formats
  const { normalizeIC } = await import('../utils/icNormalizer.js');
  const normalizedIc = normalizeIC(ic);
  const cleanedIc = normalizeIcForQuery(ic);
  
  console.log('updateStudentRecord: IC formats - original:', ic, 'normalized:', normalizedIc, 'cleaned:', cleanedIc);
  
  // Try with normalized IC first (standard format)
  let existing = await fetchStudentByIc(normalizedIc, connection);
  
  // If not found, try with original IC
  if (!existing && ic !== normalizedIc) {
    console.log('updateStudentRecord: Trying with original IC:', ic);
    existing = await fetchStudentByIc(ic, connection);
  }
  
  // If still not found, try with cleaned IC
  if (!existing && cleanedIc !== ic && cleanedIc !== normalizedIc) {
    console.log('updateStudentRecord: Trying with cleaned IC:', cleanedIc);
    existing = await fetchStudentByIc(cleanedIc, connection);
  }
  
  if (!existing) {
    console.error('updateStudentRecord: Student not found after all attempts.');
    console.error('  - Original IC:', ic);
    console.error('  - Normalized IC:', normalizedIc);
    console.error('  - Cleaned IC:', cleanedIc);
    console.error('  - Input data:', JSON.stringify(input, null, 2));
    
    // Try one more time with a direct database query to see what's actually in the DB
    const executor = connection ?? pool;
    try {
      const [allStudents] = await executor.execute(
        `SELECT ic, nama FROM users WHERE role = 'student' LIMIT 10`
      );
      console.error('updateStudentRecord: Sample ICs in database:', allStudents.map(s => s.ic));
    } catch (err) {
      console.error('updateStudentRecord: Error checking database:', err);
    }
    
    const error = new Error('Pelajar tidak dijumpai.');
    error.status = 404;
    throw error;
  }
  
  console.log('updateStudentRecord: Found student:', existing.ic, existing.nama);
  
  // Use the IC from the found student to ensure consistency
  const studentIc = existing.ic;
  const studentCleanedIc = normalizeIcForQuery(studentIc);

  // Only include fields that are provided in the input
  const updateData = {};
  if (input.nama !== undefined) updateData.nama = input.nama?.toString().trim() || '';
  if (input.umur !== undefined) updateData.umur = input.umur;
  if (input.alamat !== undefined) updateData.alamat = input.alamat?.toString().trim() || null;
  if (input.telefon !== undefined) updateData.telefon = input.telefon?.toString().trim() || null;
  if (input.email !== undefined) updateData.email = input.email?.toString().trim() || null;
  // Status removed - no longer in form
  if (input.password !== undefined && input.password && input.password.trim() !== '') {
    // Hash password if provided
    const bcrypt = (await import('bcrypt')).default;
    updateData.password = await bcrypt.hash(input.password, 12);
  }
  
  const studentUpdateData = {};
  if (input.kelas_id !== undefined) studentUpdateData.kelas_id = input.kelas_id === '' || input.kelas_id === null ? null : input.kelas_id;
  if (input.tarikh_daftar !== undefined) {
    // Convert ISO datetime string to date-only format (yyyy-MM-dd)
    let dateValue = input.tarikh_daftar;
    if (typeof dateValue === 'string' && dateValue.includes('T')) {
      // Extract just the date part from ISO datetime string
      dateValue = dateValue.split('T')[0];
    } else if (dateValue instanceof Date) {
      // Convert Date object to yyyy-MM-dd format
      dateValue = dateValue.toISOString().split('T')[0];
    }
    studentUpdateData.tarikh_daftar = dateValue || null;
  }

  const ownConnection = connection ?? await pool.getConnection();
  const shouldManageTransaction = !connection;

  try {
    if (shouldManageTransaction) {
      await ownConnection.beginTransaction();
    }

    // Build dynamic UPDATE query for users table
    // Use the actual IC from the found student record for WHERE clause
    if (Object.keys(updateData).length > 0) {
      const userFields = Object.keys(updateData);
      const userValues = Object.values(updateData);
      const userSetClause = userFields.map(field => `${field} = ?`).join(', ');
      
      // Try with exact IC match first (most reliable)
      const [updateResult] = await ownConnection.execute(
        `UPDATE users
         SET ${userSetClause}
         WHERE ic = ?`,
        [...userValues, studentIc]
      );
      
      // If no rows affected, try with REPLACE (handles format differences)
      if (updateResult.affectedRows === 0) {
        await ownConnection.execute(
          `UPDATE users
           SET ${userSetClause}
           WHERE REPLACE(ic, '-', '') = ?`,
          [...userValues, studentCleanedIc]
        );
      }
    }

    // Build dynamic UPDATE query for students table
    if (Object.keys(studentUpdateData).length > 0) {
      const studentFields = Object.keys(studentUpdateData);
      const studentValues = Object.values(studentUpdateData);
      const studentSetClause = studentFields.map(field => `${field} = ?`).join(', ');
      
      // Try with exact IC match first
      const [updateResult] = await ownConnection.execute(
        `UPDATE students
         SET ${studentSetClause}
         WHERE user_ic = ?`,
        [...studentValues, studentIc]
      );
      
      // If no rows affected, try with REPLACE
      if (updateResult.affectedRows === 0) {
        await ownConnection.execute(
          `UPDATE students
           SET ${studentSetClause}
           WHERE REPLACE(user_ic, '-', '') = ?`,
          [...studentValues, studentCleanedIc]
        );
      }
      
      // If students table entry doesn't exist and we have data to insert, create it
      if (updateResult.affectedRows === 0 && Object.keys(studentUpdateData).length > 0) {
        try {
          await ownConnection.execute(
            `INSERT INTO students (user_ic, ${studentFields.join(', ')}) 
             VALUES (?, ${studentFields.map(() => '?').join(', ')})`,
            [studentIc, ...studentValues]
          );
        } catch (insertErr) {
          // If insert fails (e.g., duplicate key), that's OK - record might already exist
          console.log('Could not insert students record (may already exist):', insertErr.message);
        }
      }
    }

    if (shouldManageTransaction) {
      await ownConnection.commit();
    }

    const student = await fetchStudentByIc(studentIc, ownConnection);
    flushStudentCache();

    return {
      student,
      metadata: {
        requestedBy,
        actorIc
      }
    };
  } catch (error) {
    if (shouldManageTransaction) {
      await ownConnection.rollback();
    }
    throw error;
  } finally {
    if (shouldManageTransaction) {
      ownConnection.release();
    }
  }
};

export const deleteStudentRecord = async (ic, { actorIc, requestedBy = null } = {}, connection = null) => {
  const cleanedIc = normalizeIcForQuery(ic);
  const ownConnection = connection ?? await pool.getConnection();
  const shouldManageTransaction = !connection;

  try {
    // Try multiple lookup strategies to handle both standard ICs and special student IDs
    // Strategy 1: Direct match (for special IDs like SPUTERIZULAIQHA001)
    let [userRows] = await ownConnection.execute(
      `SELECT * FROM users WHERE ic = ? AND role = 'student'`,
      [ic]
    );

    // Strategy 2: Match with cleaned IC (remove hyphens) - for standard ICs
    if (userRows.length === 0 && cleanedIc !== ic) {
      [userRows] = await ownConnection.execute(
        `SELECT * FROM users WHERE REPLACE(ic, '-', '') = ? AND role = 'student'`,
        [cleanedIc]
      );
    }

    // Strategy 3: Case-insensitive match (for special IDs)
    if (userRows.length === 0) {
      [userRows] = await ownConnection.execute(
        `SELECT * FROM users WHERE UPPER(ic) = UPPER(?) AND role = 'student'`,
        [ic]
      );
    }

    if (userRows.length === 0) {
      const error = new Error('Pelajar tidak dijumpai.');
      error.status = 404;
      throw error;
    }

    const userRecord = userRows[0];
    const actualIc = userRecord.ic; // Use the actual IC from database

    const [studentRows] = await ownConnection.execute(
      `SELECT * FROM students WHERE user_ic = ?`,
      [actualIc]
    );

    const studentRecord = studentRows[0] || null;

    // Only create admin snapshot if this is NOT a PIC-initiated action
    // PIC actions go to PIC recycle bin (created by PIC approval middleware/handler)
    // Check if requestedBy is a PIC user
    let isPicAction = false;
    if (requestedBy) {
      try {
        const [picCheck] = await ownConnection.execute(
          `SELECT role FROM users WHERE ic = ?`,
          [requestedBy]
        );
        if (picCheck.length > 0 && picCheck[0].role === 'pic') {
          isPicAction = true;
        }
      } catch (err) {
        console.warn('Could not check if action is from PIC:', err);
      }
    }

    let undoSnapshotId = null;
    // Create snapshot based on action type
    if (isPicAction) {
      // Create PIC snapshot for PIC-initiated actions
      const { createPicSnapshot } = await import('../utils/picActionSnapshots.js');
      undoSnapshotId = await createPicSnapshot({
        entityType: 'student',
        entityId: 0,
        entityIdentifier: userRecord.ic,
        operation: 'delete',
        data: {
          user: userRecord,
          student: studentRecord
        },
        metadata: {
          summary: `Padam pelajar ${userRecord.nama}`,
          title: userRecord.nama,
          nama: userRecord.nama,
          ic: userRecord.ic
        },
        picIc: requestedBy,
        approvedBy: actorIc
      });
      console.log(`[DELETE STUDENT] Created PIC snapshot ID ${undoSnapshotId} for ${userRecord.ic}`);
    } else {
      // Create admin snapshot for admin/teacher actions
      undoSnapshotId = await createSnapshot({
        entityType: 'student',
        entityId: 0,
        entityIdentifier: userRecord.ic,
        operation: 'delete',
        data: {
          user: userRecord,
          student: studentRecord
        },
        metadata: {
          title: userRecord.nama,
          operationLabel: requestedBy
            ? `Permintaan padam oleh ${requestedBy}`
            : 'Padam pelajar',
          route: '/pelajar'
        },
        actorIc: actorIc || userRecord.ic
      });
    }

    if (shouldManageTransaction) {
      await ownConnection.beginTransaction();
    }

    // Use actual IC from database for deletion (handles both standard and special IDs)
    await ownConnection.execute(
      `DELETE FROM students WHERE user_ic = ?`,
      [actualIc]
    );
    await ownConnection.execute(
      `DELETE FROM users WHERE ic = ? AND role = 'student'`,
      [actualIc]
    );

    if (shouldManageTransaction) {
      await ownConnection.commit();
    }

    flushStudentCache();

    return {
      undoToken: undoSnapshotId,
      undoExpiresAt: new Date(Date.now() + SNAPSHOT_TTL_HOURS * 60 * 60 * 1000).toISOString()
    };
  } catch (error) {
    if (shouldManageTransaction) {
      await ownConnection.rollback();
    }
    throw error;
  } finally {
    if (shouldManageTransaction) {
      ownConnection.release();
    }
  }
};

registerPendingPicHandler('students:create', async ({ payload, actorIc, adminIc, connection }) => {
  const result = await createStudentRecord(
    payload,
    { actorIc: adminIc, requestedBy: actorIc },
    connection
  );
  // Return data in format expected by PIC snapshot creation
  return {
    entityId: 0, // INT field - use 0 since student ID is a string (IC)
    entityIdentifier: result.student.ic, // Store actual IC here
    snapshotData: result.student,
    ...result.student
  };
});

registerPendingPicHandler('students:update', async ({ payload, entityId, actorIc, adminIc, connection }) => {
  const result = await updateStudentRecord(
    entityId,
    payload,
    { actorIc: adminIc, requestedBy: actorIc },
    connection
  );
  // Return data in format expected by PIC snapshot creation
  return {
    entityId: 0, // INT field - use 0 since student ID is a string (IC)
    entityIdentifier: result.student.ic, // Store actual IC here
    snapshotData: result.student,
    ...result.student
  };
});

registerPendingPicHandler('students:delete', async ({ entityId, actorIc, adminIc, connection, metadata }) => {
  // Get student data BEFORE deletion for PIC snapshot
  // Use multiple lookup strategies like deleteStudentRecord does
  const cleanedIc = normalizeIcForQuery(entityId);
  
  let [userRows] = await connection.execute(
    `SELECT u.*, s.kelas_id, s.tarikh_daftar 
     FROM users u 
     LEFT JOIN students s ON u.ic = s.user_ic 
     WHERE u.ic = ? AND u.role = 'student'`,
    [entityId]
  );
  
  if (userRows.length === 0 && cleanedIc !== entityId) {
    [userRows] = await connection.execute(
      `SELECT u.*, s.kelas_id, s.tarikh_daftar 
       FROM users u 
       LEFT JOIN students s ON u.ic = s.user_ic 
       WHERE REPLACE(u.ic, '-', '') = ? AND u.role = 'student'`,
      [cleanedIc]
    );
  }
  
  if (userRows.length === 0) {
    [userRows] = await connection.execute(
      `SELECT u.*, s.kelas_id, s.tarikh_daftar 
       FROM users u 
       LEFT JOIN students s ON u.ic = s.user_ic 
       WHERE UPPER(u.ic) = UPPER(?) AND u.role = 'student'`,
      [entityId]
    );
  }
  
  const studentData = userRows[0] || null;
  const actualIc = studentData?.ic || entityId;
  
  // Now delete the student
  const result = await deleteStudentRecord(
    actualIc,
    { actorIc: adminIc, requestedBy: actorIc },
    connection
  );
  
  // Return data in format expected by PIC snapshot creation
  // Note: entity_id must be INT, so use 0 and store IC in entityIdentifier
  return {
    entityId: 0, // INT field - use 0 since student ID is a string (IC)
    entityIdentifier: actualIc, // Store actual IC here
    snapshotData: studentData ? {
      user: {
        ic: studentData.ic,
        nama: studentData.nama,
        email: studentData.email,
        telefon: studentData.telefon,
        role: studentData.role
      },
      student: {
        kelas_id: studentData.kelas_id,
        tarikh_daftar: studentData.tarikh_daftar
      }
    } : null,
    deletedIc: actualIc,
    ...result
  };
});

