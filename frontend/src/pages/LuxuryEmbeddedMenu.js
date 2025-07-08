import React, { useState, useEffect } from 'react';
import LuxuryCategoryFilter from '../components/LuxuryCategoryFilter';
import AmazingMobileCard from '../components/AmazingMobileCard';
import AmazingDesktopCard from '../components/AmazingDesktopCard';
import api from '../services/api';
import DOMPurify from 'dompurify';

const LuxuryEmbeddedMenu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('en');
  const [settings, setSettings] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchData();
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsData, categoriesData, settingsData] = await Promise.all([
        api.get('/api/menu-items'),
        api.get('/api/categories'),
        api.get('/api/settings')
      ]);
      setMenuItems(itemsData.data);
      setCategories(categoriesData.data.categories);
      setSettings(settingsData.data);
      
      // If "All" category is disabled and current category is "all", 
      // switch to first available category
      if (settingsData.data?.show_all_category === false && activeCategory === 'all') {
        if (categoriesData.data.categories.length > 0) {
          setActiveCategory(categoriesData.data.categories[0].value);
        }
      }
    } catch (err) {
      setError('Failed to load menu. Please try again later.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = activeCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

  const formatCategory = (category) => {
    const categoryData = categories.find(cat => cat.value === category);
    if (!categoryData) return category;
    return language === 'ar' && categoryData.labelAr ? categoryData.labelAr : categoryData.label;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={fetchData} 
            className="px-6 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo/Restaurant Name */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {settings?.restaurantName || 'Restaurant Menu'}
              </h1>
              {settings?.tagline && (
                <p className="text-sm text-gray-600 mt-0.5">{settings.tagline}</p>
              )}
            </div>
            
            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
              </svg>
              <span className="text-sm font-medium">
                {language === 'en' ? 'العربية' : 'English'}
              </span>
            </button>
          </div>
        </div>
      </header>
      
      {/* Category Filter */}
      <LuxuryCategoryFilter 
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        language={language}
        showAllCategory={settings?.show_all_category === true}
      />
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isMobile ? (
          // Mobile Layout
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <AmazingMobileCard 
                key={item.id}
                item={item}
                language={language}
                formatCategory={formatCategory}
                categories={categories}
                settings={settings}
              />
            ))}
          </div>
        ) : (
          // Desktop Layout
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <AmazingDesktopCard 
                key={item.id}
                item={item}
                language={language}
                formatCategory={formatCategory}
                categories={categories}
                settings={settings}
              />
            ))}
          </div>
        )}
        
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {language === 'ar' ? 'لا توجد عناصر في هذه الفئة.' : 'No items found in this category.'}
            </p>
          </div>
        )}
      </main>
      
      {/* Footer */}
      {settings && settings.footerEnabled && (settings.footerTextEn || settings.footerTextAr) && (
        <footer className="bg-white border-t border-gray-200 mt-16">
          <div className="container mx-auto px-4 py-8">
            <div 
              className="text-center text-gray-600 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(language === 'ar' && settings.footerTextAr ? settings.footerTextAr : settings.footerTextEn) 
              }}
            />
          </div>
        </footer>
      )}
    </div>
  );
};

export default LuxuryEmbeddedMenu;