import React, { useState, useEffect } from 'react';
import { menuAPI } from '../services/api';
import AllergenIcons, { getAllergenIcon } from './AllergenIcons';

const EnhancedItemForm = ({ item, onSubmit, onCancel, categories }) => {
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
    servingSize: ''
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [allergenOptions, setAllergenOptions] = useState({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadAllergenOptions();
    if (item) {
      setFormData({
        ...item,
        price: item.price ? parseFloat(item.price) : '',
        priceWithoutVat: item.priceWithoutVat ? parseFloat(item.priceWithoutVat) : '',
        allergens: item.allergens || []
      });
      if (item.image) {
        setImagePreview(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${item.image}`);
      }
    }
  }, [item]);

  const loadAllergenOptions = async () => {
    try {
      const response = await menuAPI.getAllergenIcons();
      setAllergenOptions(response.allergens);
    } catch (error) {
      console.error('Failed to load allergen options');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
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

  const calculateVAT = (priceWithoutVat) => {
    const vat = priceWithoutVat * 0.15; // 15% VAT in Saudi Arabia
    return (parseFloat(priceWithoutVat) + vat).toFixed(2);
  };

  const handlePriceWithoutVatChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      priceWithoutVat: value,
      price: value ? calculateVAT(value) : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let imageUrl = formData.image;

      // Upload image if new file selected
      if (imageFile) {
        const uploadResponse = await menuAPI.uploadImage(imageFile);
        imageUrl = uploadResponse.url;
      }

      const submitData = {
        ...formData,
        image: imageUrl,
        price: formData.price ? `${formData.price} SAR` : '',
        priceWithoutVat: formData.priceWithoutVat ? `${formData.priceWithoutVat} SAR` : '',
        calories: parseInt(formData.calories) || 0,
        walkMinutes: parseInt(formData.walkMinutes) || 0,
        runMinutes: parseInt(formData.runMinutes) || 0,
        spicyLevel: parseInt(formData.spicyLevel) || 0,
        preparationTime: parseInt(formData.preparationTime) || null
      };

      await onSubmit(submitData);
    } catch (error) {
      alert('Failed to save item. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-xl max-h-[90vh] overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary border-b pb-2">Basic Information</h3>
          
          <div>
            <label className="block text-sm font-semibold text-primary mb-2">
              Item Name (English) *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary mb-2">
              Item Name (Arabic)
            </label>
            <input
              type="text"
              name="nameAr"
              value={formData.nameAr}
              onChange={handleChange}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              dir="rtl"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label} {cat.labelAr && `(${cat.labelAr})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary mb-2">
              Price Without VAT (SAR) *
            </label>
            <input
              type="number"
              name="priceWithoutVat"
              value={formData.priceWithoutVat}
              onChange={handlePriceWithoutVatChange}
              min="0"
              step="0.01"
              required
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary mb-2">
              Price With VAT (15%)
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              readOnly
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg bg-gray-50"
            />
          </div>
        </div>

        {/* Image Upload */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary border-b pb-2">Image</h3>
          
          <div>
            <label className="block text-sm font-semibold text-primary mb-2">
              Item Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
            />
            {imagePreview && (
              <div className="mt-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary mb-2">
              Spicy Level
            </label>
            <input
              type="range"
              name="spicyLevel"
              value={formData.spicyLevel}
              onChange={handleChange}
              min="0"
              max="5"
              className="w-full"
            />
            <div className="flex justify-between text-xs mt-1">
              <span>Mild</span>
              <span className="text-orange-500">🌶️ {formData.spicyLevel}</span>
              <span>Very Spicy</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary mb-2">
              Preparation Time (minutes)
            </label>
            <input
              type="number"
              name="preparationTime"
              value={formData.preparationTime}
              onChange={handleChange}
              min="0"
              placeholder="e.g., 20"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary mb-2">
              Serving Size
            </label>
            <input
              type="text"
              name="servingSize"
              value={formData.servingSize}
              onChange={handleChange}
              placeholder="e.g., 250g, 2 pieces"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Description */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-primary border-b pb-2">Description</h3>
          
          <div>
            <label className="block text-sm font-semibold text-primary mb-2">
              Description (English) *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              required
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary mb-2">
              Description (Arabic)
            </label>
            <textarea
              name="descriptionAr"
              value={formData.descriptionAr}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              dir="rtl"
            />
          </div>
        </div>

        {/* Nutritional Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary border-b pb-2">Nutritional Information</h3>
          
          <div>
            <label className="block text-sm font-semibold text-primary mb-2">
              Calories *
            </label>
            <input
              type="number"
              name="calories"
              value={formData.calories}
              onChange={handleChange}
              min="0"
              required
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary mb-2">
              Walk Minutes to Burn
            </label>
            <input
              type="number"
              name="walkMinutes"
              value={formData.walkMinutes}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary mb-2">
              Run Minutes to Burn
            </label>
            <input
              type="number"
              name="runMinutes"
              value={formData.runMinutes}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Dietary Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary border-b pb-2">Dietary Information</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'halal', label: 'Halal' },
              { name: 'containsCaffeine', label: 'Contains Caffeine' },
              { name: 'highSodium', label: 'High Sodium' },
              { name: 'glutenFree', label: 'Gluten Free' },
              { name: 'dairyFree', label: 'Dairy Free' },
              { name: 'nutFree', label: 'Nut Free' },
              { name: 'vegetarian', label: 'Vegetarian' },
              { name: 'vegan', label: 'Vegan' }
            ].map(({ name, label }) => (
              <label key={name} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name={name}
                  checked={formData[name]}
                  onChange={handleChange}
                  className="w-5 h-5 text-primary rounded focus:ring-primary"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Allergens */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-primary border-b pb-2">Allergens</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(allergenOptions).map(([key, allergen]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleAllergenToggle(key)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.allergens.includes(key)
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={formData.allergens.includes(key) ? 'text-red-500' : 'text-gray-500'}>
                    {getAllergenIcon(key)}
                  </div>
                  <span className="text-xs font-medium">{allergen.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
          disabled={uploading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={uploading}
        >
          {uploading ? 'Saving...' : (item ? 'Update' : 'Add')} Item
        </button>
      </div>
    </form>
  );
};

export default EnhancedItemForm;