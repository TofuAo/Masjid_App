import { pool } from '../config/database.js';
import { createSnapshot, SNAPSHOT_TTL_HOURS } from '../utils/adminActionSnapshots.js';
import { registerPendingPicHandler } from '../utils/pendingPicChanges.js';

const formatDateTimeForDB = (dateTimeString) => {
  if (!dateTimeString) return null;
  if (dateTimeString instanceof Date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${dateTimeString.getFullYear()}-${pad(dateTimeString.getMonth() + 1)}-${pad(dateTimeString.getDate())} ${pad(dateTimeString.getHours())}:${pad(dateTimeString.getMinutes())}:${pad(dateTimeString.getSeconds())}`;
  }
  if (typeof dateTimeString === 'string' && dateTimeString.includes('T')) {
    return `${dateTimeString.replace('T', ' ')}:00`;
  }
  return dateTimeString;
};

const getExecutor = (connection) => connection ?? pool;

const fetchAnnouncementById = async (id, connection = null) => {
  const executor = getExecutor(connection);
  const [rows] = await executor.execute(
    `
    SELECT a.*, u.nama as author_nama
    FROM announcements a
    JOIN users u ON a.author_telefon = u.telefon
    WHERE a.id = ?
    `,
    [id]
  );
  return rows[0] || null;
};

export const createAnnouncementRecord = async (
  input,
  { actorPhone, requestedBy = null, authorPhone = null } = {},
  connection = null
) => {
  const {
    title,
    content,
    status = 'published',
    priority = 'normal',
    target_audience = 'all',
    start_date = null,
    end_date = null
  } = input;

  const executor = getExecutor(connection);

  const author = authorPhone ?? actorPhone;

  // Automatically set dates when status is 'published' (when admin approves)
  let finalStartDate = formatDateTimeForDB(start_date);
  let finalEndDate = formatDateTimeForDB(end_date);
  
  if (status === 'published') {
    // Set start_date to current time when published
    if (!finalStartDate) {
      finalStartDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    }
    // Set end_date to 1 month from now if not provided
    if (!finalEndDate) {
      const oneMonthLater = new Date();
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
      finalEndDate = oneMonthLater.toISOString().slice(0, 19).replace('T', ' ');
    }
  }

  const [result] = await executor.execute(
    `
    INSERT INTO announcements (title, content, author_telefon, status, priority, target_audience, start_date, end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      title,
      content,
      author,
      status,
      priority,
      target_audience,
      finalStartDate,
      finalEndDate
    ]
  );

  const announcement = await fetchAnnouncementById(result.insertId, connection);

  const undoSnapshotId = await createSnapshot({
    entityType: 'announcement',
    entityId: result.insertId,
    entityIdentifier: String(result.insertId),
    operation: 'create',
    data: announcement,
    metadata: {
      title,
      requestedBy,
      operationLabel: requestedBy
        ? `Approved pending announcement (diminta oleh ${requestedBy})`
        : 'Created announcement'
    },
    actorPhone
  });

  return {
    announcement,
    undoToken: undoSnapshotId,
    undoExpiresAt: new Date(Date.now() + SNAPSHOT_TTL_HOURS * 60 * 60 * 1000).toISOString()
  };
};

export const updateAnnouncementRecord = async (id, input, { actorPhone, requestedBy = null } = {}, connection = null) => {
  const executor = getExecutor(connection);

  const [existingRows] = await executor.execute(
    'SELECT * FROM announcements WHERE id = ?',
    [id]
  );

  if (existingRows.length === 0) {
    const error = new Error('Announcement not found');
    error.status = 404;
    throw error;
  }

  const previousRecord = existingRows[0];

  const undoSnapshotId = await createSnapshot({
    entityType: 'announcement',
    entityId: Number(id),
    entityIdentifier: String(id),
    operation: 'update',
    data: previousRecord,
    metadata: {
      title: previousRecord.title,
      requestedBy,
      operationLabel: requestedBy
        ? `Approved update (diminta oleh ${requestedBy})`
        : 'Updated announcement'
    },
    actorPhone
  });

  // Automatically set dates when status changes to 'published' (when admin approves)
  let finalStartDate = formatDateTimeForDB(input.start_date);
  let finalEndDate = formatDateTimeForDB(input.end_date);
  
  // If status is changing to 'published' and dates are not set, auto-set them
  if (input.status === 'published' && previousRecord.status !== 'published') {
    // Set start_date to current time when published
    if (!finalStartDate) {
      finalStartDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    }
    // Set end_date to 1 month from now if not provided
    if (!finalEndDate) {
      const oneMonthLater = new Date();
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
      finalEndDate = oneMonthLater.toISOString().slice(0, 19).replace('T', ' ');
    }
  } else if (input.status === 'published' && previousRecord.status === 'published') {
    // If already published, keep existing dates if new ones not provided
    if (!finalStartDate) {
      finalStartDate = previousRecord.start_date;
    }
    if (!finalEndDate) {
      finalEndDate = previousRecord.end_date;
    }
  }

  await executor.execute(
    `
    UPDATE announcements
    SET title = ?, content = ?, status = ?, priority = ?, target_audience = ?, start_date = ?, end_date = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    `,
    [
      input.title,
      input.content,
      input.status,
      input.priority,
      input.target_audience,
      finalStartDate,
      finalEndDate,
      id
    ]
  );

  const announcement = await fetchAnnouncementById(id, connection);

  return {
    announcement,
    undoToken: undoSnapshotId,
    undoExpiresAt: new Date(Date.now() + SNAPSHOT_TTL_HOURS * 60 * 60 * 1000).toISOString()
  };
};

export const deleteAnnouncementRecord = async (id, { actorPhone, requestedBy = null } = {}, connection = null) => {
  const executor = getExecutor(connection);

  const [existingRows] = await executor.execute(
    'SELECT * FROM announcements WHERE id = ?',
    [id]
  );

  if (existingRows.length === 0) {
    const error = new Error('Announcement not found');
    error.status = 404;
    throw error;
  }

  const record = existingRows[0];

  const undoSnapshotId = await createSnapshot({
    entityType: 'announcement',
    entityId: Number(id),
    entityIdentifier: String(record.id),
    operation: 'delete',
    data: record,
    metadata: {
      title: record.title,
      requestedBy,
      operationLabel: requestedBy
        ? `Approved deletion (diminta oleh ${requestedBy})`
        : 'Deleted announcement'
    },
    actorPhone
  });

  await executor.execute(
    'DELETE FROM announcements WHERE id = ?',
    [id]
  );

  return {
    undoToken: undoSnapshotId,
    undoExpiresAt: new Date(Date.now() + SNAPSHOT_TTL_HOURS * 60 * 60 * 1000).toISOString()
  };
};

registerPendingPicHandler('announcements:create', async ({ payload, actorPhone, adminIc, connection }) => {
  const result = await createAnnouncementRecord(
    payload,
    { actorPhone: adminIc, requestedBy: actorPhone, authorPhone: actorPhone },
    connection
  );
  // Return data in format expected by PIC snapshot creation
  return {
    entityId: result.announcement.id,
    entityIdentifier: String(result.announcement.id),
    snapshotData: result.announcement,
    ...result.announcement
  };
});

registerPendingPicHandler('announcements:update', async ({ payload, entityId, actorPhone, adminIc, connection }) => {
  const result = await updateAnnouncementRecord(
    entityId,
    payload,
    { actorPhone: adminIc, requestedBy: actorPhone },
    connection
  );
  // Return data in format expected by PIC snapshot creation
  return {
    entityId: result.announcement.id,
    entityIdentifier: String(result.announcement.id),
    snapshotData: result.announcement,
    ...result.announcement
  };
});

registerPendingPicHandler('announcements:delete', async ({ entityId, actorPhone, adminIc, connection, metadata }) => {
  // Get announcement data BEFORE deletion for PIC snapshot
  const executor = connection || pool;
  const [existingRows] = await executor.execute(
    'SELECT * FROM announcements WHERE id = ?',
    [entityId]
  );
  
  if (existingRows.length === 0) {
    const error = new Error('Announcement not found');
    error.status = 404;
    throw error;
  }
  
  const announcementData = existingRows[0];
  
  // Now delete the announcement
  const result = await deleteAnnouncementRecord(
    entityId,
    { actorPhone: adminIc, requestedBy: actorPhone },
    connection
  );
  
  // Return data in format expected by PIC snapshot creation
  return {
    entityId: Number(entityId),
    entityIdentifier: String(entityId),
    snapshotData: announcementData,
    deletedId: entityId,
    undoToken: result.undoToken
  };
});

