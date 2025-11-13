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
    status = 'aktif',
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

const fetchStudentByIc = async (ic, connection = null) => {
  const executor = connection ?? pool;
  const [rows] = await executor.execute(
    `SELECT u.ic, u.nama, u.email, u.status, u.telefon, u.umur, u.alamat,
            s.kelas_id, s.tarikh_daftar, c.nama_kelas
     FROM users u
     JOIN students s ON u.ic = s.user_ic
     LEFT JOIN classes c ON s.kelas_id = c.id
     WHERE REPLACE(u.ic, '-', '') = ? AND u.role = 'student'`,
    [normalizeIcForQuery(ic)]
  );
  return rows[0] || null;
};

export const createStudentRecord = async (input, { actorIc, requestedBy = null } = {}, connection = null) => {
  const studentData = sanitizeStudentInput(input);
  if (!studentData.ic || !studentData.nama) {
    const error = new Error('Nama dan IC diperlukan.');
    error.status = 400;
    throw error;
  }

  const ownConnection = connection ?? await pool.getConnection();
  const shouldManageTransaction = !connection;

  try {
    if (shouldManageTransaction) {
      await ownConnection.beginTransaction();
    }

    await ownConnection.execute(
      `INSERT INTO users (ic, nama, umur, alamat, telefon, email, password, role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'student', ?)`,
      [
        studentData.ic,
        studentData.nama,
        studentData.umur,
        studentData.alamat,
        studentData.telefon,
        studentData.email,
        studentData.password,
        studentData.status
      ]
    );

    await ownConnection.execute(
      `INSERT INTO students (user_ic, kelas_id, tarikh_daftar)
       VALUES (?, ?, ?)`,
      [studentData.ic, studentData.kelas_id, studentData.tarikh_daftar]
    );

    if (shouldManageTransaction) {
      await ownConnection.commit();
    }

  const student = await fetchStudentByIc(studentData.ic, ownConnection);
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
  const cleanedIc = normalizeIcForQuery(ic);
  const existing = await fetchStudentByIc(cleanedIc, connection);
  if (!existing) {
    const error = new Error('Pelajar tidak dijumpai.');
    error.status = 404;
    throw error;
  }

  const studentData = sanitizeStudentInput({ ...input, ic: cleanedIc });
  const ownConnection = connection ?? await pool.getConnection();
  const shouldManageTransaction = !connection;

  try {
    if (shouldManageTransaction) {
      await ownConnection.beginTransaction();
    }

    await ownConnection.execute(
      `UPDATE users
       SET nama = ?, umur = ?, alamat = ?, telefon = ?, email = ?, status = ?
       WHERE REPLACE(ic, '-', '') = ?`,
      [
        studentData.nama,
        studentData.umur,
        studentData.alamat,
        studentData.telefon,
        studentData.email,
        studentData.status,
        cleanedIc
      ]
    );

    await ownConnection.execute(
      `UPDATE students
       SET kelas_id = ?, tarikh_daftar = ?
       WHERE REPLACE(user_ic, '-', '') = ?`,
      [studentData.kelas_id, studentData.tarikh_daftar, cleanedIc]
    );

    if (shouldManageTransaction) {
      await ownConnection.commit();
    }

    const student = await fetchStudentByIc(cleanedIc, ownConnection);
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
    const [userRows] = await ownConnection.execute(
      `SELECT * FROM users WHERE REPLACE(ic, '-', '') = ? AND role = 'student'`,
      [cleanedIc]
    );

    if (userRows.length === 0) {
      const error = new Error('Pelajar tidak dijumpai.');
      error.status = 404;
      throw error;
    }

    const [studentRows] = await ownConnection.execute(
      `SELECT * FROM students WHERE REPLACE(user_ic, '-', '') = ?`,
      [cleanedIc]
    );

    const userRecord = userRows[0];
    const studentRecord = studentRows[0] || null;

    const undoSnapshotId = await createSnapshot({
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

    if (shouldManageTransaction) {
      await ownConnection.beginTransaction();
    }

    await ownConnection.execute(
      `DELETE FROM students WHERE REPLACE(user_ic, '-', '') = ?`,
      [cleanedIc]
    );
    await ownConnection.execute(
      `DELETE FROM users WHERE REPLACE(ic, '-', '') = ? AND role = 'student'`,
      [cleanedIc]
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
  return result.student;
});

registerPendingPicHandler('students:update', async ({ payload, entityId, actorIc, adminIc, connection }) => {
  const result = await updateStudentRecord(
    entityId,
    payload,
    { actorIc: adminIc, requestedBy: actorIc },
    connection
  );
  return result.student;
});

registerPendingPicHandler('students:delete', async ({ entityId, actorIc, adminIc, connection }) => {
  const result = await deleteStudentRecord(
    entityId,
    { actorIc: adminIc, requestedBy: actorIc },
    connection
  );
  return { deletedIc: entityId, ...result };
});

