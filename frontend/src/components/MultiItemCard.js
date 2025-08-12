import React, { useState } from 'react';
import AmazingNutritionModal from './AmazingNutritionModal';
import MultiItemModal from './MultiItemModal';
import AllergenSVGIcon from './AllergenSVGIcon';
import analyticsTracker from '../services/analyticsTracker';
import LazyImage from './LazyImage';

const MultiItemCard = ({ item, language, formatCategory, categories, settings, isMobile }) => {
  const [showNutritionModal, setShowNutritionModal] = useState(false);
  const [showMultiItemModal, setShowMultiItemModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Get primary color from settings
  const primaryColor = settings?.primaryColor || '#00594f';

  // Format price - price already includes currency from backend
  const formatPrice = (price) => {
    return price || '0';
  };

  // Format price range for multi-items
  const formatPriceRange = () => {
    if (!item.is_multi_item || !item.price_min || !item.price_max) {
      return formatPrice(item.price);
    }
    
    if (item.price_min === item.price_max) {
      return formatPrice(item.price_min);
    }
    
    return `${formatPrice(item.price_min)} - ${formatPrice(item.price_max)}`;
  };

  // Get allergen display info
  const getAllergenInfo = (menuItem) => {
    if (!menuItem.allergens || menuItem.allergens.length === 0) return null;
    
    const allergens = menuItem.allergens.map(allergen => {
      if (typeof allergen === 'object') {
        return {
          name: allergen.name || '',
          displayName: language === 'ar' ? allergen.display_name_ar || allergen.display_name : allergen.display_name,
          iconUrl: allergen.icon_url
        };
      }
      return { name: allergen, displayName: allergen, iconUrl: null };
    });

    return allergens;
  };

  // Get all unique allergens from sub-items for multi-item
  const getAllSubItemAllergens = () => {
    if (!item.is_multi_item || !item.sub_items || item.sub_items.length === 0) return null;
    
    const allAllergens = new Map();
    
    // Collect all unique allergens from sub-items
    item.sub_items.forEach(subItem => {
      if (subItem.allergens && subItem.allergens.length > 0) {
        subItem.allergens.forEach(allergen => {
          const key = typeof allergen === 'object' ? allergen.name : allergen;
          if (!allAllergens.has(key)) {
            if (typeof allergen === 'object') {
              allAllergens.set(key, {
                name: allergen.name || '',
                displayName: language === 'ar' ? allergen.display_name_ar || allergen.display_name : allergen.display_name,
                iconUrl: allergen.icon_url
              });
            } else {
              allAllergens.set(key, { name: allergen, displayName: allergen, iconUrl: null });
            }
          }
        });
      }
    });
    
    return allAllergens.size > 0 ? Array.from(allAllergens.values()) : null;
  };

  // Get upsell icon emoji
  const getUpsellIcon = () => {
    const icons = {
      star: '⭐',
      fire: '🔥',
      crown: '👑',
      diamond: '💎',
      rocket: '🚀',
      heart: '❤️',
      lightning: '⚡',
      trophy: '🏆'
    };
    return icons[item.upsell_icon] || '⭐';
  };

  // Build card classes
  const cardClasses = `bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
    item.is_upsell ? 'relative ring-2' : ''
  } ${
    item.is_upsell && item.upsell_animation === 'glow' ? 'upsell-glow' : ''
  } ${
    item.is_upsell && item.upsell_animation === 'shine' ? 'upsell-shine' : ''
  }`;

  const cardStyle = item.is_upsell ? {
    borderColor: item.upsell_border_color || '#FFD700',
    backgroundColor: item.upsell_background_color || '#FFFFFF',
    '--ring-color': item.upsell_border_color || '#FFD700'
  } : {};

  return (
    <>
      <div className={cardClasses} style={cardStyle}>
        {/* Main Item Header */}
        <div 
          className="cursor-pointer"
          onClick={() => {
            setShowMultiItemModal(true);
            analyticsTracker.trackItemClick(item.id, item.categoryId);
          }}
        >
          {/* Image Section */}
          <div className="relative h-40 sm:h-48 md:h-52 bg-gradient-to-br from-gray-100 to-gray-200">
            {item.image && !imageError ? (
              <>
                <LazyImage 
                  src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${item.image}`}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                  placeholder="/images/placeholder.svg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </>
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`
                }}
              >
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.1) 35px, rgba(255,255,255,0.1) 70px)`
                  }} />
                </div>
                
                <div className="text-center px-4 sm:px-6 z-10">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 drop-shadow-lg line-clamp-2">
                    {language === 'ar' && item.nameAr ? item.nameAr : item.name}
                  </h3>
                  {item.category && (
                    <span className="text-white/80 text-xs sm:text-sm font-medium">
                      {formatCategory(item.category)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-2 sm:top-3 left-2 sm:left-3 right-2 sm:right-3">
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {(item.image && !imageError) && (
                  <span 
                    className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] sm:text-xs font-medium shadow-sm"
                    style={{ color: primaryColor }}
                  >
                    {formatCategory(item.category)}
                  </span>
                )}

                {item.is_multi_item && (
                  <span 
                    className="px-2 sm:px-3 py-0.5 sm:py-1 text-white rounded-full text-[10px] sm:text-xs font-medium shadow-sm"
                    style={{ backgroundColor: settings?.multiItemBadgeColor || '#9333EA' }}
                  >
                    <span className="hidden xs:inline">
                      {language === 'ar' 
                        ? (settings?.multiItemBadgeTextAr || 'متعدد')
                        : (settings?.multiItemBadgeTextEn || 'Multi') + ' Options'
                      }
                    </span>
                    <span className="xs:hidden">
                      {language === 'ar' 
                        ? (settings?.multiItemBadgeTextAr || 'متعدد')
                        : (settings?.multiItemBadgeTextEn || 'Multi')
                      }
                    </span>
                  </span>
                )}

                {item.signatureDish && (
                  <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-xs font-medium shadow-sm flex items-center gap-1">
                    <span className="text-sm">⭐</span>
                    {language === 'ar' ? 'طبق مميز' : 'Signature'}
                  </span>
                )}

                {item.is_upsell && item.upsell_badge_text && (
                  <span 
                    className="px-3 py-1 text-white rounded-full text-xs font-medium shadow-sm flex items-center gap-1"
                    style={{ backgroundColor: item.upsell_badge_color || '#FFD700' }}
                  >
                    <span className="text-sm">{getUpsellIcon()}</span>
                    {item.upsell_badge_text}
                  </span>
                )}
              </div>
            </div>

            {/* Price on image */}
            <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3">
              <div 
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg font-bold text-sm sm:text-base md:text-lg"
                style={{ color: primaryColor }}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              >
                <span dir="ltr">{formatPriceRange()}</span>
                {settings?.showIncludeVat && (
                  <div className="text-[9px] sm:text-[10px] font-normal opacity-75 mt-0.5">
                    {language === 'ar' ? 'شامل الضريبة' : 'Include VAT'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-3 sm:p-4 md:p-5">
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-1 sm:mb-2 line-clamp-1">
              {language === 'ar' && item.nameAr ? item.nameAr : item.name}
            </h3>
            
            {item.description && (
              <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">
                {language === 'ar' && item.descriptionAr ? item.descriptionAr : item.description}
              </p>
            )}

            {/* Quick Info - show for single items only */}
            {!item.is_multi_item && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 text-[11px] sm:text-xs md:text-sm text-gray-500">
                  {item.calories && (
                    <span className="flex items-center gap-0.5 sm:gap-1">
                      <span className="text-xs sm:text-sm">🔥</span>
                      {item.calories} <span className="hidden sm:inline">{language === 'ar' ? 'سعرة' : 'cal'}</span>
                    </span>
                  )}
                  {item.preparationTime && (
                    <span className="flex items-center gap-0.5 sm:gap-1">
                      <span className="text-xs sm:text-sm">⏱️</span>
                      {item.preparationTime} <span className="hidden sm:inline">{language === 'ar' ? 'د' : 'min'}</span>
                    </span>
                  )}
                </div>
                
                {/* Show allergens for single items */}
                {getAllergenInfo(item) && (
                  <div className="flex gap-0.5 sm:gap-1">
                    {getAllergenInfo(item).slice(0, isMobile ? 3 : 4).map((allergen, idx) => (
                      <AllergenSVGIcon 
                        key={idx}
                        iconPath={allergen.iconUrl}
                        allergenName={allergen.name}
                        className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6"
                        title={allergen.displayName}
                        primaryColor="#d97706"
                      />
                    ))}
                    {getAllergenInfo(item).length > (isMobile ? 3 : 4) && (
                      <span className="text-[10px] sm:text-xs text-gray-500 self-center">
                        +{getAllergenInfo(item).length - (isMobile ? 3 : 4)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Multi-item indicator - Redesigned */}
            {item.is_multi_item && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                {/* Compact allergen info for multi-items */}
                {getAllSubItemAllergens() && getAllSubItemAllergens().length > 0 && (
                  <div className="mb-2 flex items-center gap-1.5 text-[10px] sm:text-xs text-amber-700">
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">
                      {language === 'ar' ? 'قد يحتوي على:' : 'May contain:'}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {getAllSubItemAllergens().slice(0, isMobile ? 4 : 6).map((allergen, idx) => (
                        <span key={idx} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 rounded text-amber-700 font-medium">
                          {allergen.displayName}
                        </span>
                      ))}
                      {getAllSubItemAllergens().length > (isMobile ? 4 : 6) && (
                        <span className="text-amber-600 self-center">
                          +{getAllSubItemAllergens().length - (isMobile ? 4 : 6)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Clean options display */}
                <div className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-lg border border-gray-200 bg-gradient-to-r from-white to-gray-50 hover:shadow-sm transition-all duration-200">
                  {/* Left side - Clean info */}
                  <div className="flex items-center gap-3">
                    {/* Elegant icon with gradient */}
                    <div 
                      className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center"
                      style={{ 
                        background: `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}30 100%)`
                      }}
                    >
                      <div className="absolute inset-0 rounded-lg opacity-50" 
                           style={{ 
                             background: `radial-gradient(circle at top right, ${primaryColor}20, transparent)`
                           }} 
                      />
                      <span className="relative text-base sm:text-lg font-bold" style={{ color: primaryColor }}>
                        {item.sub_items?.length || 0}
                      </span>
                    </div>
                    
                    {/* Text with preview */}
                    <div className="flex-1">
                      <div className="text-xs sm:text-sm font-medium text-gray-900">
                        {language === 'ar' ? 'خيارات متعددة' : 'Multiple Choices'}
                      </div>
                      {/* Simple text preview */}
                      {item.sub_items && item.sub_items.length > 0 && (
                        <div className="mt-0.5 text-[10px] sm:text-xs text-gray-500 line-clamp-1">
                          {item.sub_items.slice(0, 3).map(sub => 
                            language === 'ar' && (sub.nameAr || sub.name_ar) ? 
                              (sub.nameAr || sub.name_ar) : sub.name
                          ).join(' • ')}
                          {item.sub_items.length > 3 && ' ...'}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Right side - Elegant button */}
                  <button 
                    className="group flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm text-white transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                    style={{ 
                      backgroundColor: primaryColor,
                      boxShadow: `0 2px 8px ${primaryColor}30`
                    }}
                  >
                    <span>{language === 'ar' ? 'عرض الخيارات' : 'View All'}</span>
                    <svg 
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-0.5"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 5l7 7-7 7" 
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Multi-Item Modal */}
      {showMultiItemModal && (
        <MultiItemModal
          item={item}
          language={language}
          formatCategory={formatCategory}
          onClose={() => setShowMultiItemModal(false)}
          settings={settings}
        />
      )}

      {/* Nutrition Modal */}
      {showNutritionModal && (
        <AmazingNutritionModal
          item={item}
          language={language}
          onClose={() => setShowNutritionModal(false)}
          settings={settings}
        />
      )}
    </>
  );
};

export default MultiItemCard;