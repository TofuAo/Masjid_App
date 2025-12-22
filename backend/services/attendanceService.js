import { pool } from '../config/database.js';
import { registerPendingPicHandler } from '../utils/pendingPicChanges.js';

/**
 * Create or update attendance record
 * @param {Object} data - Attendance data
 * @param {string} data.student_ic - Student IC
 * @param {number} data.class_id - Class ID
 * @param {string} data.tarikh - Date (ISO format)
 * @param {string} data.status - Status (Hadir, Tidak Hadir, Cuti)
 * @param {Object} options - Options
 * @param {Object} options.connection - Database connection (for transactions)
 * @returns {Promise<Object>} Created/updated attendance record
 */
export const createOrUpdateAttendanceRecord = async (data, options = {}) => {
  const { student_ic, class_id, tarikh, status } = data;
  const executor = options.connection || pool;
  const attendanceDate = tarikh || new Date().toISOString().split('T')[0];

  // Check if attendance already exists
  const [existingAttendance] = await executor.execute(
    'SELECT id FROM attendance WHERE student_ic = ? AND class_id = ? AND tarikh = ?',
    [student_ic, class_id, attendanceDate]
  );

  if (existingAttendance.length > 0) {
    // Update existing attendance
    await executor.execute(
      `UPDATE attendance 
       SET status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE student_ic = ? AND class_id = ? AND tarikh = ?`,
      [status, student_ic, class_id, attendanceDate]
    );

    const [updated] = await executor.execute(
      'SELECT * FROM attendance WHERE student_ic = ? AND class_id = ? AND tarikh = ?',
      [student_ic, class_id, attendanceDate]
    );
    return { attendance: updated[0], wasCreated: false };
  } else {
    // Create new attendance record
    await executor.execute(
      `INSERT INTO attendance (student_ic, class_id, tarikh, status)
       VALUES (?, ?, ?, ?)`,
      [student_ic, class_id, attendanceDate, status]
    );

    const [created] = await executor.execute(
      'SELECT * FROM attendance WHERE student_ic = ? AND class_id = ? AND tarikh = ?',
      [student_ic, class_id, attendanceDate]
    );
    return { attendance: created[0], wasCreated: true };
  }
};

/**
 * Update attendance record by ID
 * @param {number} id - Attendance record ID
 * @param {Object} data - Update data
 * @param {string} data.status - Status (Hadir, Tidak Hadir, Cuti)
 * @param {Object} options - Options
 * @param {Object} options.connection - Database connection (for transactions)
 * @returns {Promise<Object>} Updated attendance record
 */
export const updateAttendanceRecord = async (id, data, options = {}) => {
  const { status } = data;
  const executor = options.connection || pool;
  const attendanceId = parseInt(id);

  // Check if attendance record exists
  const [existingAttendance] = await executor.execute(
    'SELECT * FROM attendance WHERE id = ?',
    [attendanceId]
  );

  if (existingAttendance.length === 0) {
    const error = new Error('Attendance record not found');
    error.status = 404;
    throw error;
  }

  // Update attendance
  await executor.execute(
    'UPDATE attendance SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, attendanceId]
  );

  const [updated] = await executor.execute(
    'SELECT * FROM attendance WHERE id = ?',
    [attendanceId]
  );

  return { attendance: updated[0] };
};

/**
 * Delete attendance record
 * @param {number} id - Attendance record ID
 * @param {Object} options - Options
 * @param {Object} options.connection - Database connection (for transactions)
 * @returns {Promise<Object>} Deleted attendance record info
 */
export const deleteAttendanceRecord = async (id, options = {}) => {
  const executor = options.connection || pool;
  const attendanceId = parseInt(id);

  // Check if attendance record exists
  const [existingAttendance] = await executor.execute(
    'SELECT * FROM attendance WHERE id = ?',
    [attendanceId]
  );

  if (existingAttendance.length === 0) {
    const error = new Error('Attendance record not found');
    error.status = 404;
    throw error;
  }

  const deletedRecord = existingAttendance[0];

  // Delete attendance record
  await executor.execute(
    'DELETE FROM attendance WHERE id = ?',
    [attendanceId]
  );

  return { deletedId: attendanceId, deletedRecord };
};

// Register approval handlers
registerPendingPicHandler('attendance:create', async ({ payload, actorIc, adminIc, connection }) => {
  const result = await createOrUpdateAttendanceRecord(
    payload,
    { connection }
  );
  return result.attendance;
});

registerPendingPicHandler('attendance:update', async ({ payload, entityId, actorIc, adminIc, connection }) => {
  const result = await updateAttendanceRecord(
    entityId,
    payload,
    { connection }
  );
  return result.attendance;
});

registerPendingPicHandler('attendance:delete', async ({ entityId, actorIc, adminIc, connection }) => {
  const result = await deleteAttendanceRecord(
    entityId,
    { connection }
  );
  return result;
});

