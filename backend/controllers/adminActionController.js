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

const entityUndoHandlers = {
  announcement: undoAnnouncementAction,
  student: undoStudentAction
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

    const snapshots = await listSnapshots({ entityType });

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


