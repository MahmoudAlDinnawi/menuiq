import React, { useState, useEffect } from 'react';
import DashboardSidebar from '../components/DashboardSidebar';
import NutritionEnhancedItemForm from '../components/NutritionEnhancedItemForm';
import CategoryManager from '../components/CategoryManager';
import EnhancedSettingsManager from '../components/EnhancedSettingsManager';
import CustomAllergenIcons from '../components/CustomAllergenIcons';
import AllergenIconManager from '../components/AllergenIconManager';
import MenuImportExport from '../components/MenuImportExport';
import api from '../services/api';

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState('items');
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsData, categoriesData] = await Promise.all([
        api.get('/api/menu-items'),
        api.get('/api/categories')
      ]);
      setMenuItems(itemsData.data);
      setCategories(categoriesData.data.categories);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (itemData) => {
    try {
      await api.post('/api/menu-items', itemData);
      await fetchData();
      setActiveSection('items');
      alert('Item added successfully!');
    } catch (err) {
      alert('Failed to add item. Please try again.');
    }
  };

  const handleUpdateItem = async (itemData) => {
    try {
      await api.put(`/api/menu-items/${editingItem.id}`, itemData);
      await fetchData();
      setShowModal(false);
      setEditingItem(null);
      alert('Item updated successfully!');
    } catch (err) {
      alert('Failed to update item. Please try again.');
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await api.delete(`/api/menu-items/${id}`);
        await fetchData();
      } catch (err) {
        alert('Failed to delete item. Please try again.');
      }
    }
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  // Filter items based on search and category
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const formatCategory = (category) => {
    const categoryNames = {
      'appetizers': 'Appetizer',
      'mains': 'Main Course',
      'steaks': 'Signature Steak',
      'desserts': 'Dessert',
      'beverages': 'Beverage'
    };
    return categoryNames[category] || category;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      
      <main className="flex-1 p-8">
        {activeSection === 'items' && (
          <div>
            <h1 className="text-3xl font-playfair font-bold text-primary mb-8">Menu Items Management</h1>
            
            {/* Search and Filter */}
            <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setFilterCategory('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      filterCategory === 'all'
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    All
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => setFilterCategory(cat.value)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        filterCategory === cat.value
                          ? 'bg-primary text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Items Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary mx-auto"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map(item => (
                  <div key={item.id} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-playfair font-bold text-primary flex-1">{item.name}</h3>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {item.image && (
                      <img 
                        src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${item.image}`}
                        alt={item.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    )}
                    
                    <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                    
                    {item.preparationTime && (
                      <p className="text-xs text-gray-500">⏱️ {item.preparationTime} mins</p>
                    )}
                    
                    {item.servingSize && (
                      <p className="text-xs text-gray-500">🍽️ {item.servingSize}</p>
                    )}
                    
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-lg font-semibold text-gold">{item.price}</span>
                      <span className="bg-primary text-white px-3 py-1 rounded-full text-xs uppercase">
                        {formatCategory(item.category)}
                      </span>
                    </div>
                    
                    {/* Info badges */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {item.calories && (
                        <span className="badge bg-green-100 text-green-700">
                          {item.calories} cal
                        </span>
                      )}
                      {item.highSodium && (
                        <span className="badge bg-orange-100 text-orange-700">
                          High Sodium
                        </span>
                      )}
                      {item.halal && (
                        <span className="badge bg-emerald-100 text-emerald-700">
                          Halal
                        </span>
                      )}
                      {item.spicyLevel > 0 && (
                        <span className="badge bg-red-100 text-red-700">
                          {'🌶️'.repeat(item.spicyLevel)}
                        </span>
                      )}
                      {(item.walkMinutes || item.runMinutes) && (
                        <span className="badge bg-blue-100 text-blue-700">
                          {item.walkMinutes && `${item.walkMinutes}min walk`}
                          {item.walkMinutes && item.runMinutes && ' / '}
                          {item.runMinutes && `${item.runMinutes}min run`}
                        </span>
                      )}
                      {item.allergens && item.allergens.length > 0 && (
                        <div className="flex items-center gap-1">
                          <CustomAllergenIcons allergens={item.allergens} size="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeSection === 'add' && (
          <div>
            <h1 className="text-3xl font-playfair font-bold text-primary mb-8">Add New Menu Item</h1>
            <NutritionEnhancedItemForm 
              categories={categories}
              onSubmit={handleAddItem}
              onCancel={() => setActiveSection('items')}
            />
          </div>
        )}
        
        {activeSection === 'categories' && (
          <div>
            <h1 className="text-3xl font-playfair font-bold text-primary mb-8">Category Management</h1>
            <CategoryManager 
              categories={categories}
              onUpdate={fetchData}
            />
          </div>
        )}
        
        {activeSection === 'allergens' && (
          <div>
            <h1 className="text-3xl font-playfair font-bold text-primary mb-8">Allergen Icons</h1>
            <AllergenIconManager />
          </div>
        )}
        
        {activeSection === 'settings' && (
          <div>
            <h1 className="text-3xl font-playfair font-bold text-primary mb-8">Settings</h1>
            <EnhancedSettingsManager />
          </div>
        )}
        
        {activeSection === 'import' && (
          <div>
            <h1 className="text-3xl font-playfair font-bold text-primary mb-8">Import/Export Menu</h1>
            <MenuImportExport 
              categories={categories}
              onImportSuccess={fetchData}
            />
          </div>
        )}
      </main>
      
      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-playfair font-bold text-primary">Edit Menu Item</h2>
            </div>
            <div className="p-6">
              <NutritionEnhancedItemForm
                item={editingItem}
                categories={categories}
                onSubmit={handleUpdateItem}
                onCancel={() => {
                  setShowModal(false);
                  setEditingItem(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;