import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { requireRole } from '../../middleware/auth.js';

describe('requireRole', () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: null };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('returns 401 when user is not authenticated', () => {
    const middleware = requireRole(['admin']);
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when user has required role', () => {
    req.user = { activeRole: 'admin', roles: ['admin'] };
    const middleware = requireRole(['admin']);
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 403 when user lacks required role', () => {
    req.user = { activeRole: 'student', roles: ['student'] };
    const middleware = requireRole(['admin']);
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows access when user has role in availableRoles', () => {
    req.user = { activeRole: 'pic', roles: ['pic', 'admin'] };
    const middleware = requireRole(['admin']);
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
