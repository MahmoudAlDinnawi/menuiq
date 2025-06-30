import React, { useState, useEffect } from 'react';
import tenantAPI from '../services/tenantApiV2';
import LogoSettings from './LogoSettings';

const SettingsPanel = ({ onUpdate }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await tenantAPI.get('/settings');
      console.log('Settings loaded:', response.data);
      console.log('show_all_category value:', response.data.show_all_category);
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await tenantAPI.put('/settings', settings);
      if (onUpdate) onUpdate();
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    console.log(`Changing ${field} to:`, value);
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div className="text-center py-12">Loading settings...</div>;
  }

  if (!settings) {
    return <div className="text-center py-12">Failed to load settings</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {['general', 'logo', 'seo', 'display', 'features', 'social'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-6 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={settings.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="SAR">SAR - Saudi Riyal</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="AED">AED - UAE Dirham</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.tax_rate}
                    onChange={(e) => handleChange('tax_rate', parseFloat(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                  <select
                    value={settings.language}
                    onChange={(e) => handleChange('language', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="en">English</option>
                    <option value="ar">Arabic</option>
                    <option value="en,ar">Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => handleChange('timezone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Asia/Riyadh">Asia/Riyadh</option>
                    <option value="Asia/Dubai">Asia/Dubai</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="America/New_York">America/New York</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Logo Settings */}
          {activeTab === 'logo' && (
            <div className="space-y-6">
              <LogoSettings />
            </div>
          )}

          {/* SEO Settings */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">SEO & Meta Tags</h3>
                <p className="text-sm text-gray-600">
                  Optimize your restaurant's search engine visibility and social media sharing appearance.
                </p>
              </div>

              {/* Meta Title */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Page Title</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title (English)
                    </label>
                    <input
                      type="text"
                      value={settings.meta_title_en || ''}
                      onChange={(e) => handleChange('meta_title_en', e.target.value)}
                      placeholder={`${settings.tenantName || 'Restaurant'} - Menu`}
                      maxLength={60}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {(settings.meta_title_en || '').length}/60 characters
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title (Arabic)
                    </label>
                    <input
                      type="text"
                      value={settings.meta_title_ar || ''}
                      onChange={(e) => handleChange('meta_title_ar', e.target.value)}
                      placeholder={`${settings.tenantName || 'مطعم'} - قائمة الطعام`}
                      maxLength={60}
                      dir="rtl"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {(settings.meta_title_ar || '').length}/60 characters
                    </p>
                  </div>
                </div>
              </div>

              {/* Meta Description */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Meta Description</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (English)
                    </label>
                    <textarea
                      value={settings.meta_description_en || ''}
                      onChange={(e) => handleChange('meta_description_en', e.target.value)}
                      placeholder="Describe your restaurant and menu for search engines..."
                      maxLength={160}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {(settings.meta_description_en || '').length}/160 characters
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Arabic)
                    </label>
                    <textarea
                      value={settings.meta_description_ar || ''}
                      onChange={(e) => handleChange('meta_description_ar', e.target.value)}
                      placeholder="وصف مطعمك وقائمة الطعام لمحركات البحث..."
                      maxLength={160}
                      rows={3}
                      dir="rtl"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {(settings.meta_description_ar || '').length}/160 characters
                    </p>
                  </div>
                </div>
              </div>

              {/* Keywords */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Keywords</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Keywords (English)
                    </label>
                    <textarea
                      value={settings.meta_keywords_en || ''}
                      onChange={(e) => handleChange('meta_keywords_en', e.target.value)}
                      placeholder="restaurant, menu, food, dining, cuisine (comma separated)"
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Keywords (Arabic)
                    </label>
                    <textarea
                      value={settings.meta_keywords_ar || ''}
                      onChange={(e) => handleChange('meta_keywords_ar', e.target.value)}
                      placeholder="مطعم، قائمة طعام، طعام، مأكولات (مفصولة بفواصل)"
                      rows={2}
                      dir="rtl"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Open Graph Image */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Social Media Preview Image</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Open Graph Image URL
                  </label>
                  <input
                    type="text"
                    value={settings.og_image_url || ''}
                    onChange={(e) => handleChange('og_image_url', e.target.value)}
                    placeholder="https://example.com/preview-image.jpg"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Recommended size: 1200x630 pixels. This image appears when your menu is shared on social media.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Display Settings */}
          {activeTab === 'display' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.primary_color}
                      onChange={(e) => handleChange('primary_color', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.primary_color}
                      onChange={(e) => handleChange('primary_color', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.secondary_color}
                      onChange={(e) => handleChange('secondary_color', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.secondary_color}
                      onChange={(e) => handleChange('secondary_color', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Menu Layout</label>
                  <select
                    value={settings.menu_layout}
                    onChange={(e) => handleChange('menu_layout', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="cards">Cards</option>
                    <option value="list">List</option>
                    <option value="compact">Compact</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Card Style</label>
                  <select
                    value={settings.card_style}
                    onChange={(e) => handleChange('card_style', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="modern">Modern</option>
                    <option value="classic">Classic</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.animation_enabled}
                    onChange={(e) => handleChange('animation_enabled', e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span className="text-sm text-gray-700">Enable animations</span>
                </label>
              </div>
            </div>
          )}

          {/* Feature Settings */}
          {activeTab === 'features' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Display Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'enable_search', label: 'Enable Search' },
                  { key: 'enable_reviews', label: 'Enable Reviews' },
                  { key: 'enable_ratings', label: 'Enable Ratings' },
                  { key: 'enable_nutritional_info', label: 'Show Nutritional Info' },
                  { key: 'enable_allergen_info', label: 'Show Allergen Info' },
                  { key: 'enable_sustainability_info', label: 'Show Sustainability Info' },
                  { key: 'enable_pairing_suggestions', label: 'Show Pairing Suggestions' },
                  { key: 'enable_ar_preview', label: 'Enable AR Preview' },
                  { key: 'enable_video_preview', label: 'Enable Video Preview' },
                  { key: 'enable_loyalty_points', label: 'Enable Loyalty Points' },
                  { key: 'quick_view_enabled', label: 'Enable Quick View' },
                  { key: 'comparison_enabled', label: 'Enable Comparison' },
                  { key: 'wishlist_enabled', label: 'Enable Wishlist' },
                  { key: 'social_sharing_enabled', label: 'Enable Social Sharing' },
                  { key: 'show_calories', label: 'Show Calories' },
                  { key: 'show_preparation_time', label: 'Show Preparation Time' },
                  { key: 'show_allergens', label: 'Show Allergens' },
                  { key: 'show_price_without_vat', label: 'Show Price Without VAT' },
                  { key: 'show_all_category', label: 'Show "All" Category' },
                  { key: 'show_include_vat', label: 'Show "Include VAT" Text' }
                ].map((feature) => (
                  <label key={feature.key} className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={settings[feature.key]}
                      onChange={(e) => handleChange(feature.key, e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span className="text-sm text-gray-700">{feature.label}</span>
                  </label>
                ))}
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">WhatsApp Ordering</h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.whatsapp_ordering_enabled}
                      onChange={(e) => handleChange('whatsapp_ordering_enabled', e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span className="text-sm text-gray-700">Enable WhatsApp Ordering</span>
                  </label>
                  {settings.whatsapp_ordering_enabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                      <input
                        type="text"
                        value={settings.whatsapp_number || ''}
                        onChange={(e) => handleChange('whatsapp_number', e.target.value)}
                        placeholder="+966xxxxxxxxx"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Social Settings */}
          {activeTab === 'social' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                  <input
                    type="url"
                    value={settings.website_url || ''}
                    onChange={(e) => handleChange('website_url', e.target.value)}
                    placeholder="https://yourrestaurant.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instagram Handle</label>
                  <input
                    type="text"
                    value={settings.instagram_handle || ''}
                    onChange={(e) => handleChange('instagram_handle', e.target.value)}
                    placeholder="@yourrestaurant"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">TikTok Handle</label>
                  <input
                    type="text"
                    value={settings.tiktok_handle || ''}
                    onChange={(e) => handleChange('tiktok_handle', e.target.value)}
                    placeholder="@yourrestaurant"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Hero Section</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hero Subtitle (English)</label>
                    <textarea
                      value={settings.hero_subtitle_en || ''}
                      onChange={(e) => handleChange('hero_subtitle_en', e.target.value)}
                      rows={2}
                      placeholder="Discover our exquisite selection..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hero Subtitle (Arabic)</label>
                    <textarea
                      value={settings.hero_subtitle_ar || ''}
                      onChange={(e) => handleChange('hero_subtitle_ar', e.target.value)}
                      rows={2}
                      dir="rtl"
                      placeholder="اكتشف تشكيلتنا الرائعة..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <h3 className="text-lg font-medium text-gray-900 mb-4">Footer Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Footer Tagline (English)</label>
                    <textarea
                      value={settings.footer_tagline_en || ''}
                      onChange={(e) => handleChange('footer_tagline_en', e.target.value)}
                      rows={2}
                      placeholder="Authentic French dining experience..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Footer Tagline (Arabic)</label>
                    <textarea
                      value={settings.footer_tagline_ar || ''}
                      onChange={(e) => handleChange('footer_tagline_ar', e.target.value)}
                      rows={2}
                      dir="rtl"
                      placeholder="تجربة طعام فرنسية أصيلة..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                
                <label className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    checked={settings.footer_enabled}
                    onChange={(e) => handleChange('footer_enabled', e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span className="text-sm text-gray-700">Enable Custom Footer</span>
                </label>
                {settings.footer_enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Footer Text (English)</label>
                      <textarea
                        value={settings.footer_text_en || ''}
                        onChange={(e) => handleChange('footer_text_en', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Footer Text (Arabic)</label>
                      <textarea
                        value={settings.footer_text_ar || ''}
                        onChange={(e) => handleChange('footer_text_ar', e.target.value)}
                        rows={3}
                        dir="rtl"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;