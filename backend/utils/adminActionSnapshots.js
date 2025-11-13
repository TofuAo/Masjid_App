import { pool } from '../config/database.js';

export const SNAPSHOT_TTL_HOURS = 25;

const SNAPSHOT_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS admin_action_snapshots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(100) NOT NULL,
    entity_id INT NOT NULL,
    entity_identifier VARCHAR(191),
    operation ENUM('create', 'update', 'delete') NOT NULL,
    data JSON NOT NULL,
    metadata JSON,
    created_by VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    was_undone TINYINT(1) DEFAULT 0,
    undone_at TIMESTAMP NULL,
    INDEX idx_admin_snapshots_entity (entity_type, entity_id),
    INDEX idx_admin_snapshots_expires (expires_at),
    INDEX idx_admin_snapshots_created_by (created_by)
);
`;

let snapshotTableReady = false;

const ensureSnapshotTable = async () => {
  if (snapshotTableReady) {
    return;
  }
  await pool.execute(SNAPSHOT_TABLE_SQL);
  try {
    await pool.execute(`
      ALTER TABLE admin_action_snapshots
      ADD COLUMN entity_identifier VARCHAR(191) NULL
    `);
  } catch (error) {
    // Ignore if column already exists
    if (error.code !== 'ER_DUP_FIELDNAME') {
      throw error;
    }
  }
  snapshotTableReady = true;
};

/**
 * Persist a snapshot of data so that an action can be undone later.
 * @param {Object} params
 * @param {string} params.entityType
 * @param {number|string} params.entityId
 * @param {'create'|'update'|'delete'} params.operation
 * @param {Object} params.data
 * @param {Object|null} params.metadata
 * @param {string} params.actorIc
 * @returns {Promise<number>} snapshotId
 */
export async function createSnapshot({
  entityType,
  entityId,
  entityIdentifier = null,
  operation,
  data,
  metadata = null,
  actorIc
}) {
  await ensureSnapshotTable();
  if (!entityType || entityId === undefined || !operation || !data || !actorIc) {
    throw new Error('Missing required fields when creating admin action snapshot.');
  }

  const jsonData = JSON.stringify(data);
  const metadataJson = metadata ? JSON.stringify(metadata) : null;

  const [result] = await pool.execute(
    `INSERT INTO admin_action_snapshots 
      (entity_type, entity_id, entity_identifier, operation, data, metadata, created_by, expires_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? HOUR))`,
    [entityType, entityId, entityIdentifier, operation, jsonData, metadataJson, actorIc, SNAPSHOT_TTL_HOURS]
  );

  return result.insertId;
}

export async function getSnapshotById(id) {
  await ensureSnapshotTable();
  const [rows] = await pool.execute(
    `SELECT * 
     FROM admin_action_snapshots 
     WHERE id = ?`,
    [id]
  );

  if (!rows || rows.length === 0) {
    return null;
  }

  const snapshot = rows[0];
  const parseJson = (value, context) => {
    if (value === null || value === undefined) {
      return null;
    }
    if (Buffer.isBuffer(value)) {
      value = value.toString('utf8');
    }
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (error) {
        console.warn('Failed to parse JSON value from admin_action_snapshots:', {
          context,
          valueSnippet: value.slice(0, 100),
          error: error.message
        });
        return null;
      }
    }
    return value;
  };

  snapshot.data = parseJson(snapshot.data, `getSnapshotById:data:${id}`);
  snapshot.metadata = parseJson(snapshot.metadata, `getSnapshotById:metadata:${id}`);
  return snapshot;
}

export async function listSnapshots({ entityType = null } = {}) {
  await ensureSnapshotTable();
  const whereClauses = ['was_undone = 0', 'expires_at >= NOW()'];
  const params = [];

  if (entityType) {
    whereClauses.push('entity_type = ?');
    params.push(entityType);
  }

  const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const [rows] = await pool.execute(
    `SELECT *
     FROM admin_action_snapshots
     ${where}
     ORDER BY created_at DESC`,
    params
  );

  const parseJson = (value, context) => {
    if (value === null || value === undefined) {
      return null;
    }
    if (Buffer.isBuffer(value)) {
      value = value.toString('utf8');
    }
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (error) {
        console.warn('Failed to parse JSON value from admin_action_snapshots:', {
          context,
          valueSnippet: value.slice(0, 100),
          error: error.message
        });
        return null;
      }
    }
    return value;
  };

  return rows.map((row) => ({
    ...row,
    data: parseJson(row.data, `listSnapshots:data:${row.id}`),
    metadata: parseJson(row.metadata, `listSnapshots:metadata:${row.id}`)
  }));
}

export async function markSnapshotUndone(id) {
  await ensureSnapshotTable();
  await pool.execute(
    `UPDATE admin_action_snapshots 
     SET was_undone = 1, undone_at = NOW() 
     WHERE id = ?`,
    [id]
  );
}

export async function purgeExpiredSnapshots() {
  await ensureSnapshotTable();
  await pool.execute(
    `DELETE FROM admin_action_snapshots 
     WHERE expires_at < NOW()`
  );
}


