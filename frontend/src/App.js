import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RestaurantMenu from './pages/RestaurantMenu';
import ModernDashboard from './components/ModernDashboard';
import SystemAdminLogin from './pages/SystemAdminLogin';
import TenantLogin from './pages/TenantLogin';
import SystemAdminDashboard from './pages/SystemAdminDashboard';

function App() {
  // Determine if we're on the main app domain or a subdomain
  const hostname = window.location.hostname;
  const isMainDomain = hostname === 'menuiq.io' || hostname === 'www.menuiq.io';
  const isSystemAdmin = hostname === 'app.menuiq.io';
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

  // Debug logging
  console.log('App loaded - Hostname:', hostname);
  console.log('Is System Admin:', isSystemAdmin);
  console.log('Is Main Domain:', isMainDomain);

  // If error, at least show something
  if (!window.location) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Root path routing based on domain */}
          <Route path="/" element={
            isMainDomain ? <Navigate to="/login" replace /> :
            isSystemAdmin ? <Navigate to="/admin/login" replace /> :
            isLocalhost ? <Navigate to="/login" replace /> :
            <Navigate to="/menu" replace />
          } />
          
          {/* Public menu view (for tenant subdomains) */}
          <Route path="/menu" element={<RestaurantMenu />} />
          
          {/* Auth routes */}
          <Route path="/login" element={
            isSystemAdmin ? <Navigate to="/admin/login" /> : 
            <TenantLogin />
          } />
          
          {/* System Admin Routes */}
          <Route path="/admin/login" element={<SystemAdminLogin />} />
          <Route path="/admin/*" element={
            <ProtectedRoute requiredRole="system_admin">
              <SystemAdminDashboard />
            </ProtectedRoute>
          } />
          
          {/* Tenant Dashboard Routes - Using Modern Dashboard */}
          <Route path="/dashboard/*" element={
            <ProtectedRoute requiredRole="tenant">
              <ModernDashboard />
            </ProtectedRoute>
          } />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;