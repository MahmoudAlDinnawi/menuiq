import React, { useState, useEffect } from 'react';
import LuxuryCategoryFilter from '../components/LuxuryCategoryFilter';
import publicMenuAPI from '../services/publicMenuApi';
import GuestFriendlyMenuCard from '../components/GuestFriendlyMenuCard';
import GuestFriendlyMobileCard from '../components/GuestFriendlyMobileCard';
import AmazingMobileCard from '../components/AmazingMobileCard';
import AmazingDesktopCard from '../components/AmazingDesktopCard';
import DOMPurify from 'dompurify';

const EmbeddedMenu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('en'); // 'en' or 'ar'
  const [settings, setSettings] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchData();
    
    // Check if mobile
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
      const [itemsResponse, categoriesResponse, settingsResponse] = await Promise.all([
        publicMenuAPI.getMenuItems(),
        publicMenuAPI.getCategories(),
        publicMenuAPI.getSettings()
      ]);
      setMenuItems(itemsResponse);
      setCategories(categoriesResponse);
      setSettings(settingsResponse);
      
      // If "All" category is disabled and current category is "all", 
      // switch to first available category
      if (settingsResponse?.show_all_category === false && activeCategory === 'all') {
        if (categoriesResponse.length > 0) {
          setActiveCategory(categoriesResponse[0].value);
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
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary mx-auto mb-4"></div>
          <p className="text-primary">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={fetchData} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen relative" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Luxury background pattern */}
      <div className="absolute inset-0 bg-pattern opacity-[0.02]"></div>
      {/* Mobile Header with Language Switcher */}
      <div className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="container mx-auto px-3 md:px-4 py-2 md:py-3">
          <div className="flex justify-between items-center">
            {/* Logo/Title for mobile */}
            <div className="md:hidden">
              <h1 className="text-lg font-semibold text-primary">
                {language === 'ar' ? 'قائمة الطعام' : 'Menu'}
              </h1>
            </div>
            
            {/* Language switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className={`flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full border transition-all duration-300 ${
                isMobile 
                  ? 'border-primary/20 bg-primary/5 text-primary text-sm'
                  : 'border-primary text-primary hover:bg-primary hover:text-white'
              } md:ml-auto`}
            >
              <svg className="w-4 md:w-5 h-4 md:h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
              </svg>
              <span className="text-xs md:text-base font-medium">
                {language === 'en' ? 'العربية' : 'English'}
              </span>
            </button>
          </div>
        </div>
      </div>
      
      <LuxuryCategoryFilter 
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        language={language}
        showAllCategory={settings?.show_all_category === true}
      />
      
      <main className="container mx-auto px-0 md:px-4 py-4 md:py-8">
        {/* Luxury section header - Desktop only */}
        {!isMobile && (
          <div className="text-center mb-8">
            <div className="inline-block">
              <div className="flex items-center gap-4">
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold"></div>
                <h2 className="text-xs font-light tracking-[0.3em] uppercase text-primary/70">
                  {language === 'ar' ? 'قائمة مختارة بعناية' : 'Carefully Curated Selection'}
                </h2>
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold"></div>
              </div>
            </div>
          </div>
        )}
        
        {isMobile ? (
          // Mobile layout
          <div className="space-y-3 px-2">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className="transform transition-all duration-500"
                style={{
                  animationDelay: `${index * 30}ms`,
                  animation: 'fadeInUp 0.4s ease-out forwards'
                }}
              >
                <AmazingMobileCard 
                  item={item}
                  language={language}
                  formatCategory={formatCategory}
                  categories={categories}
                  settings={settings}
                />
              </div>
            ))}
          </div>
        ) : (
          // Desktop layout
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className="transform transition-all duration-500"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animation: 'fadeInUp 0.6s ease-out forwards'
                }}
              >
                <AmazingDesktopCard 
                  item={item}
                  language={language}
                  formatCategory={formatCategory}
                  categories={categories}
                  settings={settings}
                />
              </div>
            ))}
          </div>
        )}
        
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-primary-dark text-lg">
              {language === 'ar' ? 'لا توجد عناصر في هذه الفئة.' : 'No items found in this category.'}
            </p>
          </div>
        )}
      </main>
      
      {/* Custom Footer Text */}
      {settings && settings.footerEnabled && (settings.footerTextEn || settings.footerTextAr) && (
        <div className="bg-white border-t border-gray-200 mt-8">
          <div className="container mx-auto px-3 md:px-4 py-4 md:py-6">
            <div 
              className="text-center text-primary text-xs md:text-sm prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(language === 'ar' && settings.footerTextAr ? settings.footerTextAr : settings.footerTextEn) 
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EmbeddedMenu;