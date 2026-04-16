import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getEffectiveRole } from '../utils/userRoles';

/**
 * ProtectedRoute – role-based access control for routes.
 * - If not logged in → redirect to /login
 * - If user's role not in allowedRoles → redirect to /unauthorized
 * - Uses getEffectiveRole(user) for active role (case-insensitive)
 */
export default function ProtectedRoute({ user, allowedRoles = [], children }) {
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const effectiveRole = (getEffectiveRole(user) || '').toLowerCase();
  const normalizedAllowed = (allowedRoles || []).map((r) => (r || '').toLowerCase());

  if (normalizedAllowed.length > 0 && !normalizedAllowed.includes(effectiveRole)) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  return children;
}
