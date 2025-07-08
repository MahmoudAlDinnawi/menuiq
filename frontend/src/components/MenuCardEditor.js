import React, { useState, useEffect, useRef } from 'react';
import tenantAPI from '../services/tenantApiV2';
import AllergenSVGIcon from './AllergenSVGIcon';
import '../styles/MenuCardEditor.css';

/**
 * MenuCardEditor Component
 * 
 * A comprehensive form component for creating and editing menu items.
 * Supports both single items and multi-items with sub-items.
 * 
 * Features:
 * - Multi-tab interface for organizing fields
 * - Form validation with real-time error feedback
 * - Progress tracking for form completion
 * - Drag-and-drop image upload
 * - Multi-item support with sub-item selection
 * - Allergen selection with visual icons
 * - VAT calculation
 * - Upsell configuration
 * 
 * @param {Object} props
 * @param {Object|null} props.item - Existing item to edit, null for new items
 * @param {boolean} props.isCreatingMultiItem - Flag indicating if creating a multi-item
 * @param {Array} props.categories - List of available categories
 * @param {Function} props.onSave - Callback when item is saved
 * @param {Function} props.onClose - Callback to close the editor
 * @param {Object} props.settings - Tenant settings for defaults and configuration
 */
const MenuCardEditor = ({ item, isCreatingMultiItem, categories, onSave, onClose, settings }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [allergenIcons, setAllergenIcons] = useState([]);
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [availableItems, setAvailableItems] = useState([]);
  const [errors, setErrors] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const [formProgress, setFormProgress] = useState(0);
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
    caffeine_mg: '',
    vitamin_d: '',
    
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
    tags: [],
    
    // Allergens
    allergen_ids: [],
    
    // Upsell Design
    is_upsell: false,
    upsell_style: settings?.upsell_default_style || 'premium',
    upsell_border_color: settings?.upsell_default_border_color || '#FFD700',
    upsell_background_color: settings?.upsell_default_background_color || '#FFF8DC',
    upsell_badge_text: '',
    upsell_badge_color: settings?.upsell_default_badge_color || '#FF6B6B',
    upsell_animation: settings?.upsell_default_animation || 'pulse',
    
    // Multi-item fields
    is_multi_item: isCreatingMultiItem || false,
    display_as_grid: true,
    sub_items: [],
    upsell_icon: settings?.upsell_default_icon || 'star'
  });

  useEffect(() => {
    fetchAllergenIcons();
    if (item) {
      // Extract allergen IDs from item.allergens array
      const allergenIds = item.allergens ? item.allergens.map(a => 
        typeof a === 'object' ? a.id : a
      ) : [];
      
      // Clean item data to ensure no null values
      const cleanedItem = Object.keys(item).reduce((acc, key) => {
        acc[key] = item[key] === null ? '' : item[key];
        return acc;
      }, {});
      
      setFormData(prevData => ({
        ...prevData,
        ...cleanedItem,
        category_id: item.category_id || '',
        price: item.price === null || item.price === undefined ? '' : item.price,
        price_without_vat: item.price_without_vat === null || item.price_without_vat === undefined ? '' : item.price_without_vat,
        promotion_price: item.promotion_price === null || item.promotion_price === undefined ? '' : item.promotion_price,
        tags: item.tags || [],
        allergen_ids: allergenIds,
        // Ensure upsell fields have defaults
        upsell_style: item.upsell_style || settings?.upsell_default_style || 'premium',
        upsell_border_color: item.upsell_border_color || settings?.upsell_default_border_color || '#FFD700',
        upsell_background_color: item.upsell_background_color || settings?.upsell_default_background_color || '#FFF8DC',
        upsell_badge_text: item.upsell_badge_text || '',
        upsell_badge_color: item.upsell_badge_color || settings?.upsell_default_badge_color || '#FF6B6B',
        upsell_animation: item.upsell_animation || settings?.upsell_default_animation || 'pulse',
        upsell_icon: item.upsell_icon || settings?.upsell_default_icon || 'star',
        // Multi-item fields
        is_multi_item: item.is_multi_item || false,
        display_as_grid: item.display_as_grid !== undefined ? item.display_as_grid : true,
        sub_items: item.sub_items || []
      }));
      if (item.image) {
        setImagePreview(item.image);
      }
    }
  }, [item, settings]);

  useEffect(() => {
    if (formData.is_multi_item && showItemSelector) {
      fetchAvailableItems();
    }
  }, [formData.is_multi_item, showItemSelector]);

  /**
   * Fetch allergen icons from the API
   * Falls back to default icons if API fails or returns empty
   */
  const fetchAllergenIcons = async () => {
    try {
      const response = await tenantAPI.get('/allergen-icons');
      // Process allergen icons response
      
      // Handle different response formats
      let icons = [];
      if (Array.isArray(response.data)) {
        icons = response.data;
      } else if (response.data && Array.isArray(response.data.allergens)) {
        icons = response.data.allergens;
      } else if (response.data && Array.isArray(response.data.data)) {
        icons = response.data.data;
      }
      
      // If no icons returned from API, use defaults
      if (icons.length === 0) {
        // Use default allergen icons
        icons = [
          { id: 1, display_name: 'Milk', display_name_ar: 'حليب', icon_url: '/src/assets/allergy_icons/milk.svg' },
          { id: 2, display_name: 'Egg', display_name_ar: 'بيض', icon_url: '/src/assets/allergy_icons/egg.svg' },
          { id: 3, display_name: 'Fish', display_name_ar: 'سمك', icon_url: '/src/assets/allergy_icons/fish.svg' },
          { id: 4, display_name: 'Gluten', display_name_ar: 'جلوتين', icon_url: '/src/assets/allergy_icons/gulten.svg' },
          { id: 5, display_name: 'Shellfish', display_name_ar: 'محار', icon_url: '/src/assets/allergy_icons/Shellfish.svg' },
          { id: 6, display_name: 'Soy', display_name_ar: 'فول الصويا', icon_url: '/src/assets/allergy_icons/soy.svg' },
          { id: 7, display_name: 'Sesame', display_name_ar: 'سمسم', icon_url: '/src/assets/allergy_icons/sesame.svg' },
          { id: 8, display_name: 'Salt', display_name_ar: 'ملح', icon_url: '/src/assets/allergy_icons/salt.svg' },
          { id: 9, display_name: 'Mustard', display_name_ar: 'خردل', icon_url: '/src/assets/allergy_icons/mustard.svg' }
        ];
      }
      
      setAllergenIcons(icons);
    } catch (error) {
      console.error('Failed to fetch allergen icons:', error);
      // Set default allergen icons if API fails
      setAllergenIcons([
        { id: 1, display_name: 'Milk', display_name_ar: 'حليب', icon_url: '/src/assets/allergy_icons/milk.svg' },
        { id: 2, display_name: 'Egg', display_name_ar: 'بيض', icon_url: '/src/assets/allergy_icons/egg.svg' },
        { id: 3, display_name: 'Fish', display_name_ar: 'سمك', icon_url: '/src/assets/allergy_icons/fish.svg' },
        { id: 4, display_name: 'Gluten', display_name_ar: 'جلوتين', icon_url: '/src/assets/allergy_icons/gulten.svg' },
        { id: 5, display_name: 'Shellfish', display_name_ar: 'محار', icon_url: '/src/assets/allergy_icons/Shellfish.svg' },
        { id: 6, display_name: 'Soy', display_name_ar: 'فول الصويا', icon_url: '/src/assets/allergy_icons/soy.svg' },
        { id: 7, display_name: 'Sesame', display_name_ar: 'سمسم', icon_url: '/src/assets/allergy_icons/sesame.svg' },
        { id: 8, display_name: 'Salt', display_name_ar: 'ملح', icon_url: '/src/assets/allergy_icons/salt.svg' },
        { id: 9, display_name: 'Mustard', display_name_ar: 'خردل', icon_url: '/src/assets/allergy_icons/mustard.svg' }
      ]);
    }
  };

  /**
   * Handle image file upload
   * @param {Event} e - File input change event
   */
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    handleImageFile(file);
  };

  /**
   * Handle form submission
   * Validates required fields and saves the item
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.name.trim()) {
      alert('Please enter item name');
      return;
    }
    
    if (!formData.category_id) {
      alert('Please select a category');
      return;
    }
    
    // For non-multi-items, price is required
    if (!formData.is_multi_item && !formData.price) {
      alert('Please enter price');
      return;
    }
    
    // For multi-items, at least one sub-item is required
    if (formData.is_multi_item && (!formData.sub_items || formData.sub_items.length === 0)) {
      alert('Please select at least one sub-item for the multi-item');
      return;
    }
    
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
        vitamin_d: formData.vitamin_d ? parseInt(formData.vitamin_d) : null,
        calcium: formData.calcium ? parseInt(formData.calcium) : null,
        iron: formData.iron ? parseInt(formData.iron) : null,
        caffeine_mg: formData.caffeine_mg ? parseInt(formData.caffeine_mg) : null,
        allergen_ids: formData.allergen_ids,
        // Multi-item fields
        is_multi_item: formData.is_multi_item,
        display_as_grid: formData.display_as_grid,
        // Send sub-item IDs to link in the backend
        sub_item_ids: formData.is_multi_item ? formData.sub_items.map(item => item.id) : []
      };

      // Override price for multi-items (will be calculated from sub-items)
      if (formData.is_multi_item) {
        submitData.price = null;
      }

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

  const removeSubItem = (itemId) => {
    setFormData(prev => ({
      ...prev,
      sub_items: prev.sub_items.filter(item => item.id !== itemId)
    }));
  };

  const fetchAvailableItems = async () => {
    try {
      const response = await tenantAPI.get('/menu-items');
      // Filter out multi-items and the current item being edited
      const filtered = response.data.filter(menuItem => 
        !menuItem.is_multi_item && 
        menuItem.id !== item?.id &&
        !menuItem.parent_item_id // Don't show items that are already sub-items
      );
      setAvailableItems(filtered);
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
    }
  };

  // Define tabs based on whether it's a multi-item
  const isMultiItem = formData.is_multi_item;
  
  const tabs = isMultiItem ? [
    // Multi-items only show Basic, Dietary, and Upsell tabs
    { id: 'basic', label: 'Basic', icon: '📝', description: 'Name, category, sub-items' },
    { id: 'dietary', label: 'Dietary', icon: '🥗', description: 'Allergens & restrictions' },
    ...(settings?.upsell_enabled !== false ? [{ id: 'upsell', label: 'Upsell', icon: '⭐', description: 'Highlight this item' }] : [])
  ] : [
    // Single items show all tabs except multi-item
    { id: 'basic', label: 'Basic', icon: '📝', description: 'Name, price, category' },
    { id: 'features', label: 'Features', icon: '✨', description: 'Special badges & availability' },
    { id: 'dietary', label: 'Dietary', icon: '🥗', description: 'Allergens & restrictions' },
    { id: 'nutrition', label: 'Nutrition', icon: '📊', description: 'Calories & nutrients' },
    { id: 'details', label: 'Details', icon: '📖', description: 'Descriptions & pairings' },
    { id: 'media', label: 'Media', icon: '📸', description: 'Images & videos' },
    ...(settings?.upsell_enabled !== false ? [{ id: 'upsell', label: 'Upsell', icon: '⭐', description: 'Highlight this item' }] : [])
  ];

  // Calculate form completion progress
  useEffect(() => {
    const requiredFields = isMultiItem ? ['name', 'category_id'] : ['name', 'category_id', 'price'];
    const filledFields = requiredFields.filter(field => formData[field]);
    const progress = (filledFields.length / requiredFields.length) * 100;
    setFormProgress(progress);
  }, [formData, isMultiItem]);

  // Validate field
  const validateField = (field, value) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'name':
        if (!value || !value.trim()) {
          newErrors.name = 'Item name is required';
        } else {
          delete newErrors.name;
        }
        break;
      case 'price':
        if (!isMultiItem && (!value || parseFloat(value) <= 0)) {
          newErrors.price = 'Valid price is required';
        } else {
          delete newErrors.price;
        }
        break;
      case 'category_id':
        if (!value) {
          newErrors.category_id = 'Category is required';
        } else {
          delete newErrors.category_id;
        }
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
  };

  // Handle drag and drop
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleImageFile(files[0]);
    }
  };

  const handleImageFile = async (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await tenantAPI.post('/upload/menu-item', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, image: response.data.url }));
      setImagePreview(response.data.url);
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                {isMultiItem ? (
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                ) : (
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {item ? `Edit ${isMultiItem ? 'Multi-Item' : 'Item'}` : `Create ${isMultiItem ? 'Multi-Item' : 'Item'}`}
                </h2>
                <p className="text-indigo-100 text-sm">
                  {isMultiItem ? 'Configure item variations and options' : 'Add details for your menu item'}
                </p>
              </div>
              {isMultiItem && (
                <div className="multi-item-indicator">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Multi-Item
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-110"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Tabs */}
          <div className="tabs-container flex gap-3 mt-6 overflow-x-auto pb-2 px-6 -mx-6">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-button group relative px-5 py-3 rounded-xl transition-all duration-200 whitespace-nowrap transform hover:scale-105 ${
                  activeTab === tab.id 
                    ? 'bg-white text-indigo-600 shadow-xl scale-105' 
                    : 'text-white/80 hover:bg-white/20'
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{tab.icon}</span>
                  <div className="text-left">
                    <span className="font-semibold block">{tab.label}</span>
                    <span className={`text-xs ${activeTab === tab.id ? 'text-indigo-500' : 'text-white/60'}`}>
                      {tab.description}
                    </span>
                  </div>
                </div>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-full" />
                )}
              </button>
            ))}
          </div>
          
          {/* Progress Bar */}
          <div className="form-progress">
            <div className="form-progress-bar" style={{ width: `${formProgress}%` }} />
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto max-h-[calc(90vh-220px)] custom-scrollbar">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              {/* Image Upload */}
              <div className="form-field">
                <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  Item Image
                  <span className="field-tooltip ml-2 text-gray-400" data-tooltip="Upload a high-quality image of your item">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                </label>
                
                {imagePreview ? (
                  <div className="relative group">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full max-w-md h-64 object-cover rounded-2xl shadow-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-white text-gray-800 rounded-lg font-medium hover:bg-gray-100 transition-colors mr-2"
                      >
                        Change Image
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          handleChange('image', '');
                        }}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`image-upload-area ${isDragging ? 'dragging' : ''}`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-gray-600 font-medium mb-2">Drop your image here, or click to browse</p>
                    <p className="text-gray-400 text-sm">Supports: JPG, PNG, GIF (Max 5MB)</p>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
                  className="hidden"
                />
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-field">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Name (English) *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      handleChange('name', e.target.value);
                      validateField('name', e.target.value);
                    }}
                    onBlur={(e) => validateField('name', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${errors.name ? 'field-error border-red-400' : 'border-gray-200 hover:border-gray-300'}`}
                    placeholder="Enter item name"
                    required
                  />
                  {errors.name && (
                    <p className="error-message">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.name}
                    </p>
                  )}
                </div>
                <div className="form-field">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Name (Arabic)</label>
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
              <div className={`grid grid-cols-1 ${isMultiItem ? '' : 'md:grid-cols-4'} gap-4`}>
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
                {!isMultiItem && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price (SAR) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => handleChange('price', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
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
                  </>
                )}
              </div>

              {/* Sub-Items Section for Multi-Items */}
              {isMultiItem && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-gray-900">Sub-Items</h3>
                      <p className="text-sm text-gray-500">Select existing items to include as variations</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowItemSelector(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Items
                    </button>
                  </div>

                  {/* Selected Sub-Items List */}
                  {formData.sub_items && formData.sub_items.length > 0 ? (
                    <div className="space-y-2">
                      {formData.sub_items.map((subItem, index) => (
                        <div key={subItem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">#{index + 1}</span>
                            <div>
                              <p className="font-medium">{subItem.name}</p>
                              <p className="text-sm text-gray-500">{subItem.price} SAR</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSubItem(subItem.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <p className="text-gray-500">No sub-items added yet</p>
                      <p className="text-sm text-gray-400 mt-1">Click "Add Items" to select variations</p>
                    </div>
                  )}

                  {/* Price Range Display */}
                  {formData.price_min !== null && formData.price_max !== null && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        Price Range: <span className="font-semibold">{formData.price_min} - {formData.price_max} SAR</span>
                      </p>
                    </div>
                  )}
                </div>
              )}


            </div>
          )}

          {/* Features Tab */}
          {activeTab === 'features' && (
            <div className="space-y-6">
              {/* Badges and Highlights */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Badges & Highlights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Badge Text</label>
                    <input
                      type="text"
                      value={formData.badge_text}
                      onChange={(e) => handleChange('badge_text', e.target.value)}
                      placeholder="e.g., New, Popular, Limited"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Badge Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.badge_color}
                        onChange={(e) => handleChange('badge_color', e.target.value)}
                        className="h-10 w-20 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.badge_color}
                        onChange={(e) => handleChange('badge_color', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Highlight Message</label>
                  <textarea
                    value={formData.highlight_message}
                    onChange={(e) => handleChange('highlight_message', e.target.value)}
                    rows={2}
                    placeholder="Special message to display with this item"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Special Features */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Special Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { key: 'is_featured', label: 'Featured Item', icon: '⭐' },
                    { key: 'signature_dish', label: 'Signature Dish', icon: '👨‍🍳' },
                    { key: 'instagram_worthy', label: 'Instagram Worthy', icon: '📸' },
                    { key: 'michelin_recommended', label: 'Michelin Recommended', icon: '🌟' },
                    { key: 'award_winning', label: 'Award Winning', icon: '🏆' },
                    { key: 'best_seller_rank', label: 'Best Seller', icon: '🔥' }
                  ].map((feature) => (
                    <label key={feature.key} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData[feature.key] || false}
                        onChange={(e) => handleChange(feature.key, e.target.checked)}
                        className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-lg">{feature.icon}</span>
                      <span className="text-sm font-medium text-gray-700">{feature.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Availability Settings</h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.is_available}
                      onChange={(e) => handleChange('is_available', e.target.checked)}
                      className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-base font-medium text-gray-700 block">Currently Available</span>
                      <span className="text-sm text-gray-500">Uncheck to temporarily hide from menu</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.limited_availability}
                      onChange={(e) => handleChange('limited_availability', e.target.checked)}
                      className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-base font-medium text-gray-700 block">Limited Availability</span>
                      <span className="text-sm text-gray-500">Shows "While supplies last" message</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.pre_order_required}
                      onChange={(e) => handleChange('pre_order_required', e.target.checked)}
                      className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-base font-medium text-gray-700 block">Pre-order Required</span>
                      <span className="text-sm text-gray-500">Customer must order in advance</span>
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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

              {/* Promotions */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Promotions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Promotion Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.promotion_price}
                      onChange={(e) => handleChange('promotion_price', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Special offer price"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.promotion_start_date}
                      onChange={(e) => handleChange('promotion_start_date', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={formData.promotion_end_date}
                      onChange={(e) => handleChange('promotion_end_date', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
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
                <h3 className="text-lg font-medium text-gray-900 mb-3">Allergen Content</h3>
                <p className="text-sm text-gray-600 mb-4">Select all allergens that this item contains:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                  {allergenIcons.map((allergen) => {
                    const isSelected = formData.allergen_ids.includes(allergen.id);
                    const isEmoji = allergen.icon_url && allergen.icon_url.length <= 4 && !allergen.icon_url.startsWith('/');
                    const isSVG = allergen.icon_url && allergen.icon_url.endsWith('.svg');
                    const primaryColor = settings?.primaryColor || '#00594f';
                    
                    return (
                      <label
                        key={allergen.id}
                        className={`relative flex flex-col items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-gray-400 bg-gray-50' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleChange('allergen_ids', [...formData.allergen_ids, allergen.id]);
                            } else {
                              handleChange('allergen_ids', formData.allergen_ids.filter(id => id !== allergen.id));
                            }
                          }}
                          className="sr-only"
                        />
                        <div className="p-2 rounded-full">
                          {isSVG ? (
                            <AllergenSVGIcon 
                              iconPath={allergen.icon_url}
                              size="w-8 h-8"
                              primaryColor={isSelected ? primaryColor : '#6B7280'}
                            />
                          ) : isEmoji ? (
                            <span className="text-3xl">{allergen.icon_url}</span>
                          ) : (
                            <img 
                              src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${allergen.icon_url}`}
                              alt={allergen.display_name}
                              className="w-8 h-8 object-contain"
                            />
                          )}
                        </div>
                        <span className={`text-xs font-medium text-center ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                          {allergen.display_name}
                        </span>
                        {isSelected && (
                          <div 
                            className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Other Warnings</h3>
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

                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.contains_caffeine}
                        onChange={(e) => handleChange('contains_caffeine', e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Contains Caffeine</span>
                    </label>
                    {formData.contains_caffeine && (
                      <div className="ml-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Caffeine Amount (mg)</label>
                        <input
                          type="number"
                          value={formData.caffeine_mg}
                          onChange={(e) => handleChange('caffeine_mg', e.target.value)}
                          className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="e.g., 95 for coffee"
                        />
                      </div>
                    )}
                  </div>
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

          {/* Details Tab */}
          {activeTab === 'details' && (
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vitamin D</label>
                    <input
                      type="number"
                      value={formData.vitamin_d}
                      onChange={(e) => handleChange('vitamin_d', e.target.value)}
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

          {/* Upsell Tab */}
          {activeTab === 'upsell' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Upsell Settings</h3>
                <p className="text-sm text-gray-600 mb-4">Make this item stand out with special visual effects to increase sales.</p>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_upsell}
                    onChange={(e) => handleChange('is_upsell', e.target.checked)}
                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-base font-medium text-gray-700">Enable Upsell Design</span>
                </label>
                <p className="text-sm text-gray-500 mt-1">Highlight this item to increase sales with special visual effects</p>
              </div>

              {formData.is_upsell && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upsell Style</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { value: 'standard', label: 'Standard', icon: '⭐' },
                        { value: 'premium', label: 'Premium', icon: '👑' },
                        { value: 'deluxe', label: 'Deluxe', icon: '💎' },
                        { value: 'special', label: 'Special', icon: '🔥' }
                      ].map((style) => (
                        <label key={style.value} className="cursor-pointer">
                          <input
                            type="radio"
                            name="upsell_style"
                            value={style.value}
                            checked={formData.upsell_style === style.value}
                            onChange={(e) => handleChange('upsell_style', e.target.value)}
                            className="sr-only"
                          />
                          <div className={`p-4 border-2 rounded-lg text-center transition-all ${
                            formData.upsell_style === style.value
                              ? 'border-indigo-600 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}>
                            <span className="text-2xl">{style.icon}</span>
                            <p className="text-sm font-medium mt-1">{style.label}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Border Color</label>
                      <input
                        type="color"
                        value={formData.upsell_border_color}
                        onChange={(e) => handleChange('upsell_border_color', e.target.value)}
                        className="w-full h-10 rounded cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                      <input
                        type="color"
                        value={formData.upsell_background_color}
                        onChange={(e) => handleChange('upsell_background_color', e.target.value)}
                        className="w-full h-10 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Badge Text</label>
                      <input
                        type="text"
                        value={formData.upsell_badge_text}
                        onChange={(e) => handleChange('upsell_badge_text', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g., Chef's Special, Limited Time"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Badge Color</label>
                      <input
                        type="color"
                        value={formData.upsell_badge_color}
                        onChange={(e) => handleChange('upsell_badge_color', e.target.value)}
                        className="w-full h-10 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Animation Effect</label>
                    <select
                      value={formData.upsell_animation}
                      onChange={(e) => handleChange('upsell_animation', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="none">None</option>
                      <option value="pulse">Pulse</option>
                      <option value="glow">Glow</option>
                      <option value="shine">Shine</option>
                      <option value="bounce">Bounce</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                      {[
                        { value: 'star', icon: '⭐' },
                        { value: 'fire', icon: '🔥' },
                        { value: 'crown', icon: '👑' },
                        { value: 'diamond', icon: '💎' },
                        { value: 'rocket', icon: '🚀' },
                        { value: 'heart', icon: '❤️' },
                        { value: 'lightning', icon: '⚡' },
                        { value: 'trophy', icon: '🏆' }
                      ].map((icon) => (
                        <label key={icon.value} className="cursor-pointer">
                          <input
                            type="radio"
                            name="upsell_icon"
                            value={icon.value}
                            checked={formData.upsell_icon === icon.value}
                            onChange={(e) => handleChange('upsell_icon', e.target.value)}
                            className="sr-only"
                          />
                          <div className={`p-3 border-2 rounded text-center transition-all ${
                            formData.upsell_icon === icon.value
                              ? 'border-indigo-600 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}>
                            <span className="text-xl">{icon.icon}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Preview</h4>
                    <div className="bg-gray-100 p-6 rounded-lg">
                      <div 
                        className={`bg-white rounded-xl p-4 shadow-lg max-w-xs mx-auto relative ${
                          formData.upsell_animation === 'pulse' ? 'animate-pulse' : 
                          formData.upsell_animation === 'glow' ? 'upsell-glow' : 
                          formData.upsell_animation === 'shine' ? 'upsell-shine' : 
                          formData.upsell_animation === 'bounce' ? 'animate-bounce' : ''
                        }`}
                        style={{
                          borderWidth: '2px',
                          borderColor: formData.upsell_border_color || '#FFD700',
                          backgroundColor: formData.upsell_background_color || '#FFFFFF'
                        }}
                      >
                        {formData.upsell_badge_text && (
                          <div 
                            className="absolute -top-3 -right-3 px-3 py-1 rounded-full text-white text-sm font-bold shadow-md flex items-center gap-1"
                            style={{ backgroundColor: formData.upsell_badge_color || '#FF6B6B' }}
                          >
                            <span>{
                              formData.upsell_icon === 'star' ? '⭐' :
                              formData.upsell_icon === 'fire' ? '🔥' :
                              formData.upsell_icon === 'crown' ? '👑' :
                              formData.upsell_icon === 'diamond' ? '💎' :
                              formData.upsell_icon === 'rocket' ? '🚀' :
                              formData.upsell_icon === 'heart' ? '❤️' :
                              formData.upsell_icon === 'lightning' ? '⚡' :
                              formData.upsell_icon === 'trophy' ? '🏆' : '⭐'
                            }</span>
                            {formData.upsell_badge_text}
                          </div>
                        )}
                        <h5 className="font-semibold text-gray-900 mb-2">{formData.name || 'Menu Item Name'}</h5>
                        <p className="text-sm text-gray-600 mb-3">{formData.description || 'Item description...'}</p>
                        <p className="text-lg font-bold text-indigo-600">{formData.price ? `${formData.price} SAR` : 'Price'}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

        </form>

        {/* Footer */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 flex items-center justify-between border-t">
          <div className="flex items-center gap-4">
            {formProgress < 100 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>Complete all required fields</span>
              </div>
            )}
            {Object.keys(errors).length > 0 && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{Object.keys(errors).length} validation error{Object.keys(errors).length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || formProgress < 100 || Object.keys(errors).length > 0}
              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 transform ${
                loading || formProgress < 100 || Object.keys(errors).length > 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:scale-105'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  {item ? (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Update {isMultiItem ? 'Multi-Item' : 'Item'}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create {isMultiItem ? 'Multi-Item' : 'Item'}
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Item Selector Modal */}
      {showItemSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Select Items to Add</h3>
                <button
                  onClick={() => setShowItemSelector(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {availableItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableItems.map(menuItem => {
                    const isSelected = formData.sub_items.some(sub => sub.id === menuItem.id);
                    return (
                      <div
                        key={menuItem.id}
                        onClick={() => {
                          if (!isSelected) {
                            setFormData(prev => ({
                              ...prev,
                              sub_items: [...prev.sub_items, {
                                id: menuItem.id,
                                name: menuItem.name,
                                name_ar: menuItem.name_ar,
                                price: menuItem.price,
                                description: menuItem.description,
                                image: menuItem.image || menuItem.image_url
                              }]
                            }));
                          }
                        }}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {(menuItem.image || menuItem.image_url) && (
                            <img 
                              src={menuItem.image || menuItem.image_url} 
                              alt={menuItem.name}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {menuItem.name}
                              {menuItem.name_ar && <span className="text-gray-500 text-sm ml-2">({menuItem.name_ar})</span>}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">{menuItem.description}</p>
                            <p className="text-lg font-semibold text-indigo-600 mt-2">${menuItem.price}</p>
                          </div>
                          {isSelected && (
                            <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-gray-500">No available items found</p>
                  <p className="text-sm text-gray-400 mt-2">All items are either multi-items or already assigned</p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowItemSelector(false)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuCardEditor;