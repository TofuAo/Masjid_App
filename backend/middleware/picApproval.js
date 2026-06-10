import { createPendingPicChange } from '../utils/pendingPicChanges.js';

const defaultMessage = 'Permintaan anda telah dihantar untuk kelulusan admin.';

export const requirePicApproval = ({
  actionKey,
  entityType,
  message = defaultMessage,
  prepare
}) => {
  if (!actionKey || !entityType) {
    throw new Error('requirePicApproval middleware requires actionKey and entityType.');
  }

  return async (req, res, next) => {
    // Check if user is PIC - check activeRole first, then role, then availableRoles
    const userActiveRole = (req.user?.activeRole || req.user?.role || '').toLowerCase();
    const userRoles = req.user?.roles || [];
    const isPicUser = userActiveRole === 'pic' || userRoles.includes('pic');
    
    console.log(`[PIC APPROVAL] Middleware called for ${actionKey}`, {
      userActiveRole,
      userRole: req.user?.role,
      availableRoles: userRoles,
      isPicUser
    });
    
    if (!isPicUser) {
      console.log(`[PIC APPROVAL] User is not PIC (activeRole: ${userActiveRole}, role: ${req.user?.role}), skipping middleware`);
      return next();
    }

    console.log(`[PIC APPROVAL] ✅ PIC user detected (IC: ${req.user.telefon}), creating pending request...`);

    try {
      let prepared = {};
      if (prepare) {
        console.log(`[PIC APPROVAL] Running prepare function...`);
        prepared = await prepare(req);
        console.log(`[PIC APPROVAL] Prepare function completed:`, { 
          hasEntityId: !!prepared.entityId,
          hasMetadata: !!prepared.metadata,
          hasPayload: !!prepared.payload
        });
      }

      const payload = prepared.payload ?? req.body ?? {};
      const entityId = prepared.entityId ?? req.params?.id ?? req.params?.ic ?? null;
      const metadata = prepared.metadata ?? null;

      console.log(`[PIC APPROVAL] Creating pending change:`, {
        actionKey,
        entityType,
        entityId,
        actorIc: req.user.telefon,
        requestMethod: req.method,
        requestPath: req.originalUrl || req.path
      });

      const pendingId = await createPendingPicChange({
        actionKey,
        entityType,
        entityId,
        payload,
        metadata,
        actorIc: req.user.telefon,
        requestMethod: req.method,
        requestPath: req.originalUrl || req.path
      });

      console.log(`[PIC APPROVAL] ✅ Pending request created with ID: ${pendingId}`);

      // Also create snapshot in PIC Recycle Bin immediately (before approval)
      try {
        const { createPicSnapshot } = await import('../utils/picActionSnapshots.js');
        
        // Determine operation from action_key
        const operationParts = actionKey.split(':');
        const operation = operationParts.length > 1 ? operationParts[1] : 'update';
        
        // Get snapshot data from metadata.current (prepared by route's prepare function)
        // or from payload (for create/update operations)
        const snapshotData = metadata?.current || payload || {};
        
        // Determine entityId for snapshot (use 0 for string IDs like student IC)
        let snapshotEntityId = 0;
        if (entityId && typeof entityId === 'number') {
          snapshotEntityId = entityId;
        } else if (payload?.id) {
          snapshotEntityId = Number(payload.id) || 0;
        }
        
        // Use entityId (e.g., student IC) as entityIdentifier
        const snapshotEntityIdentifier = entityId ? String(entityId) : null;
        
        console.log(`[PIC APPROVAL] Creating PIC Recycle Bin snapshot:`, {
          entityType,
          entityId: snapshotEntityId,
          entityIdentifier: snapshotEntityIdentifier,
          operation,
          hasSnapshotData: !!snapshotData && Object.keys(snapshotData).length > 0,
          snapshotDataKeys: snapshotData ? Object.keys(snapshotData).slice(0, 5) : []
        });
        
        await createPicSnapshot({
          entityType,
          entityId: snapshotEntityId,
          entityIdentifier: snapshotEntityIdentifier,
          operation,
          data: snapshotData,
          metadata,
          picIc: req.user.telefon,
          approvedBy: null, // Will be set when admin approves
          pendingPicChangeId: pendingId
        });
        
        console.log(`[PIC APPROVAL] ✅ PIC Recycle Bin snapshot created (pending approval)`);
      } catch (snapshotError) {
        console.error('[PIC APPROVAL] Failed to create PIC Recycle Bin snapshot:', snapshotError);
        console.error('[PIC APPROVAL] Snapshot error details:', {
          message: snapshotError.message,
          stack: snapshotError.stack
        });
        // Don't fail the request if snapshot creation fails
      }

      res.status(202).json({
        success: true,
        pendingApproval: true,
        message,
        data: {
          pendingId
        }
      });
    } catch (error) {
      console.error('[PIC APPROVAL] ❌ Failed to queue PIC approval request:', error);
      console.error('[PIC APPROVAL] Error details:', {
        message: error.message,
        stack: error.stack
      });
      const status =
        Number.isInteger(error.status) && error.status >= 400 && error.status < 600
          ? error.status
          : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to submit for admin approval.'
      });
    }
  };
};

