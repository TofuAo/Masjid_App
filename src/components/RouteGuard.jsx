import React from 'react';
import { useLocation } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { getAllowedRoles } from '../config/routeAccess';

/**
 * Path-aware guard: wraps route content based on current path.
 * If path has role restrictions, wraps in ProtectedRoute; otherwise renders children.
 * Place around Routes so each navigation is checked.
 */
export default function RouteGuard({ user, children }) {
  const { pathname } = useLocation();
  const allowedRoles = getAllowedRoles(pathname);

  if (!allowedRoles.length) return children;

  return (
    <ProtectedRoute user={user} allowedRoles={allowedRoles}>
      {children}
    </ProtectedRoute>
  );
}
