/**
 * MenuIQ Frontend Application
 * 
 * This is the main App component that handles:
 * - Routing based on subdomain (tenant vs admin vs main site)
 * - Authentication context provider
 * - Protected route management
 * 
 * Domain routing logic:
 * - app.menuiq.io -> System admin dashboard
 * - tenant.menuiq.io -> Tenant's public menu
 * - menuiq.io -> Main website (redirects to login)
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { lazyLoad } from './utils/lazyLoad';
import performanceMonitor from './utils/performanceMonitor';
import { applyHonorFixes, getHonorDeviceStyles } from './utils/honorDeviceFix';

// Lazy load pages for better performance
const RestaurantMenu = lazyLoad(() => import('./pages/RestaurantMenu'));
const ModernDashboard = lazyLoad(() => import('./components/ModernDashboard'));
const SystemAdminLogin = lazyLoad(() => import('./pages/SystemAdminLogin'));
const TenantLogin = lazyLoad(() => import('./pages/TenantLogin'));
const SystemAdminDashboard = lazyLoad(() => import('./pages/SystemAdminDashboard'));

function App() {
  // Monitor performance in development
  useEffect(() => {
    // Apply Honor device fixes
    applyHonorFixes();
    
    // Add Honor-specific styles if needed
    const honorStyles = getHonorDeviceStyles();
    if (honorStyles) {
      const styleElement = document.createElement('style');
      styleElement.textContent = honorStyles;
      document.head.appendChild(styleElement);
    }
    
    if (process.env.NODE_ENV === 'development') {
      // Log metrics after page load
      window.addEventListener('load', () => {
        setTimeout(() => {
          performanceMonitor.logMetrics();
          performanceMonitor.checkPerformanceBudget();
        }, 2000);
      });
    }
  }, []);

  // Determine routing based on the current hostname
  const hostname = window.location.hostname;
  const isMainDomain = hostname === 'menuiq.io' || hostname === 'www.menuiq.io';
  const isSystemAdmin = hostname === 'app.menuiq.io';
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

  // Debug logging for development
  console.log('App loaded - Hostname:', hostname);
  console.log('Is System Admin:', isSystemAdmin);
  console.log('Is Main Domain:', isMainDomain);

  // If error, at least show something
  if (!window.location) {
    return <div>Loading...</div>;
  }

  return (
    <HelmetProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
    </HelmetProvider>
  );
}

export default App;