import React, { useState, useEffect } from 'react';
import { menuAPI } from '../services/api';

const SettingsManager = () => {
  const [settings, setSettings] = useState({
    footerEnabled: false,
    footerTextEn: '',
    footerTextAr: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await menuAPI.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await menuAPI.updateSettings(settings);
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <h2 className="text-2xl font-playfair font-bold text-primary mb-6">Menu Settings</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Footer Settings */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold text-primary mb-4">Footer Text</h3>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="footerEnabled"
                checked={settings.footerEnabled}
                onChange={handleChange}
                className="w-5 h-5 text-primary rounded focus:ring-primary"
              />
              <span className="font-medium">Enable Footer Text</span>
            </label>
            
            {settings.footerEnabled && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-primary mb-2">
                    Footer Text (English)
                  </label>
                  <textarea
                    name="footerTextEn"
                    value={settings.footerTextEn}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Enter footer text in English..."
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-primary mb-2">
                    Footer Text (Arabic)
                  </label>
                  <textarea
                    name="footerTextAr"
                    value={settings.footerTextAr}
                    onChange={handleChange}
                    rows="3"
                    placeholder="أدخل نص التذييل بالعربية..."
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
                    dir="rtl"
                  />
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Preview */}
        {settings.footerEnabled && (settings.footerTextEn || settings.footerTextAr) && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-600 mb-3">Preview</h4>
            
            <div className="space-y-3">
              {settings.footerTextEn && (
                <div className="bg-white p-3 rounded border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">English:</p>
                  <p className="text-sm text-primary">{settings.footerTextEn}</p>
                </div>
              )}
              
              {settings.footerTextAr && (
                <div className="bg-white p-3 rounded border border-gray-200" dir="rtl">
                  <p className="text-xs text-gray-500 mb-1">العربية:</p>
                  <p className="text-sm text-primary">{settings.footerTextAr}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsManager;