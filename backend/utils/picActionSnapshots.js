import { pool } from '../config/database.js';

export const PIC_SNAPSHOT_TTL_HOURS = 25; // 25 hours retention period

const PIC_SNAPSHOT_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS pic_action_snapshots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(100) NOT NULL,
    entity_id INT NOT NULL,
    entity_identifier VARCHAR(191),
    operation ENUM('create', 'update', 'delete', 'bulk-create', 'bulk-create-with-proof') NOT NULL,
    data JSON NOT NULL COMMENT 'Snapshot data of the action',
    metadata JSON COMMENT 'Additional metadata about the action',
    pic_ic VARCHAR(20) NOT NULL COMMENT 'PIC who initiated the action',
    approved_by VARCHAR(20) NULL COMMENT 'Admin who approved the action (NULL if pending)',
    pending_pic_change_id INT NULL COMMENT 'Reference to original pending_pic_changes.id',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL COMMENT 'When this record was deleted (for recycle bin)',
    expires_at TIMESTAMP NULL COMMENT 'When this snapshot expires (30 days)',
    was_undone TINYINT(1) DEFAULT 0 COMMENT 'Whether this action has been undone',
    undone_at TIMESTAMP NULL COMMENT 'When this action was undone',
    undo_pending_id INT NULL COMMENT 'Reference to undo request in pending_pic_changes.id',
    INDEX idx_pic_snapshots_entity (entity_type, entity_id),
    INDEX idx_pic_snapshots_expires (expires_at),
    INDEX idx_pic_snapshots_pic (pic_ic),
    INDEX idx_pic_snapshots_pending (pending_pic_change_id),
    INDEX idx_pic_snapshots_undo (undo_pending_id),
    INDEX idx_pic_snapshots_approved_by (approved_by),
    INDEX idx_pic_snapshots_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='PIC Recycle Bin: Stores approved PIC actions for undo capability';
`;

let snapshotTableReady = false;

const ensureSnapshotTable = async () => {
  if (snapshotTableReady) {
    return;
  }
  
  try {
    // First ensure pending_pic_changes table exists (for foreign key reference)
    // This will be created by pendingPicChanges.js, but we ensure it here as well
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS pending_pic_changes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        action_key VARCHAR(150) NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id VARCHAR(191) NULL,
        request_method VARCHAR(10) NOT NULL,
        request_path VARCHAR(255) NOT NULL,
        payload JSON NOT NULL,
        metadata JSON NULL,
        status ENUM('pending','approved','rejected') DEFAULT 'pending',
        created_by VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_by VARCHAR(20) NULL,
        approved_at TIMESTAMP NULL,
        notes TEXT NULL,
        INDEX idx_pending_pic_changes_status (status),
        INDEX idx_pending_pic_changes_actor (created_by),
        INDEX idx_pending_pic_changes_entity (entity_type, entity_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Create the pic_action_snapshots table
    await pool.execute(PIC_SNAPSHOT_TABLE_SQL);
    
    // Add deleted_at column if it doesn't exist
    try {
      await pool.execute(`
        ALTER TABLE pic_action_snapshots
        ADD COLUMN deleted_at TIMESTAMP NULL COMMENT 'When this record was deleted (for recycle bin)'
      `);
      console.log('✓ Added deleted_at column to pic_action_snapshots');
    } catch (alterError) {
      if (!alterError.message.includes('Duplicate column') && alterError.code !== 'ER_DUP_FIELDNAME') {
        console.warn('Could not add deleted_at column:', alterError.message);
      }
    }
    
    // Modify approved_by to allow NULL (for pending snapshots)
    try {
      await pool.execute(`
        ALTER TABLE pic_action_snapshots 
        MODIFY COLUMN approved_by VARCHAR(20) NULL COMMENT 'Admin who approved the action (NULL if pending)'
      `);
      console.log('✓ Modified approved_by column to allow NULL');
    } catch (alterError) {
      // Column might already be nullable - that's fine
      if (alterError.code !== 'ER_BAD_FIELD_ERROR' && !alterError.message.includes('Duplicate')) {
        console.warn('Could not modify approved_by column:', alterError.message);
      }
    }
    
    // Add foreign keys if they don't exist (MySQL doesn't support IF NOT EXISTS for foreign keys)
    // We'll attempt to add them and ignore errors if they already exist
    try {
      await pool.execute(`
        ALTER TABLE pic_action_snapshots
        ADD CONSTRAINT fk_pic_snapshots_pic_ic 
        FOREIGN KEY (pic_ic) REFERENCES users(ic) ON DELETE CASCADE
      `);
    } catch (err) {
      if (!err.message.includes('Duplicate foreign key') && !err.message.includes('already exists')) {
        console.warn('Could not add foreign key fk_pic_snapshots_pic_ic:', err.message);
      }
    }
    
    try {
      await pool.execute(`
        ALTER TABLE pic_action_snapshots
        ADD CONSTRAINT fk_pic_snapshots_approved_by 
        FOREIGN KEY (approved_by) REFERENCES users(ic) ON DELETE CASCADE
      `);
    } catch (err) {
      if (!err.message.includes('Duplicate foreign key') && !err.message.includes('already exists')) {
        console.warn('Could not add foreign key fk_pic_snapshots_approved_by:', err.message);
      }
    }
    
    try {
      await pool.execute(`
        ALTER TABLE pic_action_snapshots
        ADD CONSTRAINT fk_pic_snapshots_pending_pic_change 
        FOREIGN KEY (pending_pic_change_id) REFERENCES pending_pic_changes(id) ON DELETE SET NULL
      `);
    } catch (err) {
      if (!err.message.includes('Duplicate foreign key') && !err.message.includes('already exists')) {
        console.warn('Could not add foreign key fk_pic_snapshots_pending_pic_change:', err.message);
      }
    }
    
    try {
      await pool.execute(`
        ALTER TABLE pic_action_snapshots
        ADD CONSTRAINT fk_pic_snapshots_undo_pending 
        FOREIGN KEY (undo_pending_id) REFERENCES pending_pic_changes(id) ON DELETE SET NULL
      `);
    } catch (err) {
      if (!err.message.includes('Duplicate foreign key') && !err.message.includes('already exists')) {
        console.warn('Could not add foreign key fk_pic_snapshots_undo_pending:', err.message);
      }
    }
    
    snapshotTableReady = true;
    console.log('✓ pic_action_snapshots table ready (PIC Recycle Bin)');
  } catch (error) {
    console.error('Error ensuring pic_action_snapshots table:', error);
    // Don't throw - allow table creation to be retried
    snapshotTableReady = false;
  }
};

/**
 * Create a snapshot of a PIC-approved action for undo capability
 * @param {Object} params
 * @param {string} params.entityType
 * @param {number|string} params.entityId
 * @param {string|null} params.entityIdentifier
 * @param {'create'|'update'|'delete'} params.operation
 * @param {Object} params.data - The data before/after the operation
 * @param {Object|null} params.metadata
 * @param {string} params.picIc - IC of PIC who initiated the action
 * @param {string} params.approvedBy - IC of admin who approved
 * @param {number|null} params.pendingPicChangeId - ID of the original pending approval
 * @returns {Promise<number>} snapshotId
 */
export async function createPicSnapshot({
  entityType,
  entityId,
  entityIdentifier = null,
  operation,
  data,
  metadata = null,
  picIc,
  approvedBy = null, // Can be null if pending approval
  pendingPicChangeId = null
}) {
  await ensureSnapshotTable();
  
  // Validate required fields
  if (!entityType) {
    throw new Error('Missing entityType when creating PIC action snapshot.');
  }
  if (entityId === undefined || entityId === null) {
    throw new Error('Missing entityId when creating PIC action snapshot.');
  }
  if (!operation) {
    throw new Error('Missing operation when creating PIC action snapshot.');
  }
  if (!data) {
    throw new Error('Missing data when creating PIC action snapshot.');
  }
  if (!picIc) {
    throw new Error('Missing picIc when creating PIC action snapshot.');
  }
  // approvedBy is optional - can be null if pending approval

  // Ensure entityId is a number (INT column)
  const numericEntityId = Number(entityId);
  if (isNaN(numericEntityId)) {
    throw new Error(`Invalid entityId: ${entityId} (must be a number)`);
  }

  const jsonData = JSON.stringify(data);
  const metadataJson = metadata ? JSON.stringify(metadata) : null;

  console.log(`[PIC SNAPSHOT] Creating snapshot:`, {
    entityType,
    entityId: numericEntityId,
    entityIdentifier,
    operation,
    picIc,
    approvedBy,
    pendingPicChangeId
  });

  try {
    // Set deleted_at for delete operations
    const deletedAt = operation === 'delete' ? new Date() : null;
    
    const [result] = await pool.execute(
      `INSERT INTO pic_action_snapshots 
        (entity_type, entity_id, entity_identifier, operation, data, metadata, pic_ic, approved_by, pending_pic_change_id, deleted_at, expires_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? HOUR))`,
      [entityType, numericEntityId, entityIdentifier, operation, jsonData, metadataJson, picIc, approvedBy, pendingPicChangeId, deletedAt, PIC_SNAPSHOT_TTL_HOURS]
    );

    console.log(`[PIC SNAPSHOT] ✅ Created snapshot ID ${result.insertId} for ${entityType}:${numericEntityId} (${entityIdentifier || 'no identifier'}) operation:${operation} by PIC ${picIc} (approved by ${approvedBy}) deleted_at:${deletedAt}`);
    return result.insertId;
  } catch (error) {
    console.error(`[PIC SNAPSHOT] ❌ Failed to create snapshot:`, error);
    console.error(`[PIC SNAPSHOT] Error details:`, {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    throw error;
  }
}

/**
 * Get a PIC snapshot by ID
 */
export async function getPicSnapshotById(id) {
  await ensureSnapshotTable();
  const [rows] = await pool.execute(
    `SELECT * 
     FROM pic_action_snapshots 
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
        console.warn('Failed to parse JSON value from pic_action_snapshots:', {
          context,
          valueSnippet: value.slice(0, 100),
          error: error.message
        });
        return null;
      }
    }
    return value;
  };

  snapshot.data = parseJson(snapshot.data, `getPicSnapshotById:data:${id}`);
  snapshot.metadata = parseJson(snapshot.metadata, `getPicSnapshotById:metadata:${id}`);
  return snapshot;
}

/**
 * List PIC snapshots (for a specific PIC user)
 */
export async function listPicSnapshots({ picIc = null } = {}) {
  await ensureSnapshotTable();
  const whereClauses = ['pas.was_undone = 0', 'pas.expires_at >= NOW()', 'pas.deleted_at IS NOT NULL'];
  const params = [];

  if (picIc) {
    whereClauses.push('pas.pic_ic = ?');
    params.push(picIc);
  }

  const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const [rows] = await pool.execute(
    `SELECT pas.*, 
            u.nama as pic_nama,
            admin.nama as approved_by_nama
     FROM pic_action_snapshots pas
     LEFT JOIN users u ON pas.pic_ic = u.ic
     LEFT JOIN users admin ON pas.approved_by = admin.ic
     ${where}
     ORDER BY pas.deleted_at DESC`,
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
        console.warn('Failed to parse JSON value from pic_action_snapshots:', {
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
    data: parseJson(row.data, `listPicSnapshots:data:${row.id}`),
    metadata: parseJson(row.metadata, `listPicSnapshots:metadata:${row.id}`)
  }));
}

/**
 * Mark a PIC snapshot as undone (when undo request is approved)
 */
export async function markPicSnapshotUndone(id, undoPendingId = null) {
  await ensureSnapshotTable();
  await pool.execute(
    `UPDATE pic_action_snapshots 
     SET was_undone = 1, undone_at = NOW(), undo_pending_id = ?
     WHERE id = ?`,
    [undoPendingId, id]
  );
}

/**
 * Purge expired PIC snapshots
 * @returns {Promise<number>} Number of deleted snapshots
 */
export async function purgeExpiredPicSnapshots() {
  await ensureSnapshotTable();
  const [result] = await pool.execute(
    `DELETE FROM pic_action_snapshots 
     WHERE expires_at < NOW()`
  );
  const deletedCount = result.affectedRows || 0;
  if (deletedCount > 0) {
    console.log(`[PIC RECYCLE BIN] Purged ${deletedCount} expired snapshot(s)`);
  }
  return deletedCount;
}

/**
 * Ensure PIC snapshot table exists (for server startup)
 */
export async function ensurePicSnapshotTable() {
  await ensureSnapshotTable();
}

/**
 * Create an undo request for a PIC action
 * This creates a new pending PIC change that goes to approval
 */
export async function createUndoRequest({ snapshotId, picIc }) {
  await ensureSnapshotTable();
  
  // Get the snapshot
  const snapshot = await getPicSnapshotById(snapshotId);
  if (!snapshot) {
    throw new Error('PIC snapshot not found.');
  }
  
  if (snapshot.was_undone) {
    throw new Error('This action has already been undone.');
  }
  
  if (snapshot.pic_ic !== picIc) {
    throw new Error('You can only undo your own actions.');
  }
  
  // Import here to avoid circular dependency
  const { createPendingPicChange } = await import('./pendingPicChanges.js');
  
  // Determine undo operation and payload based on original operation
  let undoOperation;
  let undoPayload;
  let undoActionKey;
  
  if (snapshot.operation === 'create') {
    // Undo create = delete
    undoOperation = 'delete';
    undoActionKey = `${snapshot.entity_type}:delete`;
    undoPayload = { id: snapshot.entity_id };
  } else if (snapshot.operation === 'delete') {
    // Undo delete = create (restore)
    undoOperation = 'create';
    undoActionKey = `${snapshot.entity_type}:create`;
    undoPayload = snapshot.data; // Restore the original data
  } else if (snapshot.operation === 'update') {
    // Undo update = update back to previous state
    undoOperation = 'update';
    undoActionKey = `${snapshot.entity_type}:update`;
    undoPayload = snapshot.data; // Restore the previous data
  } else {
    throw new Error(`Unknown operation type: ${snapshot.operation}`);
  }
  
  // Create pending PIC change for undo
  const undoPendingId = await createPendingPicChange({
    actionKey: undoActionKey,
    entityType: snapshot.entity_type,
    entityId: snapshot.entity_id ? snapshot.entity_id.toString() : null,
    payload: undoPayload,
    metadata: {
      summary: `Batal ${snapshot.metadata?.summary || snapshot.operation} - Undo action`,
      is_undo: true,
      original_snapshot_id: snapshotId,
      original_operation: snapshot.operation,
      undo_operation: undoOperation
    },
    actorIc: picIc,
    requestMethod: undoOperation === 'delete' ? 'DELETE' : 'POST',
    requestPath: undoOperation === 'delete' 
      ? `/${snapshot.entity_type}/${snapshot.entity_id}`
      : `/${snapshot.entity_type}`
  });
  
  // Mark snapshot as having undo request
  await pool.execute(
    `UPDATE pic_action_snapshots 
     SET undo_pending_id = ? 
     WHERE id = ?`,
    [undoPendingId, snapshotId]
  );
  
  return {
    undoPendingId,
    snapshot,
    undoOperation,
    undoPayload
  };
}

