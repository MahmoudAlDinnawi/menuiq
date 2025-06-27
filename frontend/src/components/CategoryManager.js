import React, { useState } from 'react';
import api from '../services/api';
import tenantAPI from '../services/tenantApi';

const CategoryManager = ({ categories, onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sortOrder: 0,
    isActive: true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert frontend field names to match backend expectations
      const apiData = {
        name: formData.name,
        description: formData.description,
        sort_order: formData.sortOrder,
        is_active: formData.isActive
      };
      
      if (editingCategory) {
        await tenantAPI.updateCategory(editingCategory.id, apiData);
      } else {
        await tenantAPI.createCategory(apiData);
      }
      onUpdate();
      resetForm();
    } catch (error) {
      console.error('Category save error:', error);
      alert('Failed to save category. Please try again.');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      sortOrder: category.sort_order || category.sortOrder || 0,
      isActive: category.is_active !== undefined ? category.is_active : (category.isActive !== undefined ? category.isActive : true)
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await tenantAPI.deleteCategory(id);
        onUpdate();
      } catch (error) {
        alert(error.response?.data?.detail || 'Failed to delete category');
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      sortOrder: 0,
      isActive: true
    });
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-playfair font-bold text-primary">Category Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          Add Category
        </button>
      </div>

      {/* Category List */}
      <div className="grid gap-4">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-primary">{category.name}</h3>
              {category.description && (
                <p className="text-sm text-gray-600 mt-1">{category.description}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Sort Order: {category.sort_order || category.sortOrder || 0}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(category)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
              </button>
              <button
                onClick={() => handleDelete(category.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-playfair font-bold text-primary mb-4">
              {editingCategory ? 'Edit' : 'Add'} Category
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Appetizers"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this category"
                  rows="3"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={resetForm} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingCategory ? 'Update' : 'Add'} Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;