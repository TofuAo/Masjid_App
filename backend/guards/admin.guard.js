/**
 * Admin / class-management guard — requires permission for class management.
 * Use as middleware: requireClassManagement('class.view' | 'class.change' | 'class.rollback')
 */
import { requirePermission } from '../middleware/auth.js';

export const requireClassView = requirePermission('class.view');
export const requireClassChange = requirePermission('class.change');
export const requireClassRollback = requirePermission('class.rollback');

/** Single guard that allows any of class.view, class.change, class.rollback (e.g. for list/students). */
export const requireClassManagement = requirePermission('class.view');
