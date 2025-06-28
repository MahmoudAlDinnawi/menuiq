import React, { useState, useEffect } from 'react';
import tenantAPI from '../services/tenantApiV2';

const MenuCardEditor = ({ item, categories, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    name_ar: '',
    description: '',
    description_ar: '',
    category_id: '',
    price: '',
    price_without_vat: '',
    promotion_price: '',
    image: '',
    
    // Badge & Highlights
    badge_text: '',
    badge_color: '#EF4444',
    highlight_message: '',
    
    // Availability
    is_available: true,
    is_featured: false,
    signature_dish: false,
    instagram_worthy: false,
    limited_availability: false,
    pre_order_required: false,
    min_order_quantity: 1,
    max_daily_orders: '',
    
    // Dietary Info
    halal: true,
    vegetarian: false,
    vegan: false,
    gluten_free: false,
    dairy_free: false,
    nut_free: false,
    organic_certified: false,
    local_ingredients: false,
    fair_trade: false,
    
    // Warnings
    is_spicy: false,
    spicy_level: 0,
    high_sodium: false,
    contains_caffeine: false,
    
    // Culinary Details
    cooking_method: '',
    origin_country: '',
    texture_notes: '',
    flavor_profile: '',
    plating_style: '',
    recommended_time: '',
    seasonal_availability: '',
    portion_size: '',
    
    // Pairings
    pairing_suggestions: '',
    wine_pairing: '',
    beer_pairing: '',
    cocktail_pairing: '',
    mocktail_pairing: '',
    chef_notes: '',
    customization_options: '',
    
    // Time & Exercise
    preparation_time: '',
    walk_minutes: '',
    run_minutes: '',
    
    // Nutrition
    calories: '',
    serving_size: '',
    ingredients: '',
    total_fat: '',
    saturated_fat: '',
    trans_fat: '',
    cholesterol: '',
    sodium: '',
    total_carbs: '',
    dietary_fiber: '',
    sugars: '',
    protein: '',
    vitamin_a: '',
    vitamin_c: '',
    calcium: '',
    iron: '',
    
    // Sustainability
    carbon_footprint: '',
    sustainability_info: '',
    
    // Recognition
    michelin_recommended: false,
    award_winning: false,
    reward_points: 0,
    
    // Promotion
    promotion_start_date: '',
    promotion_end_date: '',
    
    // Media
    video_url: '',
    ar_model_url: '',
    
    // Metadata
    sort_order: 0,
    tags: []
  });

  useEffect(() => {
    if (item) {
      setFormData({
        ...formData,
        ...item,
        category_id: item.category_id || '',
        price: item.price || '',
        tags: item.tags || []
      });
      if (item.image) {
        setImagePreview(item.image);
      }
    }
  }, [item]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'item');

    try {
      const response = await tenantAPI.post('/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, image: response.data.url }));
      setImagePreview(response.data.url);
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare data
      const submitData = {
        ...formData,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        price: formData.price ? parseFloat(formData.price) : null,
        price_without_vat: formData.price_without_vat ? parseFloat(formData.price_without_vat) : null,
        promotion_price: formData.promotion_price ? parseFloat(formData.promotion_price) : null,
        calories: formData.calories ? parseInt(formData.calories) : null,
        preparation_time: formData.preparation_time ? parseInt(formData.preparation_time) : null,
        walk_minutes: formData.walk_minutes ? parseInt(formData.walk_minutes) : null,
        run_minutes: formData.run_minutes ? parseInt(formData.run_minutes) : null,
        min_order_quantity: formData.min_order_quantity ? parseInt(formData.min_order_quantity) : 1,
        max_daily_orders: formData.max_daily_orders ? parseInt(formData.max_daily_orders) : null,
        reward_points: formData.reward_points ? parseInt(formData.reward_points) : 0,
        spicy_level: formData.spicy_level ? parseInt(formData.spicy_level) : 0,
        total_fat: formData.total_fat ? parseFloat(formData.total_fat) : null,
        saturated_fat: formData.saturated_fat ? parseFloat(formData.saturated_fat) : null,
        trans_fat: formData.trans_fat ? parseFloat(formData.trans_fat) : null,
        cholesterol: formData.cholesterol ? parseInt(formData.cholesterol) : null,
        sodium: formData.sodium ? parseInt(formData.sodium) : null,
        total_carbs: formData.total_carbs ? parseFloat(formData.total_carbs) : null,
        dietary_fiber: formData.dietary_fiber ? parseFloat(formData.dietary_fiber) : null,
        sugars: formData.sugars ? parseFloat(formData.sugars) : null,
        protein: formData.protein ? parseFloat(formData.protein) : null,
        vitamin_a: formData.vitamin_a ? parseInt(formData.vitamin_a) : null,
        vitamin_c: formData.vitamin_c ? parseInt(formData.vitamin_c) : null,
        calcium: formData.calcium ? parseInt(formData.calcium) : null,
        iron: formData.iron ? parseInt(formData.iron) : null
      };

      await onSave(submitData);
    } catch (error) {
      console.error('Failed to save item:', error);
      alert('Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: '📝' },
    { id: 'dietary', label: 'Dietary & Allergens', icon: '🥗' },
    { id: 'culinary', label: 'Culinary Details', icon: '👨‍🍳' },
    { id: 'nutrition', label: 'Nutrition', icon: '📊' },
    { id: 'marketing', label: 'Marketing', icon: '📣' },
    { id: 'media', label: 'Media & Display', icon: '📸' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">
              {item ? 'Edit Menu Item' : 'Create Menu Item'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-4 mt-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-white text-indigo-600 shadow-lg' 
                    : 'text-white/80 hover:bg-white/20'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item Image</label>
                <div className="flex items-center gap-4">
                  {imagePreview && (
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors inline-flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Upload Image
                    </label>
                  </div>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name (English) *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name (Arabic)</label>
                  <input
                    type="text"
                    value={formData.name_ar}
                    onChange={(e) => handleChange('name_ar', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Description Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (English)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Arabic)</label>
                  <textarea
                    value={formData.description_ar}
                    onChange={(e) => handleChange('description_ar', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Category and Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => handleChange('category_id', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (SAR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price without VAT</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price_without_vat}
                    onChange={(e) => handleChange('price_without_vat', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Promo Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.promotion_price}
                    onChange={(e) => handleChange('promotion_price', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Availability Options */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Availability & Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[
                    { key: 'is_available', label: 'Available' },
                    { key: 'is_featured', label: 'Featured' },
                    { key: 'signature_dish', label: 'Signature Dish' },
                    { key: 'instagram_worthy', label: 'Instagram Worthy' },
                    { key: 'limited_availability', label: 'Limited Availability' },
                    { key: 'pre_order_required', label: 'Pre-order Required' }
                  ].map((option) => (
                    <label key={option.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData[option.key]}
                        onChange={(e) => handleChange(option.key, e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Order Limits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.min_order_quantity}
                    onChange={(e) => handleChange('min_order_quantity', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Daily Orders</label>
                  <input
                    type="number"
                    value={formData.max_daily_orders}
                    onChange={(e) => handleChange('max_daily_orders', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Leave empty for unlimited"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Dietary Tab */}
          {activeTab === 'dietary' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Dietary Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: 'halal', label: 'Halal', icon: '🥩' },
                    { key: 'vegetarian', label: 'Vegetarian', icon: '🥗' },
                    { key: 'vegan', label: 'Vegan', icon: '🌱' },
                    { key: 'gluten_free', label: 'Gluten Free', icon: '🌾' },
                    { key: 'dairy_free', label: 'Dairy Free', icon: '🥛' },
                    { key: 'nut_free', label: 'Nut Free', icon: '🥜' },
                    { key: 'organic_certified', label: 'Organic', icon: '🌿' },
                    { key: 'local_ingredients', label: 'Local Ingredients', icon: '📍' },
                    { key: 'fair_trade', label: 'Fair Trade', icon: '🤝' }
                  ].map((option) => (
                    <label key={option.key} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData[option.key]}
                        onChange={(e) => handleChange(option.key, e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-lg">{option.icon}</span>
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Warnings & Allergens</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_spicy}
                        onChange={(e) => handleChange('is_spicy', e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Spicy</span>
                    </label>
                    {formData.is_spicy && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">Level:</span>
                        <div className="flex gap-1">
                          {[1, 2, 3].map((level) => (
                            <button
                              key={level}
                              type="button"
                              onClick={() => handleChange('spicy_level', level)}
                              className={`text-2xl ${level <= formData.spicy_level ? 'text-orange-500' : 'text-gray-300'}`}
                            >
                              🌶️
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.high_sodium}
                      onChange={(e) => handleChange('high_sodium', e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">High Sodium Content</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.contains_caffeine}
                      onChange={(e) => handleChange('contains_caffeine', e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Contains Caffeine</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients List</label>
                <textarea
                  value={formData.ingredients}
                  onChange={(e) => handleChange('ingredients', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="List all ingredients, separated by commas"
                />
              </div>
            </div>
          )}

          {/* Culinary Tab */}
          {activeTab === 'culinary' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cooking Method</label>
                  <input
                    type="text"
                    value={formData.cooking_method}
                    onChange={(e) => handleChange('cooking_method', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Grilled, Steamed, Fried"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country of Origin</label>
                  <input
                    type="text"
                    value={formData.origin_country}
                    onChange={(e) => handleChange('origin_country', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., France, Italy, Japan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Texture Notes</label>
                  <input
                    type="text"
                    value={formData.texture_notes}
                    onChange={(e) => handleChange('texture_notes', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Crispy outside, tender inside"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Flavor Profile</label>
                  <input
                    type="text"
                    value={formData.flavor_profile}
                    onChange={(e) => handleChange('flavor_profile', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Sweet and savory"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plating Style</label>
                  <select
                    value={formData.plating_style}
                    onChange={(e) => handleChange('plating_style', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select style</option>
                    <option value="modern">Modern</option>
                    <option value="traditional">Traditional</option>
                    <option value="minimalist">Minimalist</option>
                    <option value="rustic">Rustic</option>
                    <option value="elegant">Elegant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recommended Time</label>
                  <select
                    value={formData.recommended_time}
                    onChange={(e) => handleChange('recommended_time', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Any time</option>
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="brunch">Brunch</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Portion Size</label>
                  <input
                    type="text"
                    value={formData.portion_size}
                    onChange={(e) => handleChange('portion_size', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., For 2 people"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Pairing Suggestions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wine Pairing</label>
                    <input
                      type="text"
                      value={formData.wine_pairing}
                      onChange={(e) => handleChange('wine_pairing', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g., Chardonnay, Pinot Noir"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Beer Pairing</label>
                    <input
                      type="text"
                      value={formData.beer_pairing}
                      onChange={(e) => handleChange('beer_pairing', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g., IPA, Wheat Beer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cocktail Pairing</label>
                    <input
                      type="text"
                      value={formData.cocktail_pairing}
                      onChange={(e) => handleChange('cocktail_pairing', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g., Mojito, Margarita"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mocktail Pairing</label>
                    <input
                      type="text"
                      value={formData.mocktail_pairing}
                      onChange={(e) => handleChange('mocktail_pairing', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g., Virgin Mojito"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chef's Notes</label>
                <textarea
                  value={formData.chef_notes}
                  onChange={(e) => handleChange('chef_notes', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Special preparation tips or serving suggestions from the chef"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customization Options</label>
                <textarea
                  value={formData.customization_options}
                  onChange={(e) => handleChange('customization_options', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Extra cheese, No onions, Spice level adjustable"
                />
              </div>
            </div>
          )}

          {/* Nutrition Tab */}
          {activeTab === 'nutrition' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Calories</label>
                  <input
                    type="number"
                    value={formData.calories}
                    onChange={(e) => handleChange('calories', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Serving Size</label>
                  <input
                    type="text"
                    value={formData.serving_size}
                    onChange={(e) => handleChange('serving_size', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., 250g, 1 cup"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preparation Time (min)</label>
                  <input
                    type="number"
                    value={formData.preparation_time}
                    onChange={(e) => handleChange('preparation_time', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Exercise Equivalents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Walking Minutes 🚶</label>
                    <input
                      type="number"
                      value={formData.walk_minutes}
                      onChange={(e) => handleChange('walk_minutes', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Minutes to burn calories"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Running Minutes 🏃</label>
                    <input
                      type="number"
                      value={formData.run_minutes}
                      onChange={(e) => handleChange('run_minutes', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Minutes to burn calories"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Detailed Nutrition Facts</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Fat (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.total_fat}
                      onChange={(e) => handleChange('total_fat', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Saturated Fat (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.saturated_fat}
                      onChange={(e) => handleChange('saturated_fat', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trans Fat (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.trans_fat}
                      onChange={(e) => handleChange('trans_fat', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cholesterol (mg)</label>
                    <input
                      type="number"
                      value={formData.cholesterol}
                      onChange={(e) => handleChange('cholesterol', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sodium (mg)</label>
                    <input
                      type="number"
                      value={formData.sodium}
                      onChange={(e) => handleChange('sodium', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Carbs (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.total_carbs}
                      onChange={(e) => handleChange('total_carbs', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Fiber (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.dietary_fiber}
                      onChange={(e) => handleChange('dietary_fiber', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sugars (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.sugars}
                      onChange={(e) => handleChange('sugars', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Protein (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.protein}
                      onChange={(e) => handleChange('protein', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Vitamins & Minerals (% Daily Value)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vitamin A</label>
                    <input
                      type="number"
                      value={formData.vitamin_a}
                      onChange={(e) => handleChange('vitamin_a', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="%"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vitamin C</label>
                    <input
                      type="number"
                      value={formData.vitamin_c}
                      onChange={(e) => handleChange('vitamin_c', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="%"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Calcium</label>
                    <input
                      type="number"
                      value={formData.calcium}
                      onChange={(e) => handleChange('calcium', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="%"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Iron</label>
                    <input
                      type="number"
                      value={formData.iron}
                      onChange={(e) => handleChange('iron', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="%"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Sustainability</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Carbon Footprint</label>
                    <select
                      value={formData.carbon_footprint}
                      onChange={(e) => handleChange('carbon_footprint', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Not specified</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sustainability Info</label>
                    <textarea
                      value={formData.sustainability_info}
                      onChange={(e) => handleChange('sustainability_info', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g., Locally sourced, sustainable farming practices"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Marketing Tab */}
          {activeTab === 'marketing' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Badge & Highlights</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Badge Text</label>
                    <input
                      type="text"
                      value={formData.badge_text}
                      onChange={(e) => handleChange('badge_text', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g., New, Popular, Chef's Special"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Badge Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.badge_color}
                        onChange={(e) => handleChange('badge_color', e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.badge_color}
                        onChange={(e) => handleChange('badge_color', e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reward Points</label>
                    <input
                      type="number"
                      value={formData.reward_points}
                      onChange={(e) => handleChange('reward_points', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Highlight Message</label>
                <textarea
                  value={formData.highlight_message}
                  onChange={(e) => handleChange('highlight_message', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Special promotional message"
                />
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Recognition</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.michelin_recommended}
                      onChange={(e) => handleChange('michelin_recommended', e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Michelin Recommended</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.award_winning}
                      onChange={(e) => handleChange('award_winning', e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Award Winning</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Promotions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Promotion Start Date</label>
                    <input
                      type="date"
                      value={formData.promotion_start_date}
                      onChange={(e) => handleChange('promotion_start_date', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Promotion End Date</label>
                    <input
                      type="date"
                      value={formData.promotion_end_date}
                      onChange={(e) => handleChange('promotion_end_date', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (for search)</label>
                <input
                  type="text"
                  value={formData.tags.join(', ')}
                  onChange={(e) => handleChange('tags', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter tags separated by commas"
                />
              </div>
            </div>
          )}

          {/* Media Tab */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Additional Media</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
                    <input
                      type="url"
                      value={formData.video_url}
                      onChange={(e) => handleChange('video_url', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="YouTube or Vimeo URL"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">AR Model URL</label>
                    <input
                      type="url"
                      value={formData.ar_model_url}
                      onChange={(e) => handleChange('ar_model_url', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="3D model URL for AR preview"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => handleChange('sort_order', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Lower numbers appear first"
                />
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {item ? 'Update Item' : 'Create Item'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuCardEditor;