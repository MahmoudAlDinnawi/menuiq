import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import api from '../services/api';
import tenantAPI from '../services/tenantApi';

const EnhancedSettingsManager = () => {
  const [settings, setSettings] = useState({
    footerEnabled: false,
    footerTextEn: '',
    footerTextAr: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Rich text editor modules configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ]
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'align',
    'list', 'bullet',
    'link', 'image'
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await tenantAPI.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (e) => {
    setSettings(prev => ({
      ...prev,
      footerEnabled: e.target.checked
    }));
  };

  const handleEnglishChange = (value) => {
    setSettings(prev => ({
      ...prev,
      footerTextEn: value
    }));
  };

  const handleArabicChange = (value) => {
    setSettings(prev => ({
      ...prev,
      footerTextAr: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await tenantAPI.updateSettings(settings);
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

  // Custom styles for the editor
  const editorStyle = {
    backgroundColor: 'white',
    minHeight: '200px',
    marginBottom: '1rem'
  };

  const arabicEditorStyle = {
    ...editorStyle,
    direction: 'rtl',
    textAlign: 'right'
  };

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
                checked={settings.footerEnabled}
                onChange={handleToggle}
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
                  <div style={editorStyle}>
                    <ReactQuill
                      theme="snow"
                      value={settings.footerTextEn}
                      onChange={handleEnglishChange}
                      modules={modules}
                      formats={formats}
                      placeholder="Enter footer text in English..."
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-primary mb-2">
                    Footer Text (Arabic)
                  </label>
                  <div style={arabicEditorStyle}>
                    <ReactQuill
                      theme="snow"
                      value={settings.footerTextAr}
                      onChange={handleArabicChange}
                      modules={modules}
                      formats={formats}
                      placeholder="أدخل نص التذييل بالعربية..."
                      className="rtl-editor"
                    />
                  </div>
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
                <div className="bg-white p-4 rounded border border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">English:</p>
                  <div 
                    className="text-sm text-primary prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: DOMPurify.sanitize(settings.footerTextEn) 
                    }}
                  />
                </div>
              )}
              
              {settings.footerTextAr && (
                <div className="bg-white p-4 rounded border border-gray-200" dir="rtl">
                  <p className="text-xs text-gray-500 mb-2">العربية:</p>
                  <div 
                    className="text-sm text-primary prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: DOMPurify.sanitize(settings.footerTextAr) 
                    }}
                  />
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
      
      <style jsx>{`
        .rtl-editor .ql-editor {
          direction: rtl;
          text-align: right;
        }
        
        .rtl-editor .ql-toolbar {
          direction: rtl;
        }
        
        .prose h1 { font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem; }
        .prose h2 { font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem; }
        .prose h3 { font-size: 1.125rem; font-weight: bold; margin-bottom: 0.5rem; }
        .prose p { margin-bottom: 0.5rem; }
        .prose ul, .prose ol { margin-bottom: 0.5rem; padding-left: 1.5rem; }
        .prose li { margin-bottom: 0.25rem; }
        .prose a { color: #00594f; text-decoration: underline; }
        .prose img { max-width: 100%; height: auto; }
      `}</style>
    </div>
  );
};

export default EnhancedSettingsManager;