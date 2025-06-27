import React, { useState, useEffect } from 'react';

const ItemForm = ({ item, onSubmit, onCancel, categories }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    calories: '',
    walkMinutes: '',
    runMinutes: '',
    highSodium: false,
    glutenFree: false,
    dairyFree: false,
    nutFree: false,
    vegetarian: false,
    vegan: false,
    allergens: ''
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        price: item.price ? parseFloat(item.price) : '',
        description: item.description || '',
        category: item.category || '',
        calories: item.calories || '',
        walkMinutes: item.walkMinutes || '',
        runMinutes: item.runMinutes || '',
        highSodium: item.highSodium || false,
        glutenFree: item.glutenFree || false,
        dairyFree: item.dairyFree || false,
        nutFree: item.nutFree || false,
        vegetarian: item.vegetarian || false,
        vegan: item.vegan || false,
        allergens: item.allergens ? item.allergens.join(', ') : ''
      });
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      price: formData.price ? `${formData.price} SAR` : '',
      calories: parseInt(formData.calories) || 0,
      walkMinutes: parseInt(formData.walkMinutes) || 0,
      runMinutes: parseInt(formData.runMinutes) || 0,
      allergens: formData.allergens ? formData.allergens.split(',').map(a => a.trim()).filter(a => a) : []
    };
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-primary mb-2">
              Item Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-primary mb-2">
              Price (SAR) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
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
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Nutritional Information */}
        <div className="space-y-4">
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
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
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
              placeholder="Minutes of walking"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
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
              placeholder="Minutes of running"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
            />
          </div>
        </div>
        
        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-primary mb-2">
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            required
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
          />
        </div>
        
        {/* Dietary Information */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-primary mb-4">
            Dietary Information
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
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
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-primary mb-2">
            Allergens (comma-separated)
          </label>
          <input
            type="text"
            name="allergens"
            value={formData.allergens}
            onChange={handleChange}
            placeholder="e.g., peanuts, shellfish, eggs"
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      </div>
      
      {/* Form Actions */}
      <div className="flex justify-end gap-4 mt-8">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
        >
          {item ? 'Update' : 'Add'} Item
        </button>
      </div>
    </form>
  );
};

export default ItemForm;