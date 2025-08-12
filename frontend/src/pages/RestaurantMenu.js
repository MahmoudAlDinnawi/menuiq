/**
 * RestaurantMenu Component
 * 
 * This is the public-facing menu page that guests see when visiting a restaurant's subdomain.
 * It dynamically loads menu items, categories, and settings for the specific tenant.
 * 
 * Features:
 * - Responsive design with mobile/desktop specific components
 * - Multi-language support (English/Arabic)
 * - Category filtering
 * - Dynamic theming based on tenant settings
 * - Instagram integration
 */

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import LuxuryCategoryFilter from '../components/LuxuryCategoryFilter';
import AmazingMobileCard from '../components/AmazingMobileCard';
import AmazingDesktopCard from '../components/AmazingDesktopCard';
import MultiItemCard from '../components/MultiItemCard';
import LuxuryLanguageSelector from '../components/LuxuryLanguageSelector';
import GoogleTagManager from '../components/GoogleTagManager';
import publicMenuAPI from '../services/publicMenuApi';
import DOMPurify from 'dompurify';  // For sanitizing HTML content
import analyticsTracker from '../services/analyticsTracker';  // Analytics tracking
import { getSubdomain, setDevSubdomain } from '../utils/subdomain';

const RestaurantMenu = () => {
  // Initialize with empty arrays to prevent undefined errors
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null); // Start with null to set first category
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('en');
  const [settings, setSettings] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // For local development - check if we need to set subdomain
  const currentSubdomain = getSubdomain();
  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // First, fetch settings to get restaurant info
        const settingsResponse = await publicMenuAPI.getSettings();
        setSettings(settingsResponse || {});
        
        // Check if language was previously selected
        const savedLanguage = localStorage.getItem('menuLanguage');
        const hasVisited = localStorage.getItem('hasVisitedMenu');
        
        if (savedLanguage) {
          setLanguage(savedLanguage);
        }
        
        // Show language selector on first visit or if no language saved
        if (!hasVisited || !savedLanguage) {
          setShowLanguageSelector(true);
          setLoading(false); // Stop showing loading screen
          setInitialLoadComplete(true);
        } else {
          // Initialize menu if language already selected
          await initializeMenu();
        }
      } catch (err) {
        console.error('Error during initialization:', err);
        setError('Failed to load restaurant information');
        setLoading(false);
      }
    };
    
    initializeApp();
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeMenu = async () => {
    // Initialize analytics session
    await analyticsTracker.initSession(language);
    // Track initial page view
    analyticsTracker.trackPageView('menu');
    
    await fetchData();
    setInitialLoadComplete(true);
    
    // Setup scroll tracking
    const unsubscribeScroll = analyticsTracker.trackScrollDepth();
    
    return () => {
      if (unsubscribeScroll) unsubscribeScroll();
    };
  };

  const handleLanguageSelect = async (selectedLanguage) => {
    setLanguage(selectedLanguage);
    localStorage.setItem('menuLanguage', selectedLanguage);
    localStorage.setItem('hasVisitedMenu', 'true');
    setShowLanguageSelector(false);
    setLoading(true); // Show loading while fetching menu data
    
    // Initialize menu after language selection
    setTimeout(async () => {
      await initializeMenu();
    }, 500);
  };

  // Remove this effect as we handle initial category in fetchData now

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('[RestaurantMenu] Starting data fetch...');
      console.log('[RestaurantMenu] Current subdomain:', getSubdomain());
      console.log('[RestaurantMenu] API URL:', process.env.REACT_APP_API_URL || 'http://localhost:8000');
      
      const [itemsResponse, categoriesResponse, settingsResponse] = await Promise.all([
        publicMenuAPI.getMenuItems(),
        publicMenuAPI.getCategories(),
        publicMenuAPI.getSettings()
      ]);
      
      // Ensure menuItems is always an array
      const items = Array.isArray(itemsResponse) ? itemsResponse : [];
      const categoriesList = Array.isArray(categoriesResponse) ? categoriesResponse : [];
      
      console.log('Raw API responses:', {
        items: itemsResponse,
        categories: categoriesResponse,
        settings: settingsResponse,
        showAllCategory: settingsResponse?.showAllCategory,
        currentActiveCategory: activeCategory
      });
      
      // Extra safety: ensure we're setting arrays
      setMenuItems(Array.isArray(items) ? items : []);
      setCategories(Array.isArray(categoriesList) ? categoriesList : []);
      setSettings(settingsResponse || {});
      
      // Debug log
      console.log('Items received:', itemsResponse);
      console.log('Settings received:', settingsResponse);
      console.log('showAllCategory value:', settingsResponse?.showAllCategory);
      
      // Set initial category based on settings
      if (activeCategory === null) {
        if (settingsResponse?.showAllCategory === false || settingsResponse?.showAllCategory === undefined) {
          // If showAllCategory is false or undefined, select first category
          if (categoriesList.length > 0) {
            console.log('Setting first category:', categoriesList[0].value);
            setActiveCategory(categoriesList[0].value);
          }
        } else {
          // If showAllCategory is true, select "all"
          console.log('Setting category to all');
          setActiveCategory('all');
        }
      }
    } catch (err) {
      setError('Failed to load menu. Please try again later.');
      console.error('Error fetching data:', err);
      // Set empty arrays on error to prevent map errors
      setMenuItems([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Ensure menuItems is always an array before filtering
  const safeMenuItems = Array.isArray(menuItems) ? menuItems : [];
  const safeCategories = Array.isArray(categories) ? categories : [];
  
  // Double-check array before filter operation
  let filteredItems = [];
  try {
    if (!activeCategory || activeCategory === 'all') {
      filteredItems = safeMenuItems;
    } else if (Array.isArray(safeMenuItems)) {
      filteredItems = safeMenuItems.filter(item => item && item.category === activeCategory);
    }
  } catch (error) {
    console.error('Error filtering items:', error);
    filteredItems = [];
  }
  
  // Ensure displayItems is always an array
  const displayItems = Array.isArray(filteredItems) ? filteredItems : [];
  
  // Debug logging
  console.log('menuItems:', menuItems);
  console.log('safeMenuItems:', safeMenuItems);
  console.log('filteredItems:', filteredItems);
  console.log('displayItems:', displayItems);
  console.log('activeCategory:', activeCategory);

  const formatCategory = (category) => {
    const categoryData = safeCategories.find(cat => cat.value === category);
    if (!categoryData) return category;
    return language === 'ar' && categoryData.labelAr ? categoryData.labelAr : categoryData.label;
  };


  if (loading && !showLanguageSelector) {
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
    <>
      {/* Luxury Language Selector */}
      <LuxuryLanguageSelector
        settings={settings}
        onLanguageSelect={handleLanguageSelect}
        isOpen={showLanguageSelector}
      />
      
      <div className="min-h-screen bg-gray-50 flex flex-col" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Debug Panel for Local Development */}
      {isLocalDev && (
        <div className="bg-yellow-100 border-b border-yellow-300 p-2 text-sm">
          <div className="container mx-auto flex items-center justify-between">
            <span>
              🛠️ Local Dev Mode | Subdomain: <strong>{currentSubdomain}</strong> | 
              API: <strong>{process.env.REACT_APP_API_URL || 'http://localhost:8000'}</strong>
            </span>
            <button
              onClick={() => {
                const newSubdomain = prompt('Enter subdomain (e.g., entrecote):', currentSubdomain);
                if (newSubdomain) {
                  setDevSubdomain(newSubdomain);
                  window.location.reload();
                }
              }}
              className="bg-yellow-600 text-white px-3 py-1 rounded text-xs"
            >
              Change Subdomain
            </button>
          </div>
        </div>
      )}
      {/* Google Tag Manager */}
      <GoogleTagManager gtmId={settings?.gtmContainerId} />
      
      {/* SEO Meta Tags */}
      <Helmet>
        <title>
          {language === 'ar' 
            ? (settings?.metaTitleAr || `${settings?.tenantName || 'مطعم'} - قائمة الطعام`)
            : (settings?.metaTitleEn || `${settings?.tenantName || 'Restaurant'} - Menu`)
          }
        </title>
        <meta name="description" content={
          language === 'ar'
            ? (settings?.metaDescriptionAr || `اكتشف قائمة الطعام الرائعة في ${settings?.tenantName || 'مطعمنا'}`)
            : (settings?.metaDescriptionEn || `Discover our amazing menu at ${settings?.tenantName || 'our restaurant'}`)
        } />
        {(settings?.metaKeywordsEn || settings?.metaKeywordsAr) && (
          <meta name="keywords" content={
            language === 'ar' 
              ? (settings?.metaKeywordsAr || settings?.metaKeywordsEn)
              : (settings?.metaKeywordsEn || settings?.metaKeywordsAr)
          } />
        )}
        
        {/* Open Graph Tags for Social Media */}
        <meta property="og:title" content={
          language === 'ar' 
            ? (settings?.metaTitleAr || `${settings?.tenantName || 'مطعم'} - قائمة الطعام`)
            : (settings?.metaTitleEn || `${settings?.tenantName || 'Restaurant'} - Menu`)
        } />
        <meta property="og:description" content={
          language === 'ar'
            ? (settings?.metaDescriptionAr || `اكتشف قائمة الطعام الرائعة في ${settings?.tenantName || 'مطعمنا'}`)
            : (settings?.metaDescriptionEn || `Discover our amazing menu at ${settings?.tenantName || 'our restaurant'}`)
        } />
        <meta property="og:type" content="website" />
        {settings?.ogImageUrl && (
          <meta property="og:image" content={settings.ogImageUrl} />
        )}
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={
          language === 'ar' 
            ? (settings?.metaTitleAr || `${settings?.tenantName || 'مطعم'} - قائمة الطعام`)
            : (settings?.metaTitleEn || `${settings?.tenantName || 'Restaurant'} - Menu`)
        } />
        <meta name="twitter:description" content={
          language === 'ar'
            ? (settings?.metaDescriptionAr || `اكتشف قائمة الطعام الرائعة في ${settings?.tenantName || 'مطعمنا'}`)
            : (settings?.metaDescriptionEn || `Discover our amazing menu at ${settings?.tenantName || 'our restaurant'}`)
        } />
        {settings?.ogImageUrl && (
          <meta name="twitter:image" content={settings.ogImageUrl} />
        )}
      </Helmet>
      
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-lg fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Left Side - Website Link */}
            <div className="flex-1">
              {settings?.websiteUrl && (
                <a
                  href={settings.websiteUrl}
                  className="inline-flex items-center gap-1.5 sm:gap-2 text-gray-700 hover:text-gray-900 transition-all duration-300 group p-2 sm:p-0 -m-2 sm:m-0"
                >
                  <div className="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-primary-50 group-hover:to-primary-100 flex items-center justify-center transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:scale-110">
                    <svg className="w-5 h-5 sm:w-4 sm:h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </div>
                  <span className="hidden sm:inline text-sm font-medium group-hover:text-primary transition-colors">
                    {language === 'ar' ? 'الموقع الرئيسي' : 'Back to Website'}
                  </span>
                </a>
              )}
            </div>

            {/* Center - Logo */}
            <div className="flex-shrink-0 mx-2 sm:mx-4">
              {settings?.logoUrl ? (
                <img 
                  src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${settings.logoUrl}`}
                  alt={settings.tenantName || 'Restaurant Logo'} 
                  className="h-10 sm:h-14 md:h-16 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `<div class="text-lg sm:text-2xl font-bold text-gray-900">${settings.tenantName || 'Restaurant'}</div>`;
                  }}
                />
              ) : (
                <div className="text-lg sm:text-2xl font-bold text-gray-900">
                  {settings?.tenantName || 'Restaurant'}
                </div>
              )}
            </div>

            {/* Right Side - Actions */}
            <div className="flex-1 flex items-center justify-end gap-2 sm:gap-2 md:gap-3">
              {/* Instagram Button - Dynamic Handle */}
              {settings?.instagramHandle && (
                <a
                  href={`https://instagram.com/${settings.instagramHandle.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3 md:px-4 py-2 sm:py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white rounded-full hover:shadow-xl transition-all duration-500 group transform hover:scale-105"
                  title={settings.instagramHandle}
                  style={{
                    backgroundSize: '200% 100%',
                    backgroundPosition: '0% 0%',
                    transition: 'all 0.5s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundPosition = '100% 0%'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundPosition = '0% 0%'}
                >
                  <svg className="w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0 group-hover:rotate-12 transition-transform duration-300" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                  </svg>
                  <span className="text-xs sm:text-sm font-medium hidden xs:inline">
                    {settings.instagramHandle.replace('@', '')}
                  </span>
                </a>
              )}

              {/* Language Switcher - Compact on mobile */}
              <button
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3 md:px-4 py-2 sm:py-2 bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-full transition-all duration-300 group shadow-sm hover:shadow-md transform hover:scale-105"
              >
                <svg className="w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0 group-hover:rotate-180 transition-transform duration-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
                </svg>
                <span className="text-sm sm:text-sm font-semibold">
                  {language === 'en' ? 'ع' : 'EN'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Hero Section - Dynamic Colors */}
      <div 
        className="text-white pt-20 sm:pt-28 pb-8 sm:pb-12"
        style={{
          background: settings?.primaryColor 
            ? `linear-gradient(to bottom right, ${settings.primaryColor}, ${settings.primaryColor}dd)`
            : 'linear-gradient(to bottom right, #00594f, #003d35)'
        }}
      >
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
            {language === 'ar' ? 'قائمة الطعام' : 'Our Menu'}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto px-4">
            {language === 'ar' 
              ? (settings?.heroSubtitleAr || 'اكتشف تشكيلتنا الرائعة من الأطباق الفرنسية الأصيلة')
              : (settings?.heroSubtitleEn || 'Discover our exquisite selection of authentic French cuisine')
            }
          </p>
        </div>
      </div>
      
      {/* Category Filter - sticky under navbar */}
      <div className="sticky top-16 sm:top-20 z-30">
        <LuxuryCategoryFilter 
          categories={safeCategories}
          activeCategory={activeCategory}
          onCategoryChange={(category) => {
            setActiveCategory(category);
            // Track category view
            const categoryId = safeCategories.find(c => c.value === category)?.id;
            analyticsTracker.trackPageView('category', categoryId);
          }}
          language={language}
          showAllCategory={settings?.showAllCategory === true}
        />
      </div>
      
      {/* Main Content - flex-grow to push footer down */}
      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 flex-grow">
        {displayItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {language === 'ar' ? 'لا توجد عناصر في هذه الفئة' : 'No items in this category'}
            </p>
          </div>
        ) : isMobile ? (
          // Mobile Layout
          <div className="space-y-3">
            {Array.isArray(displayItems) && displayItems.map((item) => (
              item.is_multi_item ? (
                <MultiItemCard 
                  key={item.id}
                  item={item}
                  language={language}
                  formatCategory={formatCategory}
                  categories={safeCategories}
                  settings={settings}
                  isMobile={true}
                />
              ) : (
                <AmazingMobileCard 
                  key={item.id}
                  item={item}
                  language={language}
                  formatCategory={formatCategory}
                  categories={safeCategories}
                  settings={settings}
                />
              )
            ))}
          </div>
        ) : (
          // Desktop Layout
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(displayItems) && displayItems.map((item) => (
              item.is_multi_item ? (
                <MultiItemCard 
                  key={item.id}
                  item={item}
                  language={language}
                  formatCategory={formatCategory}
                  categories={safeCategories}
                  settings={settings}
                  isMobile={false}
                />
              ) : (
                <AmazingDesktopCard 
                  key={item.id}
                  item={item}
                  language={language}
                  formatCategory={formatCategory}
                  categories={safeCategories}
                  settings={settings}
                />
              )
            ))}
          </div>
        )}
        
        {displayItems.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <p className="text-gray-500 text-base sm:text-lg">
              {language === 'ar' ? 'لا توجد عناصر في هذه الفئة.' : 'No items found in this category.'}
            </p>
          </div>
        )}
      </main>
      
      {/* Footer - Dynamic Color */}
      <footer 
        className="text-white mt-auto"
        style={{
          backgroundColor: settings?.primaryColor || '#00594f'
        }}
      >
        <div className="container mx-auto px-4 py-8">
          {/* Restaurant Info */}
          <div className="text-center">
            {settings?.logoUrl ? (
              <img 
                src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${settings.logoUrl}`}
                alt={settings.tenantName || 'Restaurant Logo'} 
                className="h-12 mb-4 mx-auto brightness-0 invert"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `<div class="text-2xl font-bold text-white mb-4">${settings.tenantName || 'Restaurant'}</div>` + e.target.parentElement.innerHTML;
                }}
              />
            ) : (
              <div className="text-2xl font-bold text-white mb-4">
                {settings?.tenantName || 'Restaurant'}
              </div>
            )}
            <p className="text-white/80 max-w-2xl mx-auto mb-6">
              {language === 'ar' 
                ? (settings?.footerTaglineAr || 'تجربة طعام فرنسية أصيلة في قلب المملكة')
                : (settings?.footerTaglineEn || 'Authentic French dining experience in the heart of the Kingdom')
              }
            </p>
          </div>
          
          {/* Custom Footer Text */}
          {settings && settings.footerEnabled && (settings.footerTextEn || settings.footerTextAr) && (
            <div className="mb-6">
              <div 
                className="text-center text-white/70 prose prose-sm max-w-none prose-invert"
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(language === 'ar' && settings.footerTextAr ? settings.footerTextAr : settings.footerTextEn) 
                }}
              />
            </div>
          )}
          
          {/* Copyright */}
          <div className="pt-6 border-t border-white/20 text-center text-white/60 text-sm">
            <p>© 2025 Entrecôte Café de Paris. {language === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}.</p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
};

export default RestaurantMenu;