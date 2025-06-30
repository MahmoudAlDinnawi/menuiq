import React, { useState, useEffect } from 'react';
import tenantAPI from '../services/tenantApiV2';

const LogoSettings = () => {
  const [tenantInfo, setTenantInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchTenantInfo();
  }, []);

  const fetchTenantInfo = async () => {
    try {
      setLoading(true);
      const response = await tenantAPI.get('/info');
      setTenantInfo(response.data);
      if (response.data.logo_url) {
        setPreviewUrl(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${response.data.logo_url}`);
      }
    } catch (error) {
      console.error('Failed to fetch tenant info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, GIF, SVG, or WebP)');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await tenantAPI.post('/upload-logo', formData);

      setTenantInfo(prev => ({
        ...prev,
        logo_url: response.data.logo_url
      }));
      setSelectedFile(null);
      alert('Logo uploaded successfully!');
      
      // Refresh the preview URL
      setPreviewUrl(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${response.data.logo_url}`);
    } catch (error) {
      console.error('Failed to upload logo:', error);
      alert('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your logo?')) return;

    try {
      setUploading(true);
      await tenantAPI.delete('/logo');
      
      setTenantInfo(prev => ({
        ...prev,
        logo_url: null
      }));
      setPreviewUrl(null);
      alert('Logo deleted successfully!');
    } catch (error) {
      console.error('Failed to delete logo:', error);
      alert('Failed to delete logo');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-6">Restaurant Logo</h2>
      
      <div className="space-y-6">
        {/* Current Logo Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Logo
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            {previewUrl ? (
              <div className="space-y-4">
                <img
                  src={previewUrl}
                  alt="Restaurant logo"
                  className="mx-auto max-h-32 max-w-full object-contain"
                />
                {!selectedFile && tenantInfo?.logo_url && (
                  <button
                    onClick={handleDelete}
                    disabled={uploading}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete Logo
                  </button>
                )}
              </div>
            ) : (
              <div className="text-gray-400">
                <svg
                  className="mx-auto h-12 w-12"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="mt-2">No logo uploaded</p>
              </div>
            )}
          </div>
        </div>

        {/* Upload Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload New Logo
          </label>
          <div className="flex items-center space-x-4">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/svg+xml,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <svg className="mr-2 -ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Choose File
              </span>
            </label>
            
            {selectedFile && (
              <>
                <span className="text-sm text-gray-600">
                  {selectedFile.name}
                </span>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    uploading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  }`}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Accepted formats: JPEG, PNG, GIF, SVG, WebP. Maximum size: 5MB.
          </p>
        </div>

        {/* Logo Display Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Where your logo appears:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Guest menu header</li>
            <li>• Email notifications</li>
            <li>• Printed menus</li>
            <li>• QR code menus</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LogoSettings;