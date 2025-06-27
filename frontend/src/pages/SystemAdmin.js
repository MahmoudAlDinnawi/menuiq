import React, { useState, useEffect } from 'react';
import SystemAdminSidebar from '../components/SystemAdminSidebar';
import TenantManager from '../components/TenantManager';
import SystemStats from '../components/SystemStats';
import PlanManager from '../components/PlanManager';
import { systemAPI } from '../services/systemApi';

const SystemAdmin = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    totalUsers: 0,
    totalMenuItems: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await systemAPI.getSystemStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SystemAdminSidebar 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      
      <main className="flex-1 p-8">
        {activeSection === 'overview' && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">System Overview</h1>
              <p className="text-gray-600 mt-2">Monitor and manage your MenuIQ platform</p>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-500">Total</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalTenants}</div>
                <div className="text-sm text-gray-600">Restaurants</div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-500">Active</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.activeTenants}</div>
                <div className="text-sm text-gray-600">Active Tenants</div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-500">Users</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
                <div className="text-sm text-gray-600">Total Users</div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-500">Items</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalMenuItems}</div>
                <div className="text-sm text-gray-600">Menu Items</div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-500">MRR</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">${stats.revenue}</div>
                <div className="text-sm text-gray-600">Monthly Revenue</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4 py-3 border-b border-gray-100">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">New restaurant registered</p>
                    <p className="text-xs text-gray-500">Bella Italia joined MenuIQ</p>
                  </div>
                  <span className="text-xs text-gray-400">2 hours ago</span>
                </div>
                
                <div className="flex items-center gap-4 py-3 border-b border-gray-100">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Plan upgraded</p>
                    <p className="text-xs text-gray-500">Sushi Master upgraded to Premium</p>
                  </div>
                  <span className="text-xs text-gray-400">5 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeSection === 'tenants' && (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Tenant Management</h1>
            <TenantManager />
          </div>
        )}
        
        {activeSection === 'plans' && (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Subscription Plans</h1>
            <PlanManager />
          </div>
        )}
      </main>
    </div>
  );
};

export default SystemAdmin;