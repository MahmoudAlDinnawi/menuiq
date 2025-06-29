import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setIsSystemAdmin(userData.type === 'system_admin');
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const systemAdminLogin = async (email, password) => {
    try {
      const response = await api.post('/api/admin/login', { email, password });
      const { access_token, admin } = response.data;
      const user = admin; // Map admin to user for consistency
      
      // Store both for compatibility
      localStorage.setItem('token', access_token);
      localStorage.setItem('systemToken', access_token);
      localStorage.setItem('user', JSON.stringify({ ...user, type: 'system_admin' }));
      
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser({ ...user, type: 'system_admin' });
      setIsSystemAdmin(true);
      
      navigate('/admin/dashboard');
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const tenantLogin = async (email, password, subdomain) => {
    try {
      const response = await api.post('/api/auth/tenant/login', { 
        email, 
        password,
        tenant_subdomain: subdomain
      });
      
      const { access_token, user } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify({ ...user, type: 'tenant_user' }));
      
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser({ ...user, type: 'tenant_user' });
      setIsSystemAdmin(false);
      
      // Check if we're already on the correct subdomain
      const currentHost = window.location.hostname;
      const currentSubdomain = currentHost.split('.')[0];
      
      console.log('Login successful, current host:', currentHost, 'subdomain:', subdomain);
      
      if (currentSubdomain === subdomain || currentHost === 'localhost') {
        // Already on correct subdomain or localhost, just navigate
        navigate('/dashboard');
      } else if (currentHost === 'menuiq.io' || currentHost === 'www.menuiq.io') {
        // On main domain, redirect to subdomain
        window.location.href = `https://${subdomain}.menuiq.io/dashboard`;
      } else {
        // Default navigation
        navigate('/dashboard');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Tenant login error:', error);
      console.error('Error response:', error.response);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('systemToken');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setIsSystemAdmin(false);
    
    // Redirect based on user type
    if (window.location.hostname === 'app.menuiq.io' || window.location.hostname === 'localhost') {
      navigate('/admin/login');
    } else {
      navigate('/login');
    }
  };

  const value = {
    user,
    loading,
    isSystemAdmin,
    systemAdminLogin,
    tenantLogin,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};