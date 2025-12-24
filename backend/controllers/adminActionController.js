import { validationResult, param, query } from 'express-validator';
import { pool } from '../config/database.js';
import {
  getSnapshotById,
  listSnapshots,
  markSnapshotUndone,
  SNAPSHOT_TTL_HOURS
} from '../utils/adminActionSnapshots.js';

const formatDateTimeForDB = (value) => {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const undoAnnouncementAction = async (snapshot) => {
  const { operation, entity_id: entityId, data } = snapshot;
  if (!data) {
    throw new Error('Snapshot data missing. Unable to undo action.');
  }

  switch (operation) {
    case 'create': {
      await pool.execute(`DELETE FROM announcements WHERE id = ?`, [entityId]);
      return { entityId, entityType: 'announcement', action: 'delete' };
    }
    case 'update': {
      const values = [
        data.title,
        data.content,
        data.status,
        data.priority,
        data.target_audience,
        formatDateTimeForDB(data.start_date),
        formatDateTimeForDB(data.end_date),
        data.author_ic,
        formatDateTimeForDB(data.created_at),
        formatDateTimeForDB(data.updated_at),
        entityId
      ];

      await pool.execute(
        `UPDATE announcements
         SET title = ?, content = ?, status = ?, priority = ?, target_audience = ?, start_date = ?, end_date = ?, author_ic = ?, created_at = ?, updated_at = ?
         WHERE id = ?`,
        values
      );
      return { entityId, entityType: 'announcement', action: 'update' };
    }
    case 'delete': {
      const values = [
        entityId,
        data.title,
        data.content,
        data.author_ic,
        data.status,
        data.priority,
        data.target_audience,
        formatDateTimeForDB(data.start_date),
        formatDateTimeForDB(data.end_date),
        formatDateTimeForDB(data.created_at),
        formatDateTimeForDB(data.updated_at)
      ];

      await pool.execute(
        `INSERT INTO announcements (
            id, title, content, author_ic, status, priority, target_audience, start_date, end_date, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            content = VALUES(content),
            author_ic = VALUES(author_ic),
            status = VALUES(status),
            priority = VALUES(priority),
            target_audience = VALUES(target_audience),
            start_date = VALUES(start_date),
            end_date = VALUES(end_date),
            created_at = VALUES(created_at),
            updated_at = VALUES(updated_at)`,
        values
      );
      return { entityId, entityType: 'announcement', action: 'restore' };
    }
    default:
      throw new Error(`Unsupported snapshot operation: ${operation}`);
  }
};

const undoStudentAction = async (snapshot) => {
  const { operation, data } = snapshot;
  if (!data || !data.user) {
    throw new Error('Snapshot data missing for student undo.');
  }

  const userData = data.user;
  const studentData = data.student || null;
  const normalizeDate = (value) => {
    if (!value) {
      return null;
    }
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return parsed.toISOString().slice(0, 10);
  };

  switch (operation) {
    case 'delete': {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        await connection.execute(
          `INSERT INTO users (ic, nama, umur, alamat, telefon, email, password, role, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             nama = VALUES(nama),
             umur = VALUES(umur),
             alamat = VALUES(alamat),
             telefon = VALUES(telefon),
             email = VALUES(email),
             password = VALUES(password),
             role = VALUES(role),
             status = VALUES(status)`,
          [
            userData.ic,
            userData.nama,
            userData.umur ?? null,
            userData.alamat ?? null,
            userData.telefon ?? null,
            userData.email ?? null,
            userData.password ?? null,
            userData.role ?? 'student',
            userData.status ?? 'aktif'
          ]
        );

        if (studentData) {
          await connection.execute(
            `INSERT INTO students (user_ic, kelas_id, tarikh_daftar)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE
               kelas_id = VALUES(kelas_id),
               tarikh_daftar = VALUES(tarikh_daftar)`,
            [
              studentData.user_ic || userData.ic,
              studentData.kelas_id ?? null,
              normalizeDate(studentData.tarikh_daftar)
            ]
          );
        }

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

      return {
        entityId: snapshot.entity_identifier || snapshot.entity_id,
        entityType: 'student',
        action: 'restore'
      };
    }
    default:
      throw new Error(`Unsupported snapshot operation for student: ${operation}`);
  }
};

const undoTeacherAction = async (snapshot) => {
  const { operation, entity_identifier: entityIc, data } = snapshot;
  if (!data || !entityIc) {
    throw new Error('Snapshot data missing for teacher undo.');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    switch (operation) {
      case 'create': {
        // Delete the teacher and user
        await connection.execute(`DELETE FROM teachers WHERE user_ic = ?`, [entityIc]);
        await connection.execute(`DELETE FROM users WHERE ic = ? AND role = 'teacher'`, [entityIc]);
        break;
      }
      case 'update': {
        // Restore previous data
        if (data.nama !== undefined) {
          await connection.execute(`UPDATE users SET nama = ? WHERE ic = ?`, [data.nama, entityIc]);
        }
        if (data.email !== undefined) {
          await connection.execute(`UPDATE users SET email = ? WHERE ic = ?`, [data.email, entityIc]);
        }
        if (data.telefon !== undefined) {
          await connection.execute(`UPDATE users SET telefon = ? WHERE ic = ?`, [data.telefon, entityIc]);
        }
        if (data.status !== undefined) {
          await connection.execute(`UPDATE users SET status = ? WHERE ic = ?`, [data.status, entityIc]);
        }
        if (data.kepakaran !== undefined) {
          const kepakaranJson = typeof data.kepakaran === 'string' ? data.kepakaran : JSON.stringify(data.kepakaran);
          await connection.execute(`UPDATE teachers SET kepakaran = ? WHERE user_ic = ?`, [kepakaranJson, entityIc]);
        }
        break;
      }
      case 'delete': {
        // Restore user
        await connection.execute(
          `INSERT INTO users (ic, nama, email, telefon, role, status) 
           VALUES (?, ?, ?, ?, 'teacher', ?)
           ON DUPLICATE KEY UPDATE
             nama = VALUES(nama),
             email = VALUES(email),
             telefon = VALUES(telefon),
             status = VALUES(status)`,
          [entityIc, data.nama, data.email || null, data.telefon || null, data.status || 'aktif']
        );
        // Restore teacher
        if (data.kepakaran !== undefined) {
          const kepakaranJson = typeof data.kepakaran === 'string' ? data.kepakaran : JSON.stringify(data.kepakaran);
          await connection.execute(
            `INSERT INTO teachers (user_ic, kepakaran) 
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE kepakaran = VALUES(kepakaran)`,
            [entityIc, kepakaranJson]
          );
        }
        break;
      }
      default:
        throw new Error(`Unsupported snapshot operation for teacher: ${operation}`);
    }

    await connection.commit();
    return {
      entityId: entityIc,
      entityType: 'teacher',
      action: operation === 'create' ? 'delete' : operation === 'delete' ? 'restore' : 'update'
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const undoClassAction = async (snapshot) => {
  const { operation, entity_id: entityId, data } = snapshot;
  if (!data || !entityId) {
    throw new Error('Snapshot data missing for class undo.');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    switch (operation) {
      case 'create': {
        // Delete the class
        await connection.execute(`DELETE FROM classes WHERE id = ?`, [entityId]);
        break;
      }
      case 'update': {
        // Restore previous data
        const sessionsJson = typeof data.sessions === 'string' ? data.sessions : JSON.stringify(data.sessions || []);
        await connection.execute(
          `UPDATE classes 
           SET nama_kelas = ?, level = ?, sessions = ?, yuran = ?, guru_ic = ?, kapasiti = ?, status = ?
           WHERE id = ?`,
          [
            data.nama_kelas,
            data.level,
            sessionsJson,
            data.yuran,
            data.guru_ic || null,
            data.kapasiti,
            data.status || 'aktif',
            entityId
          ]
        );
        break;
      }
      case 'delete': {
        // Restore class
        const sessionsJson = typeof data.sessions === 'string' ? data.sessions : JSON.stringify(data.sessions || []);
        await connection.execute(
          `INSERT INTO classes (id, nama_kelas, level, sessions, yuran, guru_ic, kapasiti, status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             nama_kelas = VALUES(nama_kelas),
             level = VALUES(level),
             sessions = VALUES(sessions),
             yuran = VALUES(yuran),
             guru_ic = VALUES(guru_ic),
             kapasiti = VALUES(kapasiti),
             status = VALUES(status)`,
          [
            entityId,
            data.nama_kelas,
            data.level,
            sessionsJson,
            data.yuran,
            data.guru_ic || null,
            data.kapasiti,
            data.status || 'aktif'
          ]
        );
        break;
      }
      default:
        throw new Error(`Unsupported snapshot operation for class: ${operation}`);
    }

    await connection.commit();
    return {
      entityId: entityId,
      entityType: 'class',
      action: operation === 'create' ? 'delete' : operation === 'delete' ? 'restore' : 'update'
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const undoPicUserAction = async (snapshot) => {
  const { operation, entity_identifier: entityIc, data } = snapshot;
  if (!data || !entityIc) {
    throw new Error('Snapshot data missing for PIC user undo.');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    switch (operation) {
      case 'delete': {
        const userData = data.user;
        const metadata = snapshot.metadata || {};
        const actionType = metadata.action_type;

        if (actionType === 'remove_pic_role') {
          // Restore PIC role to user_roles table
          await connection.execute(
            `INSERT IGNORE INTO user_roles (user_ic, role) VALUES (?, ?)`,
            [entityIc, 'pic']
          );
        } else if (actionType === 'delete_pic_user') {
          // Restore full user record
          await connection.execute(
            `INSERT INTO users (ic, nama, email, telefon, password, role, status, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               nama = VALUES(nama),
               email = VALUES(email),
               telefon = VALUES(telefon),
               password = VALUES(password),
               role = VALUES(role),
               status = VALUES(status),
               updated_at = VALUES(updated_at)`,
            [
              userData.ic,
              userData.nama,
              userData.email || null,
              userData.telefon || null,
              userData.password || null,
              userData.role || 'pic',
              userData.status || 'aktif',
              userData.created_at || new Date(),
              userData.updated_at || new Date()
            ]
          );

          // Restore all roles
          if (data.roles && Array.isArray(data.roles)) {
            for (const role of data.roles) {
              await connection.execute(
                `INSERT IGNORE INTO user_roles (user_ic, role) VALUES (?, ?)`,
                [entityIc, role]
              );
            }
          } else {
            // Fallback: restore PIC role if roles array not available
            await connection.execute(
              `INSERT IGNORE INTO user_roles (user_ic, role) VALUES (?, ?)`,
              [entityIc, 'pic']
            );
          }
        } else if (actionType === 'remove_pic_role_and_update_primary') {
          // Restore user's primary role and all roles
          if (userData.role) {
            await connection.execute(
              `UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE ic = ?`,
              [userData.role, entityIc]
            );
          }

          // Restore all roles including PIC
          if (data.roles && Array.isArray(data.roles)) {
            for (const role of data.roles) {
              await connection.execute(
                `INSERT IGNORE INTO user_roles (user_ic, role) VALUES (?, ?)`,
                [entityIc, role]
              );
            }
          } else {
            // Restore PIC role
            await connection.execute(
              `INSERT IGNORE INTO user_roles (user_ic, role) VALUES (?, ?)`,
              [entityIc, 'pic']
            );
          }
        }
        break;
      }
      default:
        throw new Error(`Unsupported snapshot operation for PIC user: ${operation}`);
    }

    await connection.commit();
    return {
      entityId: entityIc,
      entityType: 'picUser',
      action: 'restore'
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const undoAttendanceAction = async (snapshot) => {
  const { operation, entity_id: entityId, data } = snapshot;
  if (!data || !entityId) {
    throw new Error('Snapshot data missing for attendance undo.');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    switch (operation) {
      case 'create': {
        await connection.execute(`DELETE FROM attendance WHERE id = ?`, [entityId]);
        break;
      }
      case 'update': {
        await connection.execute(
          `UPDATE attendance 
           SET student_ic = ?, class_id = ?, tarikh = ?, status = ?, updated_at = ?
           WHERE id = ?`,
          [
            data.student_ic,
            data.class_id,
            formatDateTimeForDB(data.tarikh),
            data.status,
            formatDateTimeForDB(data.updated_at),
            entityId
          ]
        );
        break;
      }
      case 'delete': {
        await connection.execute(
          `INSERT INTO attendance (id, student_ic, class_id, tarikh, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             student_ic = VALUES(student_ic),
             class_id = VALUES(class_id),
             tarikh = VALUES(tarikh),
             status = VALUES(status),
             updated_at = VALUES(updated_at)`,
          [
            entityId,
            data.student_ic,
            data.class_id,
            formatDateTimeForDB(data.tarikh),
            data.status,
            formatDateTimeForDB(data.created_at),
            formatDateTimeForDB(data.updated_at)
          ]
        );
        break;
      }
      default:
        throw new Error(`Unsupported snapshot operation for attendance: ${operation}`);
    }

    await connection.commit();
    return {
      entityId: entityId,
      entityType: 'attendance',
      action: operation === 'create' ? 'delete' : operation === 'delete' ? 'restore' : 'update'
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const undoFeeAction = async (snapshot) => {
  const { operation, entity_id: entityId, data } = snapshot;
  if (!data || !entityId) {
    throw new Error('Snapshot data missing for fee undo.');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    switch (operation) {
      case 'create': {
        await connection.execute(`DELETE FROM fees WHERE id = ?`, [entityId]);
        break;
      }
      case 'update': {
        await connection.execute(
          `UPDATE fees 
           SET student_ic = ?, jumlah = ?, status = ?, tarikh = ?, tarikh_bayar = ?, bulan = ?, tahun = ?, cara_bayar = ?, no_resit = ?, resit_img = ?, updated_at = ?
           WHERE id = ?`,
          [
            data.student_ic,
            data.jumlah,
            data.status,
            formatDateTimeForDB(data.tarikh),
            formatDateTimeForDB(data.tarikh_bayar),
            data.bulan,
            data.tahun,
            data.cara_bayar,
            data.no_resit,
            data.resit_img,
            formatDateTimeForDB(data.updated_at),
            entityId
          ]
        );
        break;
      }
      case 'delete': {
        await connection.execute(
          `INSERT INTO fees (id, student_ic, jumlah, status, tarikh, tarikh_bayar, bulan, tahun, cara_bayar, no_resit, resit_img, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             student_ic = VALUES(student_ic),
             jumlah = VALUES(jumlah),
             status = VALUES(status),
             tarikh = VALUES(tarikh),
             tarikh_bayar = VALUES(tarikh_bayar),
             bulan = VALUES(bulan),
             tahun = VALUES(tahun),
             cara_bayar = VALUES(cara_bayar),
             no_resit = VALUES(no_resit),
             resit_img = VALUES(resit_img),
             updated_at = VALUES(updated_at)`,
          [
            entityId,
            data.student_ic,
            data.jumlah,
            data.status,
            formatDateTimeForDB(data.tarikh),
            formatDateTimeForDB(data.tarikh_bayar),
            data.bulan,
            data.tahun,
            data.cara_bayar,
            data.no_resit,
            data.resit_img,
            formatDateTimeForDB(data.created_at),
            formatDateTimeForDB(data.updated_at)
          ]
        );
        break;
      }
      default:
        throw new Error(`Unsupported snapshot operation for fee: ${operation}`);
    }

    await connection.commit();
    return {
      entityId: entityId,
      entityType: 'fee',
      action: operation === 'create' ? 'delete' : operation === 'delete' ? 'restore' : 'update'
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const undoResultAction = async (snapshot) => {
  const { operation, entity_id: entityId, data } = snapshot;
  if (!data || !entityId) {
    throw new Error('Snapshot data missing for result undo.');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    switch (operation) {
      case 'create': {
        await connection.execute(`DELETE FROM results WHERE id = ?`, [entityId]);
        break;
      }
      case 'update': {
        await connection.execute(
          `UPDATE results 
           SET student_ic = ?, exam_id = ?, markah = ?, gred = ?, slip_img = ?, catatan = ?, updated_at = ?
           WHERE id = ?`,
          [
            data.student_ic,
            data.exam_id,
            data.markah,
            data.gred,
            data.slip_img,
            data.catatan,
            formatDateTimeForDB(data.updated_at),
            entityId
          ]
        );
        break;
      }
      case 'delete': {
        await connection.execute(
          `INSERT INTO results (id, student_ic, exam_id, markah, gred, slip_img, catatan, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             student_ic = VALUES(student_ic),
             exam_id = VALUES(exam_id),
             markah = VALUES(markah),
             gred = VALUES(gred),
             slip_img = VALUES(slip_img),
             catatan = VALUES(catatan),
             updated_at = VALUES(updated_at)`,
          [
            entityId,
            data.student_ic,
            data.exam_id,
            data.markah,
            data.gred,
            data.slip_img,
            data.catatan,
            formatDateTimeForDB(data.created_at),
            formatDateTimeForDB(data.updated_at)
          ]
        );
        break;
      }
      default:
        throw new Error(`Unsupported snapshot operation for result: ${operation}`);
    }

    await connection.commit();
    return {
      entityId: entityId,
      entityType: 'result',
      action: operation === 'create' ? 'delete' : operation === 'delete' ? 'restore' : 'update'
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const undoExamAction = async (snapshot) => {
  const { operation, entity_id: entityId, data } = snapshot;
  if (!data || !entityId) {
    throw new Error('Snapshot data missing for exam undo.');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    switch (operation) {
      case 'create': {
        await connection.execute(`DELETE FROM exams WHERE id = ?`, [entityId]);
        break;
      }
      case 'update': {
        await connection.execute(
          `UPDATE exams 
           SET class_id = ?, subject = ?, tarikh_exam = ?, updated_at = ?
           WHERE id = ?`,
          [
            data.class_id,
            data.subject,
            formatDateTimeForDB(data.tarikh_exam),
            formatDateTimeForDB(data.updated_at),
            entityId
          ]
        );
        break;
      }
      case 'delete': {
        await connection.execute(
          `INSERT INTO exams (id, class_id, subject, tarikh_exam, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             class_id = VALUES(class_id),
             subject = VALUES(subject),
             tarikh_exam = VALUES(tarikh_exam),
             updated_at = VALUES(updated_at)`,
          [
            entityId,
            data.class_id,
            data.subject,
            formatDateTimeForDB(data.tarikh_exam),
            formatDateTimeForDB(data.created_at),
            formatDateTimeForDB(data.updated_at)
          ]
        );
        break;
      }
      default:
        throw new Error(`Unsupported snapshot operation for exam: ${operation}`);
    }

    await connection.commit();
    return {
      entityId: entityId,
      entityType: 'exam',
      action: operation === 'create' ? 'delete' : operation === 'delete' ? 'restore' : 'update'
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const entityUndoHandlers = {
  announcement: undoAnnouncementAction,
  student: undoStudentAction,
  teacher: undoTeacherAction,
  class: undoClassAction,
  picUser: undoPicUserAction,
  attendance: undoAttendanceAction,
  fee: undoFeeAction,
  result: undoResultAction,
  exam: undoExamAction
};

export const undoValidators = [
  param('id')
    .isInt()
    .withMessage('Snapshot ID must be a valid integer'),
];

export const listValidators = [
  query('entityType')
    .optional()
    .isString()
    .withMessage('entityType must be a string')
];

export const listUndoableActions = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { entityType } = req.query;

    console.log('[LIST UNDOABLE ACTIONS] Request received:', {
      entityType,
      query: req.query
    });

    const snapshots = await listSnapshots({ entityType });

    // Debug: Check specifically for attendance snapshots
    const attendanceSnapshots = snapshots.filter(s => s.entity_type === 'attendance');
    console.log('[LIST UNDOABLE ACTIONS] Total snapshots:', snapshots.length);
    console.log('[LIST UNDOABLE ACTIONS] Attendance snapshots:', attendanceSnapshots.length);
    if (attendanceSnapshots.length > 0) {
      console.log('[LIST UNDOABLE ACTIONS] Attendance snapshot details:', attendanceSnapshots.map(s => ({
        id: s.id,
        entity_id: s.entity_id,
        operation: s.operation,
        was_undone: s.was_undone,
        expires_at: s.expires_at,
        created_at: s.created_at
      })));
    } else {
      console.log('[LIST UNDOABLE ACTIONS] ⚠️ No attendance snapshots found in results');
    }

    res.json({
      success: true,
      data: snapshots.map((snapshot) => ({
        ...snapshot,
        ttlHours: SNAPSHOT_TTL_HOURS
      }))
    });
  } catch (error) {
    console.error('List undoable actions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const undoAction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const snapshotId = Number(req.params.id);
    const snapshot = await getSnapshotById(snapshotId);

    if (!snapshot) {
      return res.status(404).json({
        success: false,
        message: 'Unable to find action to undo.'
      });
    }

    if (snapshot.was_undone) {
      return res.status(400).json({
        success: false,
        message: 'This action has already been undone.'
      });
    }

    if (new Date(snapshot.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'The undo window has expired for this action.'
      });
    }

    const handler = entityUndoHandlers[snapshot.entity_type];
    if (!handler) {
      return res.status(400).json({
        success: false,
        message: 'Undo not supported for this entity type.'
      });
    }

    await handler(snapshot);
    await markSnapshotUndone(snapshotId);

    res.json({
      success: true,
      message: 'Action has been undone successfully.',
      data: {
        snapshotId,
        entityType: snapshot.entity_type,
        entityId: snapshot.entity_identifier || snapshot.entity_id
      }
    });
  } catch (error) {
    console.error('Undo action error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


