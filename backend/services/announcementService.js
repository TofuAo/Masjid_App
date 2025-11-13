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
    JOIN users u ON a.author_ic = u.ic
    WHERE a.id = ?
    `,
    [id]
  );
  return rows[0] || null;
};

export const createAnnouncementRecord = async (
  input,
  { actorIc, requestedBy = null, authorIc = null } = {},
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

  const author = authorIc ?? actorIc;

  const [result] = await executor.execute(
    `
    INSERT INTO announcements (title, content, author_ic, status, priority, target_audience, start_date, end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      title,
      content,
      author,
      status,
      priority,
      target_audience,
      formatDateTimeForDB(start_date),
      formatDateTimeForDB(end_date)
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
    actorIc
  });

  return {
    announcement,
    undoToken: undoSnapshotId,
    undoExpiresAt: new Date(Date.now() + SNAPSHOT_TTL_HOURS * 60 * 60 * 1000).toISOString()
  };
};

export const updateAnnouncementRecord = async (id, input, { actorIc, requestedBy = null } = {}, connection = null) => {
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
    actorIc
  });

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
      formatDateTimeForDB(input.start_date),
      formatDateTimeForDB(input.end_date),
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

export const deleteAnnouncementRecord = async (id, { actorIc, requestedBy = null } = {}, connection = null) => {
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
    actorIc
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

registerPendingPicHandler('announcements:create', async ({ payload, actorIc, adminIc, connection }) => {
  const result = await createAnnouncementRecord(
    payload,
    { actorIc: adminIc, requestedBy: actorIc, authorIc: actorIc },
    connection
  );
  return result.announcement;
});

registerPendingPicHandler('announcements:update', async ({ payload, entityId, actorIc, adminIc, connection }) => {
  const result = await updateAnnouncementRecord(
    entityId,
    payload,
    { actorIc: adminIc, requestedBy: actorIc },
    connection
  );
  return result.announcement;
});

registerPendingPicHandler('announcements:delete', async ({ entityId, actorIc, adminIc, connection }) => {
  const result = await deleteAnnouncementRecord(
    entityId,
    { actorIc: adminIc, requestedBy: actorIc },
    connection
  );
  return { deletedId: entityId, undoToken: result.undoToken };
});

