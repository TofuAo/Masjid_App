import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAuthToken } from '../../services/api';

const ProtectedRoute = ({ children }) => {
  const token = getAuthToken();
  const location = useLocation();

  if (!token && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
