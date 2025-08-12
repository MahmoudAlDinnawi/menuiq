import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import tenantAPI from '../services/tenantApiV2';
import MenuCardEditor from './MenuCardEditor';
import MenuCardPreview from './MenuCardPreview';
import CategoryManager from './EnhancedCategoryManager';
import SettingsPanel from './SettingsPanel';
import Analytics from './Analytics';
import ItemTypeSelector from './ItemTypeSelector';

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
  const [showItemTypeSelector, setShowItemTypeSelector] = useState(false);
  const [newItemType, setNewItemType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid, list, preview
  const [showDashboardLogoModal, setShowDashboardLogoModal] = useState(false);
  const [dashboardLogoPreview, setDashboardLogoPreview] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [sortMode, setSortMode] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
      
      // Debug: Check for multi-items
      console.log('All menu items:', itemsRes.data);
      console.log('Multi-items:', itemsRes.data.filter(item => item.is_multi_item));
      console.log('Items with sub-items:', itemsRes.data.filter(item => item.sub_items && item.sub_items.length > 0));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = () => {
    setShowItemTypeSelector(true);
  };

  const handleItemTypeSelect = (type) => {
    setNewItemType(type);
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
      if (selectedItem) {
        await tenantAPI.put(`/menu-items/${selectedItem.id}`, itemData);
      } else {
        await tenantAPI.post('/menu-items', itemData);
      }
      setShowEditor(false);
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to save item:', error);
    }
  };

  const handleUpdateDashboardLogo = () => {
    setShowDashboardLogoModal(true);
    setDashboardLogoPreview(stats?.tenant?.dashboard_logo_url || null);
  };

  const handleDashboardLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDashboardLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveDashboardLogo = async () => {
    try {
      const fileInput = document.getElementById('dashboard-logo-input');
      const file = fileInput?.files[0];
      
      if (!file) {
        alert('Please select a logo file to upload');
        return;
      }
      
      // Upload the file first
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await tenantAPI.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Get the URL from the upload response
      const logoUrl = uploadRes.data.url;
      
      // Update tenant with new dashboard logo URL (not base64)
      await tenantAPI.put('/current', {
        dashboard_logo_url: logoUrl
      });
      
      // Refresh dashboard data
      await fetchDashboardData();
      setShowDashboardLogoModal(false);
      setDashboardLogoPreview(null);
    } catch (error) {
      console.error('Failed to update dashboard logo:', error);
      alert('Failed to update dashboard logo: ' + (error.response?.data?.detail || error.message));
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || item.category_id === parseInt(filterCategory);
    return matchesSearch && matchesCategory;
  });

  // Group items by category for sorting
  const itemsByCategory = filteredItems.reduce((acc, item) => {
    const categoryId = item.category_id || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(item);
    return acc;
  }, {});

  // Sort items within each category by sort_order
  Object.keys(itemsByCategory).forEach(categoryId => {
    itemsByCategory[categoryId].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  });

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetItem) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetItem.id) return;

    // Only allow reordering within the same category
    if (draggedItem.category_id !== targetItem.category_id) {
      alert('Items can only be reordered within the same category');
      return;
    }

    const categoryId = draggedItem.category_id || 'uncategorized';
    const categoryItems = [...itemsByCategory[categoryId]];
    
    const draggedIndex = categoryItems.findIndex(item => item.id === draggedItem.id);
    const targetIndex = categoryItems.findIndex(item => item.id === targetItem.id);
    
    // Remove dragged item and insert at new position
    categoryItems.splice(draggedIndex, 1);
    categoryItems.splice(targetIndex, 0, draggedItem);
    
    // Update sort_order for all items in the category
    const updates = categoryItems.map((item, index) => ({
      id: item.id,
      sort_order: index
    }));
    
    try {
      await tenantAPI.updateMenuItemSortOrder(updates);
      // Update local state
      const updatedItems = menuItems.map(item => {
        const update = updates.find(u => u.id === item.id);
        if (update) {
          return { ...item, sort_order: update.sort_order };
        }
        return item;
      });
      setMenuItems(updatedItems);
    } catch (error) {
      console.error('Failed to update sort order:', error);
      alert('Failed to update sort order');
    }
    
    setDraggedItem(null);
  };

  const renderSidebar = () => (
    <aside className="w-64 bg-white h-screen shadow-lg fixed left-0 top-0">
      <div className="p-6">
        <div className="flex items-center mb-8">
          <img 
            src={
              stats?.tenant?.dashboard_logo_url 
                ? `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${stats.tenant.dashboard_logo_url}`
                : stats?.tenant?.logo_url 
                  ? `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${stats.tenant.logo_url}`
                  : '/default-logo.png'
            } 
            alt={stats?.tenant?.name} 
            className="h-12 w-12 rounded-lg object-cover mr-3 cursor-pointer hover:opacity-80 transition-opacity"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/default-logo.png';
            }}
            onClick={() => handleUpdateDashboardLogo()}
            title="Click to update dashboard logo"
          />
          <div>
            <h1 className="text-xl font-bold text-gray-900">{stats?.tenant?.name || 'MenuIQ'}</h1>
            <p className="text-xs text-gray-500">{stats?.tenant?.subdomain}.menuiq.io</p>
          </div>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setActiveView('overview')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
              activeView === 'overview' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Overview
          </button>

          <button
            onClick={() => setActiveView('menu')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
              activeView === 'menu' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Menu Items
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-50 rounded-lg">
              <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className={`text-sm font-medium ${stats?.stats?.total_items > stats?.limits?.max_items * 0.8 ? 'text-orange-600' : 'text-green-600'}`}>
              {stats?.stats?.total_items || 0} / {stats?.limits?.max_items || 50}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats?.stats?.total_items || 0}</h3>
          <p className="text-sm text-gray-500 mt-1">Menu Items</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-green-600">
              {Math.round((stats?.stats?.active_items / stats?.stats?.total_items) * 100) || 0}%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats?.stats?.active_items || 0}</h3>
          <p className="text-sm text-gray-500 mt-1">Active Items</p>
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
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleCreateItem}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors group"
          >
            <div className="flex flex-col items-center">
              <svg className="w-8 h-8 text-gray-400 group-hover:text-indigo-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600">Add Menu Item</span>
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Menu Items</h1>
        <button
          onClick={handleCreateItem}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Item
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
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
              onClick={() => setSortMode(!sortMode)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${sortMode ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              {sortMode ? 'Done Sorting' : 'Sort Items'}
            </button>
            <div className="border-l mx-2"></div>
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
        <div className="space-y-8">
          {sortMode && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-medium">Sort Mode Active</p>
              <p>Drag and drop items to reorder them within their categories. Click "Done Sorting" when finished.</p>
            </div>
          )}
          
          {Object.entries(itemsByCategory).map(([categoryId, categoryItems]) => {
            const category = categoryId === 'uncategorized' 
              ? { name: 'Uncategorized', id: 'uncategorized' }
              : categories.find(c => c.id === parseInt(categoryId));
            
            if (!category || categoryItems.length === 0) return null;
            
            return (
              <div key={categoryId} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  {category.name}
                  <span className="text-sm font-normal text-gray-500">({categoryItems.length} items)</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryItems.map((item) => (
                    <div 
                      key={item.id} 
                      className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${
                        sortMode 
                          ? 'cursor-move border-gray-300 hover:border-indigo-400 hover:shadow-md' 
                          : 'border-gray-100 hover:shadow-lg'
                      } ${draggedItem?.id === item.id ? 'opacity-50' : ''}`}
                      draggable={sortMode}
                      onDragStart={(e) => sortMode && handleDragStart(e, item)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => sortMode && handleDrop(e, item)}
                    >
                      {sortMode && (
                        <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
                          <span className="text-sm text-gray-600">Position: {(item.sort_order || 0) + 1}</span>
                          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                          </svg>
                        </div>
                      )}
                      
                      {item.image_url && (
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            {item.name}
                            {item.is_multi_item && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-500 text-white">
                                Multi
                              </span>
                            )}
                          </h3>
                          {item.badge_text && (
                            <span 
                              className="px-2 py-1 text-xs font-medium rounded-full"
                              style={{
                                backgroundColor: item.badge_color || '#EF4444',
                                color: 'white'
                              }}
                            >
                              {item.badge_text}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-indigo-600">
                            {item.is_multi_item ? (
                              item.price_min && item.price_max ? (
                                item.price_min === item.price_max 
                                  ? `${item.price_min} ${settings?.currency || 'SAR'}`
                                  : `${item.price_min} - ${item.price_max} ${settings?.currency || 'SAR'}`
                              ) : 'Price varies'
                            ) : (
                              item.price ? `${item.price} ${settings?.currency || 'SAR'}` : 'No price'
                            )}
                          </span>
                          {!sortMode && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditItem(item)}
                                className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {item.image_url && (
                        <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded-lg object-cover mr-3" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          {item.name}
                          {item.is_multi_item && (
                            <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-purple-500 text-white">
                              Multi
                            </span>
                          )}
                          {item.parent_item_id && (
                            <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                              Sub-item of: {item.parent_item_name || `#${item.parent_item_id}`}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{item.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {categories.find(c => c.id === item.category_id)?.name || 'Uncategorized'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.is_multi_item ? (
                      item.price_min && item.price_max ? (
                        item.price_min === item.price_max 
                          ? `${item.price_min} ${settings?.currency || 'SAR'}`
                          : `${item.price_min} - ${item.price_max} ${settings?.currency || 'SAR'}`
                      ) : '-'
                    ) : (
                      item.price ? `${item.price} ${settings?.currency || 'SAR'}` : '-'
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      item.is_available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditItem(item)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === 'preview' && (
        <div className="space-y-8">
          {Object.entries(itemsByCategory).map(([categoryId, categoryItems]) => {
            const category = categoryId === 'uncategorized' 
              ? { name: 'Uncategorized', id: 'uncategorized' }
              : categories.find(c => c.id === parseInt(categoryId));
            
            if (!category || categoryItems.length === 0) return null;
            
            return (
              <div key={categoryId} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  {category.name}
                  <span className="text-sm font-normal text-gray-500">({categoryItems.length} items)</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryItems.map((item) => (
                    <MenuCardPreview key={item.id} item={item} categories={categories} />
                  ))}
                </div>
              </div>
            );
          })}
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
      
      <main className="flex-1 ml-64 h-screen overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-8">
          {activeView === 'overview' && renderOverview()}
          {activeView === 'menu' && renderMenuItems()}
          {activeView === 'categories' && <CategoryManager categories={categories} onUpdate={fetchDashboardData} />}
          {activeView === 'analytics' && (
            <div className="h-full max-w-7xl mx-auto">
              <Analytics />
            </div>
          )}
          {activeView === 'settings' && <SettingsPanel onUpdate={fetchDashboardData} />}
        </div>
      </main>

      {showItemTypeSelector && (
        <ItemTypeSelector
          onSelect={handleItemTypeSelect}
          onClose={() => setShowItemTypeSelector(false)}
        />
      )}

      {showEditor && (
        <MenuCardEditor
          item={selectedItem}
          itemType={newItemType}
          categories={categories}
          settings={settings}
          onSave={handleSaveItem}
          onClose={() => {
            setShowEditor(false);
            setSelectedItem(null);
            setNewItemType(null);
          }}
        />
      )}

      {/* Dashboard Logo Update Modal */}
      {showDashboardLogoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Update Dashboard Logo</h2>
                <button
                  onClick={() => {
                    setShowDashboardLogoModal(false);
                    setDashboardLogoPreview(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Current Logo Preview */}
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    This logo appears in the dashboard header. It can be different from your main restaurant logo.
                  </p>
                  
                  {dashboardLogoPreview ? (
                    <div className="inline-block relative">
                      <img 
                        src={dashboardLogoPreview} 
                        alt="Dashboard Logo Preview" 
                        className="h-24 w-24 rounded-lg object-cover shadow-lg"
                      />
                      <button
                        onClick={() => setDashboardLogoPreview(null)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="h-24 w-24 mx-auto rounded-lg bg-gray-100 flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Upload Section */}
                <div>
                  <label className="block w-full">
                    <input
                      id="dashboard-logo-input"
                      type="file"
                      accept="image/*"
                      onChange={handleDashboardLogoChange}
                      className="hidden"
                    />
                    <div className="cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-gray-600">
                        Click to upload a new dashboard logo
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG up to 5MB. Square images work best.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowDashboardLogoModal(false);
                      setDashboardLogoPreview(null);
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveDashboardLogo}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Save Logo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernDashboard;