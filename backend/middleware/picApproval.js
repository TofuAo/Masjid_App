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
    if (req.user?.role !== 'pic') {
      return next();
    }

    try {
      let prepared = {};
      if (prepare) {
        prepared = await prepare(req);
      }

      const payload = prepared.payload ?? req.body ?? {};
      const entityId = prepared.entityId ?? req.params?.id ?? req.params?.ic ?? null;
      const metadata = prepared.metadata ?? null;

      const pendingId = await createPendingPicChange({
        actionKey,
        entityType,
        entityId,
        payload,
        metadata,
        actorIc: req.user.ic,
        requestMethod: req.method,
        requestPath: req.originalUrl || req.path
      });

      res.status(202).json({
        success: true,
        pendingApproval: true,
        message,
        data: {
          pendingId
        }
      });
    } catch (error) {
      console.error('Failed to queue PIC approval request:', error);
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

