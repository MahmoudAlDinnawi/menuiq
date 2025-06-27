import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RestaurantMenu from './pages/RestaurantMenu';
import Dashboard from './pages/Dashboard';
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
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute requireSystemAdmin>
                <SystemAdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Tenant Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Unauthorized */}
          <Route 
            path="/unauthorized" 
            element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
                  <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
                  <a href="/" className="text-blue-600 hover:text-blue-700">
                    Go back home
                  </a>
                </div>
              </div>
            } 
          />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

// Add error boundary for debugging
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-600">Please check the console for errors.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap App with ErrorBoundary
const AppWithErrorBoundary = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default AppWithErrorBoundary;