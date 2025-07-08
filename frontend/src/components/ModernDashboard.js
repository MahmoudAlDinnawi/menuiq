import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import tenantAPI from '../services/tenantApiV2';
import MenuCardEditor from './MenuCardEditor';
import MenuCardPreview from './MenuCardPreview';
import CategoryManager from './EnhancedCategoryManager';
import SettingsPanel from './SettingsPanel';
import Analytics from './Analytics';
import FlowIQManager from './FlowIQManager';
import '../styles/ModernDashboard.css';

/**
 * ModernDashboard Component
 * 
 * Main dashboard interface for restaurant managers to manage their menu system.
 * Provides a comprehensive interface for menu item management, categories,
 * settings, analytics, and FlowIQ interactions.
 * 
 * Features:
 * - Overview with key statistics
 * - Menu item management (create, edit, delete)
 * - Multi-item support with visual indicators
 * - Category management
 * - Search and filtering
 * - Multiple view modes (grid, list, preview)
 * - Keyboard shortcuts for power users
 * - Analytics dashboard
 * - Settings configuration
 * - FlowIQ interaction builder
 */
const ModernDashboard = () => {
  const { user, tenantLogout } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('overview');
  const [stats, setStats] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid, list, preview
  const [showItemTypeSelector, setShowItemTypeSelector] = useState(false);
  const [isCreatingMultiItem, setIsCreatingMultiItem] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl/Cmd + K for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (activeView === 'menu' && searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
      // Ctrl/Cmd + N for new item
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (activeView === 'menu') {
          handleCreateItem();
        }
      }
      // Escape to close modals
      if (e.key === 'Escape') {
        if (showItemTypeSelector) {
          setShowItemTypeSelector(false);
        }
        if (showEditor) {
          setShowEditor(false);
          setSelectedItem(null);
          setIsCreatingMultiItem(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [activeView, showItemTypeSelector, showEditor]);

  /**
   * Fetch all dashboard data on component mount
   * Includes stats, menu items, categories, and settings
   */
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, itemsRes, categoriesRes, settingsRes] = await Promise.all([
        tenantAPI.get('/dashboard/stats'),
        tenantAPI.get('/menu-items'),
        tenantAPI.get('/categories'),
        tenantAPI.get('/settings').catch(() => ({ data: null }))
      ]);
      setStats(statsRes.data);
      setMenuItems(itemsRes.data);
      setCategories(categoriesRes.data);
      setSettings(settingsRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle new item creation - shows item type selector
   */
  const handleCreateItem = () => {
    setShowItemTypeSelector(true);
  };

  /**
   * Handle item type selection (single or multi-item)
   * @param {boolean} isMultiItem - True if creating a multi-item
   */
  const handleItemTypeSelected = (isMultiItem) => {
    setIsCreatingMultiItem(isMultiItem);
    // Always set selectedItem to null for new items
    setSelectedItem(null);
    setShowItemTypeSelector(false);
    setShowEditor(true);
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setShowEditor(true);
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await tenantAPI.delete(`/menu-items/${itemId}`);
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const handleSaveItem = async (itemData) => {
    try {
      // Item saving handled silently
      
      if (selectedItem && selectedItem.id) {
        await tenantAPI.put(`/menu-items/${selectedItem.id}`, itemData);
      } else {
        await tenantAPI.post('/menu-items', itemData);
      }
      setShowEditor(false);
      fetchDashboardData();
      setIsCreatingMultiItem(false);
    } catch (error) {
      console.error('Failed to save item:', error);
      alert(`Failed to save item: ${error.response?.data?.detail || error.message}`);
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || item.category_id === parseInt(filterCategory);
    return matchesSearch && matchesCategory;
  });

  const renderSidebar = () => (
    <aside className={`w-64 bg-white h-screen shadow-2xl fixed left-0 top-0 z-40 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center mb-8">
          <img 
            src={stats?.tenant?.logo_url || '/logo.png'} 
            alt={stats?.tenant?.name} 
            className="h-12 w-12 rounded-lg object-cover mr-3"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/default-logo.png';
            }}
          />
          <div>
            <h1 className="text-xl font-bold text-gray-900">{stats?.tenant?.name || 'MenuIQ'}</h1>
            <p className="text-xs text-gray-500">{stats?.tenant?.subdomain}.menuiq.io</p>
          </div>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setActiveView('overview')}
            className={`sidebar-nav-item w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
              activeView === 'overview' ? 'active bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 shadow-md' : 'text-gray-700 hover:bg-gray-50 hover:translate-x-1'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Overview
            <span className="ml-auto text-xs text-gray-400">Home</span>
          </button>

          <button
            onClick={() => setActiveView('menu')}
            className={`sidebar-nav-item w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
              activeView === 'menu' ? 'active bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 shadow-md' : 'text-gray-700 hover:bg-gray-50 hover:translate-x-1'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Menu Items
            <span className="ml-auto text-xs text-gray-400">Ctrl+M</span>
          </button>

          <button
            onClick={() => setActiveView('categories')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
              activeView === 'categories' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Categories
          </button>

          <button
            onClick={() => setActiveView('analytics')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
              activeView === 'analytics' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Analytics
          </button>

          <button
            onClick={() => setActiveView('flowiq')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
              activeView === 'flowiq' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            FlowIQ
          </button>

          <button
            onClick={() => setActiveView('settings')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
              activeView === 'settings' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                <p className="text-xs text-gray-500">{stats?.tenant?.plan} Plan</p>
              </div>
            </div>
            <button
              onClick={() => {
                tenantLogout();
                navigate('/login');
              }}
              className="w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </aside>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.username || 'Admin'} 👋</h1>
        <p className="text-indigo-100">Here's what's happening with your menu today</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stats-card bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl">
              <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="text-right">
              <span className={`text-sm font-medium ${stats?.stats?.total_items > stats?.limits?.max_items * 0.8 ? 'text-orange-600' : 'text-green-600'}`}>
                {Math.round((stats?.stats?.total_items / stats?.limits?.max_items) * 100) || 0}% used
              </span>
              <p className="text-xs text-gray-500">{stats?.stats?.total_items || 0} / {stats?.limits?.max_items || 50}</p>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{stats?.stats?.total_items || 0}</h3>
          <p className="text-sm text-gray-600 mt-2">Total Menu Items</p>
          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${stats?.stats?.total_items > stats?.limits?.max_items * 0.8 ? 'bg-orange-500' : 'bg-indigo-600'}`}
              style={{ width: `${Math.min((stats?.stats?.total_items / stats?.limits?.max_items) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="stats-card bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${stats?.stats?.active_items > 0 ? 'bg-green-500' : 'bg-gray-400'} animate-pulse`} />
              <span className="text-sm font-medium text-green-600">
                {Math.round((stats?.stats?.active_items / stats?.stats?.total_items) * 100) || 0}%
              </span>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{stats?.stats?.active_items || 0}</h3>
          <p className="text-sm text-gray-600 mt-2">Active Items</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>Currently available</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <span className={`text-sm font-medium ${stats?.stats?.total_categories > stats?.limits?.max_categories * 0.8 ? 'text-orange-600' : 'text-green-600'}`}>
              {stats?.stats?.total_categories || 0} / {stats?.limits?.max_categories || 10}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats?.stats?.total_categories || 0}</h3>
          <p className="text-sm text-gray-500 mt-1">Categories</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats?.recent_items?.length || 0}</h3>
          <p className="text-sm text-gray-500 mt-1">Recent Updates</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={handleCreateItem}
            className="quick-action-card p-6 bg-gradient-to-br from-gray-50 to-white border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-500 hover:shadow-lg transition-all duration-300 group hover:scale-105"
          >
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center mb-4 group-hover:shadow-lg transition-all duration-300">
                <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-base font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">Add Menu Item</span>
              <p className="text-xs text-gray-500 mt-1">Create new dish</p>
            </div>
          </button>

          <button
            onClick={() => setActiveView('categories')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors group"
          >
            <div className="flex flex-col items-center">
              <svg className="w-8 h-8 text-gray-400 group-hover:text-indigo-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600">Manage Categories</span>
            </div>
          </button>

          <a
            href={`https://${stats?.tenant?.subdomain}.menuiq.io/menu`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors group"
          >
            <div className="flex flex-col items-center">
              <svg className="w-8 h-8 text-gray-400 group-hover:text-indigo-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600">Preview Menu</span>
            </div>
          </a>
        </div>
      </div>

      {/* Recent Items */}
      {stats?.recent_items?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Recent Items</h2>
          <div className="space-y-3">
            {stats.recent_items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500">{item.price ? `${item.price} ${stats?.settings?.currency || 'SAR'}` : 'No price set'}</p>
                </div>
                <button
                  onClick={() => handleEditItem(item)}
                  className="text-indigo-600 hover:text-indigo-700"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderMenuItems = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Menu Items</h1>
          <p className="text-gray-500">
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} 
            {filterCategory !== 'all' && ` in ${categories.find(c => c.id === parseInt(filterCategory))?.name || 'category'}`}
          </p>
        </div>
        <button
          onClick={handleCreateItem}
          className="btn-primary px-6 py-3 text-white rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2 font-semibold"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Create New Item
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[280px]">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`p-2 rounded-lg ${viewMode === 'preview' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Items Display */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.length === 0 ? (
            <div className="col-span-full empty-state">
              <div className="empty-state-icon">
                <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-500 mb-6">Create your first menu item to get started</p>
              <button
                onClick={handleCreateItem}
                className="btn-primary px-6 py-3 text-white rounded-lg inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create First Item
              </button>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div key={item.id} className={`menu-item-card group relative bg-white rounded-2xl shadow-sm border-2 overflow-hidden hover:shadow-2xl transition-all duration-300 ${
                item.is_multi_item ? 'border-purple-200 hover:border-purple-400' : 'border-gray-100 hover:border-indigo-200'
              }`}>
                {/* Multi-item indicator */}
                {item.is_multi_item && (
                  <div className="multi-item-badge absolute top-3 left-3 z-10 px-3 py-1.5 text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-lg">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Multi-Item
                  </div>
                )}
              
                {/* Image or Placeholder */}
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  {item.image || item.image_url ? (
                    <img 
                      src={item.image || item.image_url} 
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                ) : (
                    <div className={`w-full h-full flex flex-col items-center justify-center ${
                      item.is_multi_item 
                        ? 'bg-gradient-to-br from-purple-100 via-pink-100 to-purple-200' 
                        : 'bg-gradient-to-br from-gray-100 to-gray-200'
                    }`}>
                      <div className="relative">
                        <svg className={`w-20 h-20 ${item.is_multi_item ? 'text-purple-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {item.is_multi_item && (
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                            {item.sub_items?.length || 0}
                          </div>
                        )}
                      </div>
                      <p className={`text-xs mt-2 ${item.is_multi_item ? 'text-purple-500' : 'text-gray-500'}`}>No image</p>
                    </div>
                )}
                
                {/* Featured/Upsell badges */}
                {(item.is_featured || item.is_upsell || item.badge_text) && (
                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    {item.is_featured && (
                      <span className="px-3 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-full shadow-lg">
                        ⭐ Featured
                      </span>
                    )}
                    {item.is_upsell && (
                      <span 
                        className="px-3 py-1 text-white text-xs font-semibold rounded-full shadow-lg"
                        style={{ backgroundColor: item.upsell_badge_color || '#FF6B6B' }}
                      >
                        {item.upsell_icon === 'fire' ? '🔥' : item.upsell_icon === 'crown' ? '👑' : '⭐'} {item.upsell_badge_text || 'Special'}
                      </span>
                    )}
                    {item.badge_text && !item.is_upsell && (
                      <span 
                        className="px-3 py-1 text-white text-xs font-semibold rounded-full shadow-lg"
                        style={{ backgroundColor: item.badge_color || '#EF4444' }}
                      >
                        {item.badge_text}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">
                      {item.name}
                    </h3>
                    {item.is_multi_item && item.sub_items && (
                      <p className="text-xs text-purple-600 mt-1">
                        {item.sub_items.length} variations
                      </p>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.description}</p>
                
                {/* Price Display */}
                <div className="flex justify-between items-center mb-4">
                  <div>
                    {item.is_multi_item && item.price_min && item.price_max ? (
                      <div>
                        <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                          {item.price_min} - {item.price_max} {settings?.currency || 'SAR'}
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">Price range</p>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-indigo-600">
                        {item.price ? `${item.price} ${settings?.currency || 'SAR'}` : 'No price'}
                      </span>
                    )}
                  </div>
                  
                  {/* Status indicators */}
                  <div className="flex items-center gap-2">
                    {!item.is_available && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        Unavailable
                      </span>
                    )}
                    {item.vegetarian && (
                      <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs" title="Vegetarian">
                        🌿
                      </span>
                    )}
                    {item.halal && (
                      <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs" title="Halal">
                        ✓
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleEditItem(item)}
                    className="flex-1 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            ))
          )}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Item Details</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="empty-state-icon mx-auto mb-4">
                      <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-gray-500">No items found</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all duration-150">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          {item.image || item.image_url ? (
                            <img 
                              src={item.image || item.image_url} 
                              alt={item.name} 
                              className="w-14 h-14 rounded-xl object-cover shadow-sm" 
                            />
                          ) : (
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-sm ${
                              item.is_multi_item ? 'bg-gradient-to-br from-purple-100 to-purple-200' : 'bg-gradient-to-br from-gray-100 to-gray-200'
                            }`}>
                              <svg className={`w-6 h-6 ${item.is_multi_item ? 'text-purple-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          {item.is_featured && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">⭐</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900">{item.name}</h3>
                            {item.badge_text && (
                              <span 
                                className="px-2 py-0.5 text-xs font-medium text-white rounded-full"
                                style={{ backgroundColor: item.badge_color || '#EF4444' }}
                              >
                                {item.badge_text}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate max-w-md mt-0.5">{item.description || 'No description'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm text-gray-700 font-medium">
                        {categories.find(c => c.id === item.category_id)?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {item.is_multi_item ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-xs font-semibold rounded-full">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          Multi ({item.sub_items?.length || 0})
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Single</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      {item.is_multi_item && item.price_min && item.price_max ? (
                        <div>
                          <span className="text-sm font-semibold text-gray-900">
                            {item.price_min} - {item.price_max}
                          </span>
                          <p className="text-xs text-gray-500">{settings?.currency || 'SAR'}</p>
                        </div>
                      ) : (
                        <span className="text-sm font-semibold text-gray-900">
                          {item.price ? `${item.price} ${settings?.currency || 'SAR'}` : '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full ${
                        item.is_available 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${item.is_available ? 'bg-green-600' : 'bg-gray-600'}`} />
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 tooltip"
                          data-tooltip="Edit item"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 tooltip"
                          data-tooltip="Delete item"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === 'preview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <MenuCardPreview key={item.id} item={item} categories={categories} />
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {renderSidebar()}
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <main className="flex-1 md:ml-64 h-screen overflow-hidden flex flex-col">
        {/* Mobile header */}
        <header className="md:hidden bg-white shadow-sm px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">{stats?.tenant?.name || 'MenuIQ'}</h1>
          <div className="w-10" />
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {activeView === 'overview' && renderOverview()}
          {activeView === 'menu' && renderMenuItems()}
          {activeView === 'categories' && <CategoryManager categories={categories} onUpdate={fetchDashboardData} />}
          {activeView === 'analytics' && (
            <div className="h-full max-w-7xl mx-auto">
              <Analytics />
            </div>
          )}
          {activeView === 'settings' && <SettingsPanel onUpdate={fetchDashboardData} />}
          {activeView === 'flowiq' && <FlowIQManager />}
        </div>
      </main>

      {/* Item Type Selector Modal */}
      {showItemTypeSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-8 md:p-12 transform transition-all duration-300 scale-100">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Create New Menu Item
              </h2>
              <p className="text-gray-600">Choose the type of item you want to add to your menu</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Single Item Option */}
              <button
                onClick={() => handleItemTypeSelected(false)}
                className="item-type-option group relative p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-left overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200 to-transparent opacity-30 rounded-full transform translate-x-16 -translate-y-16" />
                <div className="relative z-10">
                  <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl mb-6 group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Single Item</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Create a standard menu item with all the details like price, descriptions, nutrition information, and images
                  </p>
                  <div className="space-y-2 text-sm text-gray-500 mb-6">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Set individual pricing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Add nutrition & allergen info</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Upload multiple images</span>
                    </div>
                  </div>
                  <div className="flex items-center text-indigo-600 font-semibold group-hover:text-indigo-700">
                    <span>Create Single Item</span>
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Multi Item Option */}
              <button
                onClick={() => handleItemTypeSelected(true)}
                className="item-type-option group relative p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-left overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200 to-transparent opacity-30 rounded-full transform translate-x-16 -translate-y-16" />
                <div className="relative z-10">
                  <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mb-6 group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Multi-Item</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Create an item with multiple variations like sizes, flavors, or customizable options
                  </p>
                  <div className="space-y-2 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Group related variations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Display price ranges</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Manage sub-items easily</span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2 font-medium">Perfect for:</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-xs rounded-full font-medium">Pizza Sizes</span>
                      <span className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-xs rounded-full font-medium">Drink Options</span>
                      <span className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-xs rounded-full font-medium">Combo Meals</span>
                    </div>
                  </div>
                  <div className="flex items-center text-purple-600 font-semibold group-hover:text-purple-700">
                    <span>Create Multi-Item</span>
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => setShowItemTypeSelector(false)}
                className="px-8 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditor && (
        <MenuCardEditor
          item={selectedItem}
          isCreatingMultiItem={isCreatingMultiItem}
          categories={categories}
          settings={settings}
          onSave={handleSaveItem}
          onClose={() => {
            setShowEditor(false);
            setSelectedItem(null);
            setIsCreatingMultiItem(false);
          }}
        />
      )}
    </div>
  );
};

export default ModernDashboard;