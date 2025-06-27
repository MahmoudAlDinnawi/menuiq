import React, { useState, useEffect } from 'react';
import tenantAPI from '../services/tenantApi';
import { getSubdomain } from '../utils/subdomain';

const AllergenIconManager = () => {
  const [allergenIcons, setAllergenIcons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newAllergen, setNewAllergen] = useState({
    name: '',
    displayName: '',
    displayNameAr: '',
    file: null
  });

  useEffect(() => {
    fetchAllergenIcons();
  }, []);

  const fetchAllergenIcons = async () => {
    try {
      setLoading(true);
      const icons = await tenantAPI.getAllergenIcons();
      setAllergenIcons(icons.allergens || []);
    } catch (error) {
      console.error('Error fetching allergen icons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a valid image file (PNG, JPG, SVG, or WebP)');
        return;
      }
      setNewAllergen({ ...newAllergen, file });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!newAllergen.name || !newAllergen.displayName || !newAllergen.file) {
      alert('Please fill all required fields');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', newAllergen.file);
    formData.append('display_name', newAllergen.displayName);
    if (newAllergen.displayNameAr) {
      formData.append('display_name_ar', newAllergen.displayNameAr);
    }

    try {
      // For now, we'll need to create a custom upload for allergen icons
      // since it needs special handling
      const subdomain = getSubdomain();
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/${subdomain}/allergen-icons/${newAllergen.name}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload');
      }
      
      // Reset form
      setNewAllergen({
        name: '',
        displayName: '',
        displayNameAr: '',
        file: null
      });
      // Clear file input
      document.getElementById('allergen-file-input').value = '';
      // Refresh list
      await fetchAllergenIcons();
      alert('Allergen icon uploaded successfully!');
    } catch (error) {
      console.error('Error uploading allergen icon:', error);
      alert('Failed to upload allergen icon');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (allergenName) => {
    if (!window.confirm(`Are you sure you want to delete the icon for "${allergenName}"?`)) {
      return;
    }

    try {
      await tenantAPI.deleteAllergenIcon(allergenName);
      await fetchAllergenIcons();
      alert('Allergen icon deleted successfully!');
    } catch (error) {
      console.error('Error deleting allergen icon:', error);
      alert('Failed to delete allergen icon');
    }
  };

  const commonAllergens = [
    'gluten', 'dairy', 'eggs', 'fish', 'shellfish', 'nuts', 
    'peanuts', 'soy', 'sesame', 'celery', 'mustard', 'lupin', 
    'molluscs', 'sulphites'
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Allergen Icon Manager</h2>
      
      {/* Upload Form */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload New Allergen Icon</h3>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allergen Name (ID) *
              </label>
              <select
                value={newAllergen.name}
                onChange={(e) => setNewAllergen({ ...newAllergen, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="">Select allergen...</option>
                {commonAllergens.map(allergen => (
                  <option key={allergen} value={allergen}>
                    {allergen.charAt(0).toUpperCase() + allergen.slice(1)}
                  </option>
                ))}
                <option value="custom">Custom (Other)</option>
              </select>
              {newAllergen.name === 'custom' && (
                <input
                  type="text"
                  placeholder="Enter custom allergen name"
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  onChange={(e) => setNewAllergen({ ...newAllergen, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                />
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name (English) *
              </label>
              <input
                type="text"
                value={newAllergen.displayName}
                onChange={(e) => setNewAllergen({ ...newAllergen, displayName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g., Contains Gluten"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name (Arabic)
              </label>
              <input
                type="text"
                value={newAllergen.displayNameAr}
                onChange={(e) => setNewAllergen({ ...newAllergen, displayNameAr: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g., يحتوي على الجلوتين"
                dir="rtl"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icon File *
              </label>
              <input
                id="allergen-file-input"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Accepted formats: PNG, JPG, SVG, WebP (recommended: 64x64px)
              </p>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={uploading}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload Icon'}
          </button>
        </form>
      </div>
      
      {/* Current Icons */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Allergen Icons</h3>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : allergenIcons.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No allergen icons uploaded yet. Upload your first icon above!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allergenIcons.map((icon) => (
              <div key={icon.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{icon.name}</h4>
                    <p className="text-sm text-gray-600">{icon.display_name}</p>
                    {icon.display_name_ar && (
                      <p className="text-sm text-gray-600" dir="rtl">{icon.display_name_ar}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(icon.name)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <div className="bg-gray-50 rounded p-4 flex items-center justify-center">
                  <img 
                    src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${icon.icon_url}`}
                    alt={icon.display_name}
                    className="w-16 h-16 object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllergenIconManager;