import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import tenantAPI from '../services/tenantApiV2';

// Import components
import CategoryManagerV2 from './CategoryManagerV2';
import MenuItemManagerV2 from './MenuItemManagerV2';
import SettingsManager from './SettingsManagerV2';

const DashboardV2 = () => {
  const { user, tenantLogout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await tenantAPI.get('/dashboard/stats');
      setStats(response.data);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    tenantLogout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchDashboardStats}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-primary">
                {stats?.tenant?.name || 'MenuIQ Dashboard'}
              </h1>
              <p className="text-sm text-gray-600">
                {stats?.tenant?.subdomain}.menuiq.io
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.email}
              </span>
              <button 
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'categories', label: 'Categories' },
              { id: 'menu-items', label: 'Menu Items' },
              { id: 'settings', label: 'Settings' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Total Categories</h3>
                <p className="mt-2 text-3xl font-semibold text-primary">
                  {stats?.stats?.total_categories || 0}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  of {stats?.limits?.max_categories || 0} allowed
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Total Items</h3>
                <p className="mt-2 text-3xl font-semibold text-primary">
                  {stats?.stats?.total_items || 0}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  of {stats?.limits?.max_items || 0} allowed
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Active Items</h3>
                <p className="mt-2 text-3xl font-semibold text-green-600">
                  {stats?.stats?.active_items || 0}
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Plan</h3>
                <p className="mt-2 text-3xl font-semibold text-primary capitalize">
                  {stats?.tenant?.plan || 'Free'}
                </p>
              </div>
            </div>

            {/* Recent Items */}
            {stats?.recent_items?.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Items</h2>
                <div className="space-y-3">
                  {stats.recent_items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{item.price}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('categories')}
                  className="p-4 text-center border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all"
                >
                  <div className="text-3xl mb-2">📁</div>
                  <p className="font-medium">Manage Categories</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('menu-items')}
                  className="p-4 text-center border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all"
                >
                  <div className="text-3xl mb-2">🍽️</div>
                  <p className="font-medium">Manage Menu Items</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('settings')}
                  className="p-4 text-center border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all"
                >
                  <div className="text-3xl mb-2">⚙️</div>
                  <p className="font-medium">Settings</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <CategoryManagerV2 onUpdate={fetchDashboardStats} />
        )}

        {activeTab === 'menu-items' && (
          <MenuItemManagerV2 onUpdate={fetchDashboardStats} />
        )}

        {activeTab === 'settings' && (
          <SettingsManager />
        )}
      </div>
    </div>
  );
};

export default DashboardV2;