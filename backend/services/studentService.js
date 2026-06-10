import { pool } from '../config/database.js';
import { flushStudentCache } from '../utils/studentCache.js';
import { createSnapshot, SNAPSHOT_TTL_HOURS } from '../utils/adminActionSnapshots.js';
import { registerPendingPicHandler } from '../utils/pendingPicChanges.js';
import { normalizePhone } from '../utils/phoneNormalizer.js';

const sanitizeStudentInput = (input = {}) => {
  const {
    telefon,
    nama,
    umur = null,
    alamat = null,
    email = null,
    password = null,
    kelas_id = null,
    status = 'pending',
    tarikh_daftar = null
  } = input;

  return {
    telefon: telefon?.toString().trim() || null,
    nama: nama?.toString().trim() || '',
    umur,
    alamat: alamat?.toString().trim() || null,
    email: email?.toString().trim() || null,
    password,
    kelas_id: kelas_id === '' || kelas_id === undefined ? null : kelas_id,
    status,
    tarikh_daftar
  };
};

export const fetchStudentByPhone = async (telefon, connection = null) => {
  if (!telefon) {
    console.log('fetchStudentByPhone: No phone provided');
    return null;
  }
  
  const executor = connection ?? pool;
  const normalizedPhone = normalizePhone(telefon);
  
  console.log('fetchStudentByPhone: Searching for phone:', telefon, 'normalized:', normalizedPhone);
  
  try {
    const [rows] = await executor.execute(
      `SELECT u.telefon as ic, u.nama, u.email, u.telefon, u.umur, u.alamat,
              s.kelas_id, s.tarikh_daftar, c.nama_kelas
       FROM users u
       LEFT JOIN students s ON u.telefon = s.user_telefon
       LEFT JOIN classes c ON s.kelas_id = c.id
       WHERE u.telefon = ? AND u.role = 'student'
       LIMIT 1`,
      [normalizedPhone]
    );
    
    if (rows.length > 0) {
      console.log('fetchStudentByPhone: Found student:', rows[0].telefon, rows[0].nama);
      return rows[0];
    }
  } catch (error) {
    console.error('Error in fetchStudentByPhone:', error);
  }
  
  console.error('Student not found with phone:', normalizedPhone);
  return null;
};

export const createStudentRecord = async (input, { actorPhone, requestedBy = null } = {}, connection = null) => {
  const studentData = sanitizeStudentInput(input);
  if (!studentData.telefon || !studentData.nama) {
    const error = new Error('Nama dan No Telefon diperlukan.');
    error.status = 400;
    throw error;
  }

  const normalizedPhone = normalizePhone(studentData.telefon);
  if (!normalizedPhone) {
    const error = new Error('Format nombor telefon tidak sah.');
    error.status = 400;
    throw error;
  }

  const ownConnection = connection ?? await pool.getConnection();
  const shouldManageTransaction = !connection;

  try {
    if (shouldManageTransaction) {
      await ownConnection.beginTransaction();
    }

    const [existing] = await ownConnection.execute(
      `SELECT id FROM users WHERE telefon = ?`,
      [normalizedPhone]
    );

    if (existing.length > 0) {
      const error = new Error('Pelajar dengan nombor telefon ini sudah wujud.');
      error.status = 400;
      throw error;
    }

    await ownConnection.execute(
      `INSERT INTO users (telefon, nama, umur, alamat, email, password, role)
       VALUES (?, ?, ?, ?, ?, ?, 'student')`,
      [
        normalizedPhone,
        studentData.nama,
        studentData.umur,
        studentData.alamat,
        studentData.email,
        studentData.password
      ]
    );

    let tarikhDaftar = studentData.tarikh_daftar;
    if (tarikhDaftar) {
      if (typeof tarikhDaftar === 'string' && tarikhDaftar.includes('T')) {
        tarikhDaftar = tarikhDaftar.split('T')[0];
      } else if (tarikhDaftar instanceof Date) {
        tarikhDaftar = tarikhDaftar.toISOString().split('T')[0];
      }
    }
    
    await ownConnection.execute(
      `INSERT INTO students (user_telefon, kelas_id, tarikh_daftar)
       VALUES (?, ?, ?)`,
      [normalizedPhone, studentData.kelas_id, tarikhDaftar]
    );

    if (shouldManageTransaction) {
      await ownConnection.commit();
    }

    const student = await fetchStudentByPhone(normalizedPhone, ownConnection);
    flushStudentCache();

    return {
      student,
      metadata: {
        requestedBy,
        actorPhone
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
  telefon,
  input,
  { actorPhone, requestedBy = null } = {},
  connection = null
) => {
  const normalizedPhone = normalizePhone(telefon);
  
  let existing = await fetchStudentByPhone(normalizedPhone, connection);
  
  if (!existing) {
    const error = new Error('Pelajar tidak dijumpai.');
    error.status = 404;
    throw error;
  }
  
  const updateData = {};
  if (input.nama !== undefined) updateData.nama = input.nama?.toString().trim() || '';
  if (input.umur !== undefined) updateData.umur = input.umur;
  if (input.alamat !== undefined) updateData.alamat = input.alamat?.toString().trim() || null;
  if (input.email !== undefined) updateData.email = input.email?.toString().trim() || null;
  if (input.password !== undefined && input.password && input.password.trim() !== '') {
    const bcrypt = (await import('bcrypt')).default;
    updateData.password = await bcrypt.hash(input.password, 12);
  }
  
  const studentUpdateData = {};
  if (input.kelas_id !== undefined) studentUpdateData.kelas_id = input.kelas_id === '' || input.kelas_id === null ? null : input.kelas_id;
  if (input.tarikh_daftar !== undefined) {
    let dateValue = input.tarikh_daftar;
    if (typeof dateValue === 'string' && dateValue.includes('T')) {
      dateValue = dateValue.split('T')[0];
    } else if (dateValue instanceof Date) {
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

    if (Object.keys(updateData).length > 0) {
      const userFields = Object.keys(updateData);
      const userValues = Object.values(updateData);
      const userSetClause = userFields.map(field => `${field} = ?`).join(', ');
      
      await ownConnection.execute(
        `UPDATE users
         SET ${userSetClause}
         WHERE telefon = ?`,
        [...userValues, normalizedPhone]
      );
    }

    if (Object.keys(studentUpdateData).length > 0) {
      const studentFields = Object.keys(studentUpdateData);
      const studentValues = Object.values(studentUpdateData);
      const studentSetClause = studentFields.map(field => `${field} = ?`).join(', ');
      
      const [updateResult] = await ownConnection.execute(
        `UPDATE students
         SET ${studentSetClause}
         WHERE user_telefon = ?`,
        [...studentValues, normalizedPhone]
      );
      
      if (updateResult.affectedRows === 0) {
        try {
          await ownConnection.execute(
            `INSERT INTO students (user_telefon, ${studentFields.join(', ')}) 
             VALUES (?, ${studentFields.map(() => '?').join(', ')})`,
            [normalizedPhone, ...studentValues]
          );
        } catch (insertErr) {
          console.log('Could not insert students record:', insertErr.message);
        }
      }
    }

    if (shouldManageTransaction) {
      await ownConnection.commit();
    }

    const student = await fetchStudentByPhone(normalizedPhone, ownConnection);
    flushStudentCache();

    return {
      student,
      metadata: {
        requestedBy,
        actorPhone
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

export const deleteStudentRecord = async (telefon, { actorPhone, requestedBy = null } = {}, connection = null) => {
  const normalizedPhone = normalizePhone(telefon);
  const ownConnection = connection ?? await pool.getConnection();
  const shouldManageTransaction = !connection;

  try {
    const [userRows] = await ownConnection.execute(
      `SELECT * FROM users WHERE telefon = ? AND role = 'student'`,
      [normalizedPhone]
    );

    if (userRows.length === 0) {
      const error = new Error('Pelajar tidak dijumpai.');
      error.status = 404;
      throw error;
    }

    const userRecord = userRows[0];
    
    const [studentRows] = await ownConnection.execute(
      `SELECT * FROM students WHERE user_telefon = ?`,
      [normalizedPhone]
    );

    const studentRecord = studentRows[0] || null;

    let isPicAction = false;
    if (requestedBy) {
      try {
        const [picCheck] = await ownConnection.execute(
          `SELECT role FROM users WHERE telefon = ?`,
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
    if (isPicAction) {
      const { createPicSnapshot } = await import('../utils/picActionSnapshots.js');
      undoSnapshotId = await createPicSnapshot({
        entityType: 'student',
        entityId: 0,
        entityIdentifier: userRecord.telefon,
        operation: 'delete',
        data: {
          user: userRecord,
          student: studentRecord
        },
        metadata: {
          summary: `Padam pelajar ${userRecord.nama}`,
          title: userRecord.nama,
          nama: userRecord.nama,
          ic: userRecord.telefon
        },
        picPhone: requestedBy,
        approvedBy: actorPhone
      });
    } else {
      undoSnapshotId = await createSnapshot({
        entityType: 'student',
        entityId: 0,
        entityIdentifier: userRecord.telefon,
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
        actorPhone: actorPhone || userRecord.telefon
      });
    }

    if (shouldManageTransaction) {
      await ownConnection.beginTransaction();
    }

    await ownConnection.execute(
      `DELETE FROM students WHERE user_telefon = ?`,
      [normalizedPhone]
    );
    await ownConnection.execute(
      `DELETE FROM users WHERE telefon = ? AND role = 'student'`,
      [normalizedPhone]
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

registerPendingPicHandler('students:create', async ({ payload, actorPhone, adminIc, connection }) => {
  const result = await createStudentRecord(
    payload,
    { actorPhone: adminIc, requestedBy: actorPhone },
    connection
  );
  return {
    entityId: 0,
    entityIdentifier: result.student.telefon,
    snapshotData: result.student,
    ...result.student
  };
});

registerPendingPicHandler('students:update', async ({ payload, entityId, actorPhone, adminIc, connection }) => {
  const result = await updateStudentRecord(
    entityId,
    payload,
    { actorPhone: adminIc, requestedBy: actorPhone },
    connection
  );
  return {
    entityId: 0,
    entityIdentifier: result.student.telefon,
    snapshotData: result.student,
    ...result.student
  };
});

registerPendingPicHandler('students:delete', async ({ entityId, actorPhone, adminIc, connection, metadata }) => {
  const normalizedPhone = normalizePhone(entityId);
  
  const [userRows] = await connection.execute(
    `SELECT u.*, s.kelas_id, s.tarikh_daftar 
     FROM users u 
     LEFT JOIN students s ON u.telefon = s.user_telefon 
     WHERE u.telefon = ? AND u.role = 'student'`,
    [normalizedPhone]
  );
  
  const studentData = userRows[0] || null;
  const actualPhone = studentData?.telefon || normalizedPhone;
  
  const result = await deleteStudentRecord(
    actualPhone,
    { actorPhone: adminIc, requestedBy: actorPhone },
    connection
  );
  
  return {
    entityId: 0,
    entityIdentifier: actualPhone,
    snapshotData: studentData ? {
      user: {
        ic: studentData.telefon,
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
    deletedIc: actualPhone,
    ...result
  };
});
