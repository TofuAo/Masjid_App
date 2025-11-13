import { validationResult, body, param, query } from 'express-validator';
import {
  listPendingPicChanges,
  getPendingPicChangeById,
  approvePendingPicChange,
  rejectPendingPicChange
} from '../utils/pendingPicChanges.js';

export const listValidators = [
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected'])
    .withMessage('Status must be one of: pending, approved, rejected')
];

export const decisionValidators = [
  param('id')
    .isInt()
    .withMessage('Pending change ID must be a valid integer'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters')
];

export const getValidators = [
  param('id')
    .isInt()
    .withMessage('Pending change ID must be a valid integer')
];

export const listPendingChanges = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status = 'pending' } = req.query;
    const changes = await listPendingPicChanges({ status });

    res.json({
      success: true,
      data: changes
    });
  } catch (error) {
    console.error('Failed to list pending PIC changes:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getPendingChange = async (req, res) => {
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
    const change = await getPendingPicChangeById(Number(id));

    if (!change) {
      return res.status(404).json({
        success: false,
        message: 'Pending change not found'
      });
    }

    res.json({
      success: true,
      data: change
    });
  } catch (error) {
    console.error('Failed to fetch pending PIC change:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const approvePendingChange = async (req, res) => {
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
    const { notes = null } = req.body;

    const result = await approvePendingPicChange({
      id: Number(id),
      adminIc: req.user.ic,
      notes
    });

    res.json({
      success: true,
      message: 'Pending change approved successfully.',
      data: {
        ...result,
        payload: result.payload ?? undefined,
        metadata: result.metadata ?? undefined
      }
    });
  } catch (error) {
    console.error('Failed to approve pending PIC change:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

export const rejectPendingChange = async (req, res) => {
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
    const { notes = null } = req.body;

    const result = await rejectPendingPicChange({
      id: Number(id),
      adminIc: req.user.ic,
      notes
    });

    res.json({
      success: true,
      message: 'Pending change rejected.',
      data: result
    });
  } catch (error) {
    console.error('Failed to reject pending PIC change:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

