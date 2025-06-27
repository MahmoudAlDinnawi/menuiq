import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, requireSystemAdmin = false }) => {
  const { user, loading, isSystemAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gray-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Not authenticated
    if (requireSystemAdmin) {
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (requireSystemAdmin && !isSystemAdmin) {
    // User is authenticated but not a system admin
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;