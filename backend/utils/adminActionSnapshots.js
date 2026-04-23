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
    expires_at TIMESTAMP NULL,
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

  // Check for existing active snapshot for the same entity/operation to prevent duplicates
  // Only check for delete operations to allow multiple create/update snapshots
  // NOTE: We allow new snapshots if the old one was already undone or expired
  if (operation === 'delete') {
    const [existing] = await pool.execute(
      `SELECT id FROM admin_action_snapshots 
       WHERE entity_type = ? 
         AND entity_id = ? 
         AND operation = 'delete' 
         AND was_undone = 0 
         AND expires_at >= NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [entityType, entityId]
    );

    if (existing.length > 0) {
      console.warn(`[SNAPSHOT] Active delete snapshot already exists for ${entityType}:${entityId} (ID: ${existing[0].id}). Creating new snapshot anyway to track the deletion.`);
      // Continue to create new snapshot - this allows tracking if same record is deleted multiple times
      // The listSnapshots function will show the most recent one
    }
  }

  const jsonData = JSON.stringify(data);
  const metadataJson = metadata ? JSON.stringify(metadata) : null;

  const [result] = await pool.execute(
    `INSERT INTO admin_action_snapshots 
      (entity_type, entity_id, entity_identifier, operation, data, metadata, created_by, expires_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? HOUR))`,
    [entityType, entityId, entityIdentifier, operation, jsonData, metadataJson, actorIc, SNAPSHOT_TTL_HOURS]
  );

  console.log(`[SNAPSHOT] Created snapshot ID ${result.insertId} for ${entityType}:${entityId} operation:${operation} by ${actorIc}`);
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
  const whereClauses = ['aas.was_undone = 0', 'aas.expires_at >= NOW()'];
  const params = [];

  if (entityType) {
    whereClauses.push('aas.entity_type = ?');
    params.push(entityType);
  }

  const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  console.log('[LIST SNAPSHOTS] Query:', {
    entityType,
    whereClauses,
    params
  });

  // First, let's check ALL snapshots (including expired/undone) to see if attendance ones exist
  const [allSnapshots] = await pool.execute(
    `SELECT entity_type, COUNT(*) as count 
     FROM admin_action_snapshots 
     GROUP BY entity_type`
  );
  console.log('[LIST SNAPSHOTS] All snapshots in database by type:', allSnapshots);

  const [rows] = await pool.execute(
    `SELECT aas.*, u.nama as created_by_nama
     FROM admin_action_snapshots aas
     LEFT JOIN users u ON aas.created_by = u.ic
     ${where}
     ORDER BY aas.created_at DESC`,
    params
  );

  console.log('[LIST SNAPSHOTS] Found', rows.length, 'active snapshots');
  if (rows.length > 0) {
    const entityTypes = [...new Set(rows.map(r => r.entity_type))];
    console.log('[LIST SNAPSHOTS] Entity types found:', entityTypes);
    
    // Check specifically for attendance
    const attendanceRows = rows.filter(r => r.entity_type === 'attendance');
    console.log('[LIST SNAPSHOTS] Attendance snapshots in results:', attendanceRows.length);
    if (attendanceRows.length > 0) {
      console.log('[LIST SNAPSHOTS] Attendance snapshot details:', attendanceRows.map(r => ({
        id: r.id,
        entity_id: r.entity_id,
        operation: r.operation,
        was_undone: r.was_undone,
        expires_at: r.expires_at,
        created_at: r.created_at
      })));
    }
  } else {
    console.log('[LIST SNAPSHOTS] ⚠️ No active snapshots found');
  }

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


