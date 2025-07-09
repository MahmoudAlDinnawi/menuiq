import React, { useState } from 'react';
import tenantAPI from '../services/tenantApiV2';

const EnhancedCategoryManager = ({ categories, onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [sortMode, setSortMode] = useState(false);
  const [draggedCategory, setDraggedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    description_ar: '',
    label: '',
    label_ar: '',
    icon: '🍴',
    color_theme: '#6B7280',
    is_active: true,
    is_featured: false,
    display_style: 'grid',
    sort_order: 0
  });

  const defaultIcons = [
    { icon: '🥗', label: 'Salad' },
    { icon: '🍽️', label: 'Main' },
    { icon: '🍰', label: 'Dessert' },
    { icon: '🥤', label: 'Beverage' },
    { icon: '🍲', label: 'Soup' },
    { icon: '🍕', label: 'Pizza' },
    { icon: '🍔', label: 'Burger' },
    { icon: '🍝', label: 'Pasta' },
    { icon: '🦐', label: 'Seafood' },
    { icon: '🥩', label: 'Meat' },
    { icon: '🍗', label: 'Chicken' },
    { icon: '🍳', label: 'Breakfast' },
    { icon: '☕', label: 'Coffee' },
    { icon: '🍴', label: 'General' }
  ];

  const colorThemes = [
    { color: '#10B981', label: 'Green' },
    { color: '#3B82F6', label: 'Blue' },
    { color: '#EC4899', label: 'Pink' },
    { color: '#F59E0B', label: 'Orange' },
    { color: '#8B5CF6', label: 'Purple' },
    { color: '#EF4444', label: 'Red' },
    { color: '#6B7280', label: 'Gray' },
    { color: '#14B8A6', label: 'Teal' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const submitData = {
        ...formData,
        value: formData.name.toLowerCase().replace(/\s+/g, '_'),
        label: formData.label || formData.name,
        sort_order: parseInt(formData.sort_order) || 0
      };

      if (editingCategory) {
        await tenantAPI.put(`/categories/${editingCategory.id}`, submitData);
      } else {
        await tenantAPI.post('/categories', submitData);
      }

      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Failed to save category:', error);
      alert('Failed to save category');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || '',
      description_ar: category.description_ar || '',
      label: category.label || category.name || '',
      label_ar: category.label_ar || category.name || '',
      icon: category.icon || '🍴',
      color_theme: category.color_theme || '#6B7280',
      is_active: category.is_active !== undefined ? category.is_active : true,
      is_featured: category.is_featured || false,
      display_style: category.display_style || 'grid',
      sort_order: category.sort_order || 0
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      await tenantAPI.delete(`/categories/${id}`);
      onUpdate();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert(error.response?.data?.detail || 'Failed to delete category');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      description_ar: '',
      label: '',
      label_ar: '',
      icon: '🍴',
      color_theme: '#6B7280',
      is_active: true,
      is_featured: false,
      display_style: 'grid',
      sort_order: 0
    });
  };

  // Drag and drop handlers
  const handleDragStart = (e, category) => {
    setDraggedCategory(category);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetCategory) => {
    e.preventDefault();
    if (!draggedCategory || draggedCategory.id === targetCategory.id) return;

    // Calculate new sort orders
    const sortedCategories = [...categories].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const draggedIndex = sortedCategories.findIndex(c => c.id === draggedCategory.id);
    const targetIndex = sortedCategories.findIndex(c => c.id === targetCategory.id);

    // Remove dragged item and insert at new position
    sortedCategories.splice(draggedIndex, 1);
    sortedCategories.splice(targetIndex, 0, draggedCategory);

    // Update sort orders
    const updates = sortedCategories.map((cat, index) => ({
      id: cat.id,
      sort_order: index
    }));

    try {
      // Update sort orders in backend
      await tenantAPI.post('/categories/update-sort-order', { categories: updates });
      setDraggedCategory(null);
      onUpdate();
    } catch (error) {
      console.error('Failed to update sort order:', error);
      alert('Failed to update category order');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setSortMode(!sortMode)}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              sortMode 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            {sortMode ? 'Done Sorting' : 'Sort Categories'}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Category
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((category) => (
          <div
            key={category.id}
            className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all ${
              sortMode 
                ? 'cursor-move hover:shadow-xl hover:scale-105' 
                : 'hover:shadow-lg'
            } ${draggedCategory?.id === category.id ? 'opacity-50' : ''}`}
            draggable={sortMode}
            onDragStart={(e) => sortMode && handleDragStart(e, category)}
            onDragOver={handleDragOver}
            onDrop={(e) => sortMode && handleDrop(e, category)}
          >
            <div 
              className="h-2"
              style={{ backgroundColor: category.color_theme || '#6B7280' }}
            />
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${category.color_theme}20` }}
                  >
                    {category.icon || '🍴'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    {category.label_ar && (
                      <p className="text-sm text-gray-500" dir="rtl">{category.label_ar}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  {category.is_featured && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                      Featured
                    </span>
                  )}
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    category.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {category.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {category.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {category.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Order: {category.sort_order || 0}</span>
                <span>Style: {category.display_style || 'grid'}</span>
              </div>

              {sortMode ? (
                <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                  <span className="text-sm text-gray-500 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                    Drag to reorder
                  </span>
                </div>
              ) : (
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(category)}
                    className="flex-1 px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="flex-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Category Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
              <h2 className="text-2xl font-bold">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name (English) *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Label (English)</label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({...formData, label: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Leave empty to use Name"
                  />
                </div>
              </div>

              {/* Label Arabic Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Label (Arabic)</label>
                <input
                  type="text"
                  value={formData.label_ar}
                  onChange={(e) => setFormData({...formData, label_ar: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  dir="rtl"
                />
              </div>

              {/* Description Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (English)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Arabic)</label>
                  <textarea
                    value={formData.description_ar}
                    onChange={(e) => setFormData({...formData, description_ar: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Icon Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                <div className="grid grid-cols-7 gap-2">
                  {defaultIcons.map((iconOption) => (
                    <button
                      key={iconOption.icon}
                      type="button"
                      onClick={() => setFormData({...formData, icon: iconOption.icon})}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.icon === iconOption.icon
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      title={iconOption.label}
                    >
                      <span className="text-2xl">{iconOption.icon}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Theme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color Theme</label>
                <div className="grid grid-cols-4 gap-2">
                  {colorThemes.map((theme) => (
                    <button
                      key={theme.color}
                      type="button"
                      onClick={() => setFormData({...formData, color_theme: theme.color})}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.color_theme === theme.color
                          ? 'border-gray-800 scale-105'
                          : 'border-gray-200'
                      }`}
                    >
                      <div 
                        className="w-full h-8 rounded"
                        style={{ backgroundColor: theme.color }}
                      />
                      <span className="text-xs text-gray-600 mt-1">{theme.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Style</label>
                  <select
                    value={formData.display_style}
                    onChange={(e) => setFormData({...formData, display_style: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="grid">Grid</option>
                    <option value="list">List</option>
                    <option value="carousel">Carousel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({...formData, sort_order: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Status Options */}
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Featured Category</span>
                </label>
              </div>
            </form>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {editingCategory ? 'Update' : 'Create'} Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedCategoryManager;