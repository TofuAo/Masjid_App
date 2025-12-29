import { pool } from '../config/database.js';
import { createPicSnapshot, markPicSnapshotUndone } from './picActionSnapshots.js';

const handlers = new Map();
let tableReady = false;

const ensureTable = async () => {
  if (tableReady) {
    return;
  }

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
    )
  `);
  tableReady = true;
};

const parseJsonField = (value) => {
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
      console.warn('Failed to parse JSON payload for pending PIC change:', error.message);
      return null;
    }
  }
  return value;
};

export const registerPendingPicHandler = (actionKey, handler) => {
  if (!actionKey || typeof handler !== 'function') {
    throw new Error('registerPendingPicHandler requires an actionKey and handler function.');
  }
  handlers.set(actionKey, handler);
};

export const createPendingPicChange = async ({
  actionKey,
  entityType,
  entityId = null,
  payload,
  metadata = null,
  actorIc,
  requestMethod,
  requestPath
}) => {
  if (!actionKey || !entityType || !payload || !actorIc || !requestMethod || !requestPath) {
    throw new Error('Missing required fields when creating pending PIC change.');
  }

  await ensureTable();
  const payloadJson = JSON.stringify(payload);
  const metadataJson = metadata ? JSON.stringify(metadata) : null;

  console.log(`[PENDING PIC] Creating pending change:`, {
    actionKey,
    entityType,
    entityId,
    actorIc,
    requestMethod,
    requestPath
  });

  const [result] = await pool.execute(
    `INSERT INTO pending_pic_changes
      (action_key, entity_type, entity_id, request_method, request_path, payload, metadata, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [actionKey, entityType, entityId, requestMethod, requestPath, payloadJson, metadataJson, actorIc]
  );

  console.log(`[PENDING PIC] ✅ Created pending change with ID: ${result.insertId}`);
  return result.insertId;
};

export const listPendingPicChanges = async ({ status = 'pending' } = {}) => {
  await ensureTable();

  const whereClauses = [];
  const params = [];

  if (status) {
    whereClauses.push('ppc.status = ?');
    params.push(status);
  }

  const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const [rows] = await pool.execute(
    `
    SELECT 
      ppc.*,
      requester.nama AS requester_name,
      approver.nama AS approver_name
    FROM pending_pic_changes ppc
    LEFT JOIN users requester ON requester.ic = ppc.created_by
    LEFT JOIN users approver ON approver.ic = ppc.approved_by
    ${where}
    ORDER BY ppc.created_at DESC
    `,
    params
  );

  return rows.map((row) => ({
    ...row,
    payload: parseJsonField(row.payload),
    metadata: parseJsonField(row.metadata)
  }));
};

export const getPendingPicChangeById = async (id) => {
  await ensureTable();

  const [rows] = await pool.execute(
    `
    SELECT 
      ppc.*,
      requester.nama AS requester_name,
      approver.nama AS approver_name
    FROM pending_pic_changes ppc
    LEFT JOIN users requester ON requester.ic = ppc.created_by
    LEFT JOIN users approver ON approver.ic = ppc.approved_by
    WHERE ppc.id = ?
    LIMIT 1
    `,
    [id]
  );

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];
  return {
    ...row,
    payload: parseJsonField(row.payload),
    metadata: parseJsonField(row.metadata)
  };
};

const updatePendingPicChangeStatus = async ({ connection, id, status, adminIc, notes = null }) => {
  const executor = connection ?? pool;
  await executor.execute(
    `
    UPDATE pending_pic_changes
    SET status = ?, approved_by = ?, approved_at = NOW(), notes = ?
    WHERE id = ?
    `,
    [status, adminIc, notes, id]
  );
};

export const approvePendingPicChange = async ({ id, adminIc, notes = null }) => {
  if (!id || !adminIc) {
    throw new Error('approvePendingPicChange requires id and adminIc.');
  }

  await ensureTable();

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      'SELECT * FROM pending_pic_changes WHERE id = ? FOR UPDATE',
      [id]
    );

    if (rows.length === 0) {
      throw new Error('Pending change not found.');
    }

    const change = rows[0];
    if (change.status !== 'pending') {
      throw new Error('Pending change already resolved.');
    }

    const handler = handlers.get(change.action_key);
    if (!handler) {
      throw new Error(`No handler registered for action ${change.action_key}`);
    }

    const payload = parseJsonField(change.payload) ?? {};
    const metadata = parseJsonField(change.metadata) ?? {};

    change.payload = payload;
    change.metadata = metadata;

    const handlerResult = await handler({
      payload,
      metadata,
      entityId: change.entity_id,
      actorIc: change.created_by,
      adminIc,
      pendingId: id,
      connection
    });

    // Update existing PIC snapshot (created when PIC made the request) with approval info
    try {
      const { pool: snapshotPool } = await import('../config/database.js');
      
      // Update the snapshot that was created when PIC made the request
      // Find it by pending_pic_change_id
      const [updateResult] = await snapshotPool.execute(
        `UPDATE pic_action_snapshots 
         SET approved_by = ?, 
             data = COALESCE(?, data),
             metadata = COALESCE(?, metadata)
         WHERE pending_pic_change_id = ? AND approved_by IS NULL`,
        [
          adminIc,
          handlerResult?.snapshotData ? JSON.stringify(handlerResult.snapshotData) : null,
          metadata ? JSON.stringify(metadata) : null,
          id
        ]
      );
      
      if (updateResult.affectedRows > 0) {
        console.log('[PIC APPROVAL] ✅ Updated existing PIC Recycle Bin snapshot with approval info');
      } else {
        console.log('[PIC APPROVAL] No existing snapshot found to update (may have been created differently)');
        
        // Fallback: Create snapshot if it doesn't exist (shouldn't happen normally)
        const snapshotData = handlerResult?.snapshotData || handlerResult?.data || handlerResult || payload;
        let snapshotEntityId = handlerResult?.entityId;
        if (snapshotEntityId === undefined || snapshotEntityId === null) {
          snapshotEntityId = handlerResult?.id ? Number(handlerResult.id) : 0;
        } else {
          snapshotEntityId = Number(snapshotEntityId);
        }
        const snapshotEntityIdentifier = handlerResult?.entityIdentifier || 
          (change.entity_id ? String(change.entity_id) : null);
        const operationParts = change.action_key.split(':');
        const operation = operationParts.length > 1 ? operationParts[1] : 'update';
        
        await createPicSnapshot({
          entityType: change.entity_type,
          entityId: snapshotEntityId,
          entityIdentifier: snapshotEntityIdentifier,
          operation: operation,
          data: snapshotData,
          metadata: metadata,
          picIc: change.created_by,
          approvedBy: adminIc,
          pendingPicChangeId: id
        });
        console.log('[PIC APPROVAL] ✅ Created PIC snapshot for recycle bin (fallback)');
      }
    } catch (snapshotError) {
      console.error('[PIC APPROVAL] ❌ Failed to update/create PIC snapshot:', snapshotError);
      // Don't fail the approval if snapshot update fails, but log it
    }

    await updatePendingPicChangeStatus({
      connection,
      id,
      status: 'approved',
      adminIc,
      notes
    });

    // If this is an undo request, mark the original snapshot as undone
    if (metadata?.is_undo && metadata?.original_snapshot_id) {
      try {
        await markPicSnapshotUndone(metadata.original_snapshot_id, id);
        console.log('[PIC APPROVAL] Marked original snapshot as undone:', metadata.original_snapshot_id);
      } catch (undoError) {
        console.error('[PIC APPROVAL] Failed to mark snapshot as undone:', undoError);
        // Don't fail the approval if marking undone fails
      }
    }

    await connection.commit();

    return {
      ...change,
      status: 'approved',
      approved_by: adminIc,
      notes,
      approved_at: new Date(),
      result: handlerResult
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const rejectPendingPicChange = async ({ id, adminIc, notes = null }) => {
  if (!id || !adminIc) {
    throw new Error('rejectPendingPicChange requires id and adminIc.');
  }

  await ensureTable();

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      'SELECT * FROM pending_pic_changes WHERE id = ? FOR UPDATE',
      [id]
    );

    if (rows.length === 0) {
      throw new Error('Pending change not found.');
    }

    const change = rows[0];
    if (change.status !== 'pending') {
      throw new Error('Pending change already resolved.');
    }

    await updatePendingPicChangeStatus({
      connection,
      id,
      status: 'rejected',
      adminIc,
      notes
    });

    await connection.commit();

    const payload = parseJsonField(change.payload) ?? {};
    const metadata = parseJsonField(change.metadata) ?? {};

    return {
      ...change,
      status: 'rejected',
      approved_by: adminIc,
      notes,
      approved_at: new Date(),
      payload,
      metadata
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const ensurePendingPicTable = async () => {
  await ensureTable();
};

/**
 * Cancel a pending PIC change (before admin approval)
 * Only the PIC who created it can cancel it
 */
export const cancelPendingPicChange = async ({ id, picIc }) => {
  if (!id || !picIc) {
    throw new Error('cancelPendingPicChange requires id and picIc.');
  }

  await ensureTable();

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      'SELECT * FROM pending_pic_changes WHERE id = ? FOR UPDATE',
      [id]
    );

    if (rows.length === 0) {
      throw new Error('Pending change not found.');
    }

    const change = rows[0];
    
    // Only allow PIC who created it to cancel
    if (change.created_by !== picIc) {
      throw new Error('You can only cancel your own pending requests.');
    }

    if (change.status !== 'pending') {
      throw new Error('Can only cancel pending requests.');
    }

    // Delete the pending change
    await connection.execute(
      'DELETE FROM pending_pic_changes WHERE id = ?',
      [id]
    );

    await connection.commit();

    return { success: true, message: 'Pending request cancelled successfully.' };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

