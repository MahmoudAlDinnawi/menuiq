import React, { useState, useEffect } from 'react';
import tenantAPI from '../services/tenantApiV2';

const MenuItemManagerV2 = ({ onUpdate }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    description: '',
    description_ar: '',
    category_id: '',
    price: '',
    price_without_vat: '',
    calories: '',
    preparation_time: '',
    is_available: true,
    halal: true,
    vegetarian: false,
    vegan: false,
    gluten_free: false,
    dairy_free: false,
    nut_free: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, categoriesRes] = await Promise.all([
        tenantAPI.get('/menu-items'),
        tenantAPI.get('/categories')
      ]);
      setMenuItems(itemsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prepare data
    const submitData = {
      ...formData,
      category_id: formData.category_id ? parseInt(formData.category_id) : null,
      calories: formData.calories ? parseInt(formData.calories) : null,
      preparation_time: formData.preparation_time ? parseInt(formData.preparation_time) : null
    };

    try {
      if (editingItem) {
        await tenantAPI.put(`/menu-items/${editingItem.id}`, submitData);
      } else {
        await tenantAPI.post('/menu-items', submitData);
      }
      fetchData();
      if (onUpdate) onUpdate();
      resetForm();
    } catch (error) {
      console.error('Failed to save menu item:', error);
      const message = error.response?.data?.detail || 'Failed to save menu item';
      alert(message);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      name_ar: item.name_ar || '',
      description: item.description || '',
      description_ar: item.description_ar || '',
      category_id: item.category_id || '',
      price: item.price || '',
      price_without_vat: item.price_without_vat || '',
      calories: item.calories || '',
      preparation_time: item.preparation_time || '',
      is_available: item.is_available !== undefined ? item.is_available : true,
      halal: item.halal !== undefined ? item.halal : true,
      vegetarian: item.vegetarian || false,
      vegan: item.vegan || false,
      gluten_free: item.gluten_free || false,
      dairy_free: item.dairy_free || false,
      nut_free: item.nut_free || false
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) {
      return;
    }

    try {
      await tenantAPI.delete(`/menu-items/${id}`);
      fetchData();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to delete menu item:', error);
      alert('Failed to delete menu item');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({
      name: '',
      name_ar: '',
      description: '',
      description_ar: '',
      category_id: '',
      price: '',
      price_without_vat: '',
      calories: '',
      preparation_time: '',
      is_available: true,
      halal: true,
      vegetarian: false,
      vegan: false,
      gluten_free: false,
      dairy_free: false,
      nut_free: false
    });
  };

  // Filter items
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = !selectedCategory || item.category_id === selectedCategory;
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Menu Items</h2>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          Add Menu Item
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4 md:space-y-0 md:flex md:items-center md:space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No menu items found</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const category = categories.find(c => c.id === item.category_id);
            return (
              <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                    {!item.is_available && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded">
                        Unavailable
                      </span>
                    )}
                  </div>
                  
                  {category && (
                    <p className="text-sm text-gray-500 mb-2">{category.name}</p>
                  )}
                  
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-primary">{item.price}</span>
                    {item.calories && (
                      <span className="text-sm text-gray-500">{item.calories} cal</span>
                    )}
                  </div>
                  
                  {/* Dietary badges */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {item.halal && <span className="badge badge-green">Halal</span>}
                    {item.vegetarian && <span className="badge badge-green">Vegetarian</span>}
                    {item.vegan && <span className="badge badge-green">Vegan</span>}
                    {item.gluten_free && <span className="badge badge-blue">Gluten Free</span>}
                    {item.dairy_free && <span className="badge badge-blue">Dairy Free</span>}
                    {item.nut_free && <span className="badge badge-blue">Nut Free</span>}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex-1 px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full my-8">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingItem ? 'Edit' : 'Add'} Menu Item
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (English) *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (Arabic)
                  </label>
                  <input
                    type="text"
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    dir="rtl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">No Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (English)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Arabic)
                </label>
                <textarea
                  value={formData.description_ar}
                  onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  dir="rtl"
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (with VAT)
                  </label>
                  <input
                    type="text"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., 25.00 SAR"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (without VAT)
                  </label>
                  <input
                    type="text"
                    value={formData.price_without_vat}
                    onChange={(e) => setFormData({ ...formData, price_without_vat: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., 21.74 SAR"
                  />
                </div>
              </div>

              {/* Nutrition */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calories
                  </label>
                  <input
                    type="number"
                    value={formData.calories}
                    onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preparation Time (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.preparation_time}
                    onChange={(e) => setFormData({ ...formData, preparation_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Dietary Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dietary Information
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_available}
                      onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Available</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.halal}
                      onChange={(e) => setFormData({ ...formData, halal: e.target.checked })}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Halal</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.vegetarian}
                      onChange={(e) => setFormData({ ...formData, vegetarian: e.target.checked })}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Vegetarian</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.vegan}
                      onChange={(e) => setFormData({ ...formData, vegan: e.target.checked })}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Vegan</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.gluten_free}
                      onChange={(e) => setFormData({ ...formData, gluten_free: e.target.checked })}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Gluten Free</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.dairy_free}
                      onChange={(e) => setFormData({ ...formData, dairy_free: e.target.checked })}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Dairy Free</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.nut_free}
                      onChange={(e) => setFormData({ ...formData, nut_free: e.target.checked })}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Nut Free</span>
                  </label>
                </div>
              </div>
            </form>
            
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                {editingItem ? 'Update' : 'Add'} Item
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .badge {
          @apply px-2 py-0.5 text-xs font-medium rounded-full;
        }
        .badge-green {
          @apply bg-green-100 text-green-800;
        }
        .badge-blue {
          @apply bg-blue-100 text-blue-800;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default MenuItemManagerV2;