import { validationResult, param } from 'express-validator';
import {
  listPicSnapshots,
  getPicSnapshotById,
  createUndoRequest,
  markPicSnapshotUndone
} from '../utils/picActionSnapshots.js';
import { cancelPendingPicChange } from '../utils/pendingPicChanges.js';

export const listValidators = [];

export const getValidators = [
  param('id')
    .isInt()
    .withMessage('Snapshot ID must be a valid integer')
];

export const listPicRecycleBin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Only show snapshots for the current PIC user
    // Note: requireRole(['pic']) middleware already verified user has 'pic' role
    const picIc = req.user?.ic;
    if (!picIc) {
      return res.status(403).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const snapshots = await listPicSnapshots({ picIc });
    
    // Also fetch pending requests for this PIC
    const { listPendingPicChanges } = await import('../utils/pendingPicChanges.js');
    const allPendingRequests = await listPendingPicChanges({ status: 'pending' });
    const myPendingRequests = allPendingRequests.filter(req => req.created_by === picIc);

    res.json({
      success: true,
      data: snapshots,
      pendingRequests: myPendingRequests
    });
  } catch (error) {
    console.error('Failed to list PIC recycle bin:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getPicRecycleBinItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const picIc = req.user?.ic;

    // Note: requireRole(['pic']) middleware already verified user has 'pic' role
    if (!picIc) {
      return res.status(403).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const snapshot = await getPicSnapshotById(Number(id));

    if (!snapshot) {
      return res.status(404).json({
        success: false,
        message: 'Snapshot not found'
      });
    }

    // Verify it belongs to this PIC
    if (snapshot.pic_ic !== picIc) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own recycle bin items'
      });
    }

    res.json({
      success: true,
      data: snapshot
    });
  } catch (error) {
    console.error('Failed to fetch PIC recycle bin item:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const cancelPendingPicRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const picIc = req.user?.ic;

    // Note: requireRole(['pic']) middleware already verified user has 'pic' role
    if (!picIc) {
      return res.status(403).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const result = await cancelPendingPicChange({
      id: Number(id),
      picIc
    });

    res.json({
      success: true,
      message: result.message || 'Pending request cancelled successfully'
    });
  } catch (error) {
    console.error('Failed to cancel pending PIC request:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

export const undoPicAction = async (req, res) => {
  try {
    const { id } = req.params;
    const picIc = req.user?.ic;

    // Note: requireRole(['pic']) middleware already verified user has 'pic' role
    if (!picIc) {
      return res.status(403).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const result = await createUndoRequest({
      snapshotId: Number(id),
      picIc
    });

    res.json({
      success: true,
      message: 'Undo request created successfully. Waiting for admin approval.',
      data: {
        undoPendingId: result.undoPendingId,
        snapshot: result.snapshot
      }
    });
  } catch (error) {
    console.error('Failed to create undo request:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

