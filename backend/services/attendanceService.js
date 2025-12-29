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
  // Return snapshot data for PIC recycle bin in proper format
  return {
    entityId: result.attendance.id,
    entityIdentifier: `${result.attendance.student_ic}-${result.attendance.class_id}-${result.attendance.tarikh}`,
    snapshotData: result.attendance,
    ...result.attendance
  };
});

registerPendingPicHandler('attendance:update', async ({ payload, entityId, actorIc, adminIc, connection }) => {
  const result = await updateAttendanceRecord(
    entityId,
    payload,
    { connection }
  );
  // Return snapshot data for PIC recycle bin in proper format
  return {
    entityId: result.attendance.id,
    entityIdentifier: `${result.attendance.student_ic}-${result.attendance.class_id}-${result.attendance.tarikh}`,
    snapshotData: result.attendance,
    ...result.attendance
  };
});

registerPendingPicHandler('attendance:delete', async ({ entityId, payload, actorIc, adminIc, connection }) => {
  console.log('[ATTENDANCE SERVICE] ===== PIC APPROVED DELETION HANDLER =====');
  console.log('[ATTENDANCE SERVICE] Entity ID:', entityId);
  console.log('[ATTENDANCE SERVICE] Payload:', payload);
  console.log('[ATTENDANCE SERVICE] Actor IC (PIC):', actorIc);
  console.log('[ATTENDANCE SERVICE] Admin IC (approver):', adminIc);
  
  // Get entityId from params or payload (for undo requests, it might be in payload)
  const deleteEntityId = entityId || payload?.id;
  if (!deleteEntityId) {
    throw new Error('Entity ID is required for deletion');
  }
  
  // Get attendance data before deletion (for PIC recycle bin snapshot)
  const executor = connection || pool;
  const [existingAttendance] = await executor.execute(
    `SELECT a.*, u.nama as pelajar_nama, c.nama_kelas
     FROM attendance a
     LEFT JOIN users u ON a.student_ic = u.ic
     LEFT JOIN classes c ON a.class_id = c.id
     WHERE a.id = ?`,
    [deleteEntityId]
  );

  if (existingAttendance.length === 0) {
    const error = new Error('Attendance record not found');
    error.status = 404;
    throw error;
  }

  const attendanceData = existingAttendance[0];
  
  // Delete attendance record
  const result = await deleteAttendanceRecord(
    deleteEntityId,
    { connection }
  );
  console.log('[ATTENDANCE SERVICE] ✅ Attendance record deleted from database');
  
  // Return snapshot data for PIC recycle bin in proper format
  return {
    entityId: attendanceData.id,
    entityIdentifier: `${attendanceData.student_ic}-${attendanceData.class_id}-${attendanceData.tarikh}`,
    snapshotData: {
      id: attendanceData.id,
      student_ic: attendanceData.student_ic,
      class_id: attendanceData.class_id,
      tarikh: attendanceData.tarikh,
      status: attendanceData.status,
      proof_image: attendanceData.proof_image || null,
      marked_by: attendanceData.marked_by || null,
      document_confirmed: attendanceData.document_confirmed || null,
      confirmed_by: attendanceData.confirmed_by || null,
      created_at: attendanceData.created_at,
      updated_at: attendanceData.updated_at
    }
  };
});

/**
 * Bulk mark attendance records
 * @param {Object} data - Bulk attendance data
 * @param {number} data.class_id - Class ID
 * @param {string} data.tarikh - Date (ISO format)
 * @param {Array} data.attendance_data - Array of {student_ic, status}
 * @param {Object} options - Options
 * @param {Object} options.connection - Database connection (for transactions)
 * @returns {Promise<Object>} Result with processed records
 */
export const bulkMarkAttendanceRecords = async (data, options = {}) => {
  const { class_id, tarikh, attendance_data } = data;
  const executor = options.connection || pool;
  const attendanceDate = tarikh || new Date().toISOString().split('T')[0];
  
  const results = [];
  
  for (const record of attendance_data) {
    const { student_ic, status } = record;
    
    if (!['Hadir', 'Tidak Hadir', 'Cuti'].includes(status)) {
      throw new Error(`Invalid attendance status: ${status}`);
    }
    
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
      results.push({ student_ic, status, action: 'updated' });
    } else {
      // Insert new attendance record
      await executor.execute(
        `INSERT INTO attendance (student_ic, class_id, tarikh, status)
         VALUES (?, ?, ?, ?)`,
        [student_ic, class_id, attendanceDate, status]
      );
      results.push({ student_ic, status, action: 'created' });
    }
  }
  
  return { results, class_id, tarikh: attendanceDate };
};

/**
 * Bulk mark attendance records with proof
 * @param {Object} data - Bulk attendance data with proof
 * @param {number} data.class_id - Class ID
 * @param {string} data.tarikh - Date (ISO format)
 * @param {Array} data.attendance_data - Array of {student_ic, status}
 * @param {string} data.proof_image - Proof image path
 * @param {string} data.marked_by - IC of user who marked attendance
 * @param {Object} options - Options
 * @param {Object} options.connection - Database connection (for transactions)
 * @returns {Promise<Object>} Result with processed records
 */
export const bulkMarkAttendanceRecordsWithProof = async (data, options = {}) => {
  const { class_id, tarikh, attendance_data, proof_image, marked_by } = data;
  const executor = options.connection || pool;
  const attendanceDate = tarikh || new Date().toISOString().split('T')[0];
  
  const results = [];
  
  for (const record of attendance_data) {
    const { student_ic, status } = record;
    
    // Allow additional statuses: Lewat, Sakit
    if (!['Hadir', 'Tidak Hadir', 'Cuti', 'Lewat', 'Sakit'].includes(status)) {
      throw new Error(`Invalid attendance status: ${status}`);
    }
    
    // Check if attendance already exists
    const [existingAttendance] = await executor.execute(
      'SELECT id FROM attendance WHERE student_ic = ? AND class_id = ? AND tarikh = ?',
      [student_ic, class_id, attendanceDate]
    );
    
    if (existingAttendance.length > 0) {
      // Update existing attendance
      await executor.execute(
        `UPDATE attendance 
         SET status = ?, 
             proof_image = ?,
             marked_by = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE student_ic = ? AND class_id = ? AND tarikh = ?`,
        [status, proof_image || null, marked_by || null, student_ic, class_id, attendanceDate]
      );
      results.push({ student_ic, status, action: 'updated' });
    } else {
      // Insert new attendance record
      await executor.execute(
        `INSERT INTO attendance (student_ic, class_id, tarikh, status, proof_image, marked_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [student_ic, class_id, attendanceDate, status, proof_image || null, marked_by || null]
      );
      results.push({ student_ic, status, action: 'created' });
    }
  }
  
  return { results, class_id, tarikh: attendanceDate, proof_image };
};

// Register bulk approval handlers
registerPendingPicHandler('attendance:bulk-create', async ({ payload, actorIc, adminIc, connection }) => {
  const result = await bulkMarkAttendanceRecords(
    payload,
    { connection }
  );
  // Return snapshot data for PIC recycle bin in proper format
  return {
    entityId: 0, // Bulk operations use 0 for entityId
    entityIdentifier: `bulk-${payload.class_id}-${payload.tarikh || new Date().toISOString().split('T')[0]}`,
    snapshotData: result,
    ...result
  };
});

registerPendingPicHandler('attendance:bulk-create-with-proof', async ({ payload, actorIc, adminIc, connection }) => {
  const result = await bulkMarkAttendanceRecordsWithProof(
    payload,
    { connection }
  );
  // Return snapshot data for PIC recycle bin in proper format
  return {
    entityId: 0, // Bulk operations use 0 for entityId
    entityIdentifier: `bulk-proof-${payload.class_id}-${payload.tarikh || new Date().toISOString().split('T')[0]}`,
    snapshotData: result,
    ...result
  };
});

