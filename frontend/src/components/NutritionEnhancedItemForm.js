import React, { useState, useEffect } from 'react';
import api from '../services/api';
import CustomAllergenIcons from './CustomAllergenIcons';

const NutritionEnhancedItemForm = ({ item, onSubmit, onCancel, categories }) => {
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    price: '',
    priceWithoutVat: '',
    description: '',
    descriptionAr: '',
    category: '',
    image: '',
    calories: '',
    walkMinutes: '',
    runMinutes: '',
    highSodium: false,
    glutenFree: false,
    dairyFree: false,
    nutFree: false,
    vegetarian: false,
    vegan: false,
    halal: true,
    containsCaffeine: false,
    allergens: [],
    spicyLevel: 0,
    preparationTime: '',
    servingSize: '',
    // Nutrition label fields
    totalFat: '',
    saturatedFat: '',
    transFat: '',
    cholesterol: '',
    sodium: '',
    totalCarbs: '',
    dietaryFiber: '',
    sugars: '',
    protein: '',
    vitaminA: '',
    vitaminC: '',
    calcium: '',
    iron: ''
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [allergenOptions, setAllergenOptions] = useState({});
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    loadAllergenOptions();
    if (item) {
      setFormData({
        ...item,
        price: item.price || '',
        priceWithoutVat: item.priceWithoutVat || '',
        allergens: item.allergens || [],
        // Nutrition fields
        totalFat: item.totalFat || '',
        saturatedFat: item.saturatedFat || '',
        transFat: item.transFat || '',
        cholesterol: item.cholesterol || '',
        sodium: item.sodium || '',
        totalCarbs: item.totalCarbs || '',
        dietaryFiber: item.dietaryFiber || '',
        sugars: item.sugars || '',
        protein: item.protein || '',
        vitaminA: item.vitaminA || '',
        vitaminC: item.vitaminC || '',
        calcium: item.calcium || '',
        iron: item.iron || ''
      });
      if (item.image) {
        setImagePreview(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${item.image}`);
      }
    }
  }, [item]);

  const loadAllergenOptions = async () => {
    try {
      const response = await api.get('/api/allergen-icons');
      const options = {};
      response.data.allergens.forEach(allergen => {
        options[allergen.name] = {
          name: allergen.display_name,
          nameAr: allergen.display_name_ar,
          iconUrl: `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${allergen.icon_url}`
        };
      });
      setAllergenOptions(options);
    } catch (error) {
      console.error('Error loading allergen options:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAllergenToggle = (allergen) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let imageUrl = formData.image;
      
      if (imageFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', imageFile);
        const uploadResponse = await api.post('/api/upload-image', formDataUpload, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        imageUrl = uploadResponse.data.url;
      }

      const submitData = {
        ...formData,
        image: imageUrl,
        calories: parseInt(formData.calories) || 0,
        walkMinutes: parseInt(formData.walkMinutes) || null,
        runMinutes: parseInt(formData.runMinutes) || null,
        preparationTime: parseInt(formData.preparationTime) || null,
        spicyLevel: parseInt(formData.spicyLevel) || 0,
        // Convert nutrition values
        totalFat: parseFloat(formData.totalFat) || null,
        saturatedFat: parseFloat(formData.saturatedFat) || null,
        transFat: parseFloat(formData.transFat) || null,
        cholesterol: parseInt(formData.cholesterol) || null,
        sodium: parseInt(formData.sodium) || null,
        totalCarbs: parseFloat(formData.totalCarbs) || null,
        dietaryFiber: parseFloat(formData.dietaryFiber) || null,
        sugars: parseFloat(formData.sugars) || null,
        protein: parseFloat(formData.protein) || null,
        vitaminA: parseInt(formData.vitaminA) || null,
        vitaminC: parseInt(formData.vitaminC) || null,
        calcium: parseInt(formData.calcium) || null,
        iron: parseInt(formData.iron) || null
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to save item. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Information' },
    { id: 'nutrition', label: 'Nutrition & Health' },
    { id: 'label', label: 'Nutrition Label' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Basic Information Tab */}
      {activeTab === 'basic' && (
        <div className="space-y-6">
          {/* Names */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name (English) *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name (Arabic)
              </label>
              <input
                type="text"
                name="nameAr"
                value={formData.nameAr}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                dir="rtl"
              />
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (with VAT) *
              </label>
              <input
                type="text"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                placeholder="e.g., 45 SAR"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (without VAT)
              </label>
              <input
                type="text"
                name="priceWithoutVat"
                value={formData.priceWithoutVat}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                placeholder="e.g., 39 SAR"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
              required
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Descriptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (English) *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Arabic)
              </label>
              <textarea
                name="descriptionAr"
                value={formData.descriptionAr}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                dir="rtl"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image
            </label>
            <input
              type="file"
              onChange={handleImageChange}
              accept="image/*"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
            />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="mt-4 w-32 h-32 object-cover rounded-lg"
              />
            )}
          </div>
        </div>
      )}

      {/* Nutrition & Health Tab */}
      {activeTab === 'nutrition' && (
        <div className="space-y-6">
          {/* Basic Nutrition */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calories *
              </label>
              <input
                type="number"
                name="calories"
                value={formData.calories}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Walk Minutes to Burn
              </label>
              <input
                type="number"
                name="walkMinutes"
                value={formData.walkMinutes}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Run Minutes to Burn
              </label>
              <input
                type="number"
                name="runMinutes"
                value={formData.runMinutes}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Serving Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Serving Size
              </label>
              <input
                type="text"
                name="servingSize"
                value={formData.servingSize}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                placeholder="e.g., 250g, 1 cup"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preparation Time (minutes)
              </label>
              <input
                type="number"
                name="preparationTime"
                value={formData.preparationTime}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Spicy Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Spicy Level
            </label>
            <div className="flex gap-4">
              {[0, 1, 2, 3].map(level => (
                <label key={level} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="spicyLevel"
                    value={level}
                    checked={formData.spicyLevel === level}
                    onChange={(e) => setFormData(prev => ({ ...prev, spicyLevel: parseInt(e.target.value) }))}
                    className="text-primary"
                  />
                  <span>{level === 0 ? 'Not Spicy' : '🌶️'.repeat(level)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Dietary Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dietary Information
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { name: 'halal', label: 'Halal' },
                { name: 'vegetarian', label: 'Vegetarian' },
                { name: 'vegan', label: 'Vegan' },
                { name: 'glutenFree', label: 'Gluten Free' },
                { name: 'dairyFree', label: 'Dairy Free' },
                { name: 'nutFree', label: 'Nut Free' }
              ].map(option => (
                <label key={option.name} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name={option.name}
                    checked={formData[option.name]}
                    onChange={handleInputChange}
                    className="text-primary"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Warnings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warnings
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="highSodium"
                  checked={formData.highSodium}
                  onChange={handleInputChange}
                  className="text-primary"
                />
                <span>High Sodium</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="containsCaffeine"
                  checked={formData.containsCaffeine}
                  onChange={handleInputChange}
                  className="text-primary"
                />
                <span>Contains Caffeine</span>
              </label>
            </div>
          </div>

          {/* Allergens */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allergens
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(allergenOptions).map(([key, allergen]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.allergens.includes(key)}
                    onChange={() => handleAllergenToggle(key)}
                    className="text-primary"
                  />
                  <img src={allergen.iconUrl} alt={allergen.name} className="w-6 h-6" />
                  <span>{allergen.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Nutrition Label Tab */}
      {activeTab === 'label' && (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-blue-800">
              <strong>Optional:</strong> Fill in these fields to display a complete nutrition label. 
              Leave blank if nutrition information is not available.
            </p>
          </div>

          {/* Macronutrients */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Macronutrients</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Fat (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="totalFat"
                  value={formData.totalFat}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saturated Fat (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="saturatedFat"
                  value={formData.saturatedFat}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trans Fat (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="transFat"
                  value={formData.transFat}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Protein (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="protein"
                  value={formData.protein}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Carbohydrates */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Carbohydrates</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Carbohydrates (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="totalCarbs"
                  value={formData.totalCarbs}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dietary Fiber (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="dietaryFiber"
                  value={formData.dietaryFiber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sugars (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="sugars"
                  value={formData.sugars}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Other Nutrients */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Other Nutrients</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cholesterol (mg)
                </label>
                <input
                  type="number"
                  name="cholesterol"
                  value={formData.cholesterol}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sodium (mg)
                </label>
                <input
                  type="number"
                  name="sodium"
                  value={formData.sodium}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Vitamins & Minerals */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Vitamins & Minerals (% Daily Value)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vitamin A (%)
                </label>
                <input
                  type="number"
                  name="vitaminA"
                  value={formData.vitaminA}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                  placeholder="0-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vitamin C (%)
                </label>
                <input
                  type="number"
                  name="vitaminC"
                  value={formData.vitaminC}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                  placeholder="0-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calcium (%)
                </label>
                <input
                  type="number"
                  name="calcium"
                  value={formData.calcium}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                  placeholder="0-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Iron (%)
                </label>
                <input
                  type="number"
                  name="iron"
                  value={formData.iron}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                  placeholder="0-100"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={uploading}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {uploading ? 'Saving...' : (item ? 'Update Item' : 'Add Item')}
        </button>
      </div>
    </form>
  );
};

export default NutritionEnhancedItemForm;