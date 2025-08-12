import React, { useState, useRef, useEffect } from 'react';
import AmazingNutritionModal from './AmazingNutritionModal';
import AllergenSVGIcon from './AllergenSVGIcon';
import LazyImage from './LazyImage';

const MultiItemModal = ({ item, language, onClose, settings, formatCategory }) => {
  const [selectedSubItem, setSelectedSubItem] = useState(null);
  const [showNutritionModal, setShowNutritionModal] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const modalRef = useRef(null);

  const primaryColor = settings?.primaryColor || '#00594f';

  const formatPrice = (price) => {
    return price || '0';
  };

  // Prevent iOS bounce and pull-to-refresh
  useEffect(() => {
    const preventPullToRefresh = (e) => {
      if (e.touches && e.touches[0].clientY > 0) {
        e.preventDefault();
      }
    };

    // Only add listener on mobile
    if (window.innerWidth <= 640) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('touchmove', preventPullToRefresh, { passive: false });
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('touchmove', preventPullToRefresh);
    };
  }, []);

  // Handle swipe to close on mobile - only on the header area
  const handleTouchStart = (e) => {
    // Only allow swipe from the header/handle area
    const touchElement = e.target;
    const isHeaderArea = touchElement.closest('.swipe-handle-area');
    
    if (isHeaderArea) {
      setTouchStart(e.targetTouches[0].clientY);
      setTouchEnd(e.targetTouches[0].clientY);
      setIsDragging(false);
      setDragOffset(0);
    }
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;
    
    // Prevent iOS bounce
    e.preventDefault();
    
    const currentTouch = e.targetTouches[0].clientY;
    setTouchEnd(currentTouch);
    const currentDrag = currentTouch - touchStart;
    
    // Only allow dragging down (positive values)
    if (currentDrag > 0 && currentDrag < 300) { // Limit max drag
      setIsDragging(true);
      setDragOffset(currentDrag);
      
      // Apply transform to modal with opacity
      if (modalRef.current) {
        modalRef.current.style.transform = `translateY(${currentDrag}px)`;
        modalRef.current.style.opacity = `${1 - currentDrag / 500}`;
        modalRef.current.style.transition = 'none';
      }
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchEnd - touchStart;
    const threshold = 80; // Lower threshold for easier closing
    
    if (modalRef.current) {
      if (distance > threshold) {
        // Close modal with slide down animation
        modalRef.current.style.transform = 'translateY(100%)';
        modalRef.current.style.opacity = '0';
        modalRef.current.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
        setTimeout(onClose, 300);
      } else {
        // Snap back to position
        modalRef.current.style.transform = 'translateY(0)';
        modalRef.current.style.opacity = '1';
        modalRef.current.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
      }
    }
    
    // Reset states
    setTouchStart(0);
    setTouchEnd(0);
    setIsDragging(false);
    setDragOffset(0);
  };

  const handleSubItemClick = (e, subItem) => {
    e.stopPropagation();
    
    // Debug: Log sub-item data to verify upsell fields
    console.log('Sub-item clicked:', subItem);
    console.log('Sub-item upsell status:', {
      is_upsell: subItem.is_upsell,
      badge_text: subItem.upsell_badge_text,
      badge_color: subItem.upsell_badge_color,
      icon: subItem.upsell_icon
    });
    
    // Since backend now returns all fields properly formatted, we can use sub-item directly
    setSelectedSubItem(subItem);
    setShowNutritionModal(true);
  };

  const renderSubItem = (subItem) => {
    const isImageless = !subItem.image;
    
    return (
      <div
        key={subItem.id}
        className={`
          bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer 
          transform hover:-translate-y-1 overflow-hidden group relative
          ${isImageless ? 'border-2 border-gray-100' : ''}
          ${subItem.is_upsell ? 'ring-2' : ''}
        `}
        style={subItem.is_upsell ? {
          '--tw-ring-color': subItem.upsell_border_color || '#FFD700',
          borderColor: subItem.upsell_border_color || '#FFD700'
        } : {}}
        onClick={(e) => handleSubItemClick(e, subItem)}
      >
        {/* Responsive layout */}
        <div className={`${subItem.image ? 'flex flex-col sm:flex-row' : 'p-4 sm:p-5'}`}>
          {/* Image section */}
          {subItem.image && (
            <div className="relative w-full sm:w-48 md:w-56 h-44 sm:h-48 md:h-52 bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0">
              <LazyImage 
                src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${subItem.image}`}
                alt={subItem.name}
                className="w-full h-full object-cover"
                placeholder="/images/placeholder.svg"
              />
              <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-transparent via-transparent to-black/40" />
              
              {/* Upsell badge */}
              {subItem.is_upsell && subItem.upsell_badge_text && (
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                  <div 
                    className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg flex items-center gap-1"
                    style={{ backgroundColor: subItem.upsell_badge_color || '#FFD700' }}
                  >
                    <span>
                      {subItem.upsell_icon === 'star' ? '⭐' :
                       subItem.upsell_icon === 'fire' ? '🔥' :
                       subItem.upsell_icon === 'crown' ? '👑' :
                       subItem.upsell_icon === 'diamond' ? '💎' : '✨'}
                    </span>
                    {subItem.upsell_badge_text}
                  </div>
                </div>
              )}
              
              {/* Price badge - positioned to avoid overlap */}
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                <div 
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl font-bold text-lg sm:text-xl"
                  style={{ color: primaryColor }}
                >
                  {formatPrice(subItem.price)}
                  {settings?.showIncludeVat && (
                    <div className={`text-[9px] sm:text-[10px] font-normal opacity-75 mt-0.5 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      {language === 'ar' ? 'شامل الضريبة' : 'Inc. VAT'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Content section - enhanced for better mobile/desktop experience */}
          <div className={`flex-1 p-4 sm:p-5 md:p-6 flex flex-col min-h-[180px] ${isImageless ? 'bg-gradient-to-br from-gray-50 to-white relative' : ''}`}>
            {/* Title and description with better spacing */}
            <div className="mb-4">
              <h3 className="font-bold text-lg sm:text-xl text-gray-900 mb-2 line-clamp-2 leading-tight">
                {language === 'ar' && (subItem.nameAr || subItem.name_ar) ? (subItem.nameAr || subItem.name_ar) : subItem.name}
              </h3>
              
              {(subItem.description || subItem.description_en) && (
                <p className="text-sm sm:text-base text-gray-600 line-clamp-2 leading-relaxed">
                  {language === 'ar' && (subItem.descriptionAr || subItem.description_ar) ? (subItem.descriptionAr || subItem.description_ar) : (subItem.description || subItem.description_en)}
                </p>
              )}
            </div>
            
            {/* Price for imageless items - prominent display */}
            {isImageless && (
              <div className="mb-3">
                <span 
                  className="text-2xl sm:text-3xl font-bold"
                  style={{ color: primaryColor }}
                >
                  {formatPrice(subItem.price)}
                </span>
                {settings?.showIncludeVat && (
                  <span className={`text-xs sm:text-sm text-gray-500 ${language === 'ar' ? 'mr-2' : 'ml-2'}`}>
                    ({language === 'ar' ? 'شامل الضريبة' : 'Inc. VAT'})
                  </span>
                )}
              </div>
            )}

            {/* Quick info badges - improved sizing and spacing */}
            <div className="flex flex-wrap gap-2 mb-4">
              {subItem.calories && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium">
                  <span className="text-xs">🔥</span>
                  {subItem.calories} {language === 'ar' ? 'سعرة' : 'cal'}
                </span>
              )}
              {subItem.preparationTime && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                  <span className="text-xs">⏱️</span>
                  {subItem.preparationTime} {language === 'ar' ? 'د' : 'min'}
                </span>
              )}
              {subItem.walkMinutes && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                  <span className="text-xs">🚶</span>
                  {subItem.walkMinutes} {language === 'ar' ? 'د مشي' : 'min walk'}
                </span>
              )}
              {subItem.vegetarian && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                  <span className="text-xs">🌱</span>
                  {language === 'ar' ? 'نباتي' : 'Veg'}
                </span>
              )}
            </div>

            {/* Nutrition macros - better display */}
            {(subItem.protein || subItem.totalCarbs || subItem.totalFat) && (
              <div className="flex items-center gap-3 sm:gap-4 mb-4 py-2.5 px-3 bg-gray-50 rounded-lg">
                {subItem.protein && (
                  <div className="text-center flex-1">
                    <div className="font-bold text-sm text-gray-900">{subItem.protein}g</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{language === 'ar' ? 'بروتين' : 'Protein'}</div>
                  </div>
                )}
                {subItem.totalCarbs && (
                  <div className="text-center flex-1 border-x border-gray-200">
                    <div className="font-bold text-sm text-gray-900">{subItem.totalCarbs}g</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{language === 'ar' ? 'كربوهيدرات' : 'Carbs'}</div>
                  </div>
                )}
                {subItem.totalFat && (
                  <div className="text-center flex-1">
                    <div className="font-bold text-sm text-gray-900">{subItem.totalFat}g</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{language === 'ar' ? 'دهون' : 'Fat'}</div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom section with allergens and CTA */}
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
              {/* Allergens */}
              {subItem.allergens && subItem.allergens.length > 0 ? (
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-1">
                    {subItem.allergens.slice(0, 3).map((allergen, idx) => (
                      <div key={idx} className="p-1 bg-amber-50 rounded-full">
                        <AllergenSVGIcon 
                          iconPath={typeof allergen === 'object' ? allergen.icon_url : `/src/assets/allergy_icons/${allergen}.svg`}
                          size="w-3.5 h-3.5"
                          className=""
                          primaryColor="#d97706"
                        />
                      </div>
                    ))}
                  </div>
                  {subItem.allergens.length > 3 && (
                    <span className="text-[11px] text-gray-500 font-medium">+{subItem.allergens.length - 3}</span>
                  )}
                </div>
              ) : (
                <div /> // Empty div for spacing
              )}

              {/* View details text with better styling */}
              <span 
                className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 px-3 py-1.5 bg-opacity-10 rounded-full transition-all hover:bg-opacity-20"
                style={{ 
                  color: primaryColor,
                  backgroundColor: `${primaryColor}15`
                }}
              >
                {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Multi-item Modal - Mobile Optimized */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
        onClick={(e) => {
          // Close on backdrop click for desktop
          if (e.target === e.currentTarget && window.innerWidth > 640) {
            onClose();
          }
        }}
      >
        {/* Modal container - slides up from bottom on mobile */}
        <div 
          ref={modalRef}
          className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-4xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden animate-slide-up sm:animate-fade-in"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Header with swipe indicator for mobile */}
          <div className="swipe-handle-area sm:hidden sticky top-0 z-10 bg-white px-4 py-3 cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1.5 bg-gray-400 rounded-full mx-auto"></div>
            <p className="text-xs text-gray-500 text-center mt-1">
              {language === 'ar' ? 'اسحب للأسفل للإغلاق' : 'Swipe down to close'}
            </p>
          </div>

          {/* Header with image */}
          <div className="relative h-40 sm:h-56 bg-gradient-to-br from-gray-100 to-gray-200">
            {item.image ? (
              <>
                <LazyImage 
                  src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${item.image}`}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  placeholder="/images/placeholder.svg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              </>
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`
                }}
              >
                <div className="text-center px-4">
                  <span className="text-4xl sm:text-5xl mb-2 block">📋</span>
                  <span className="text-white/80 text-sm">{language === 'ar' ? 'خيارات متعددة' : 'Multiple Options'}</span>
                </div>
              </div>
            )}

            {/* Close button - Better design for mobile */}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 sm:top-3 sm:right-3 p-2.5 sm:p-2 bg-white/95 sm:bg-black/20 backdrop-blur-md rounded-full text-gray-800 sm:text-white hover:bg-white sm:hover:bg-black/30 transition-all shadow-lg sm:shadow-none transform hover:scale-110 active:scale-95"
              aria-label="Close"
            >
              <svg className="w-6 h-6 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Title on image - more compact for mobile */}
            <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-6 right-3 sm:right-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-0.5 sm:mb-1 line-clamp-1">
                {language === 'ar' && item.nameAr ? item.nameAr : item.name}
              </h2>
              {item.description && (
                <p className="text-white/90 text-sm sm:text-base line-clamp-1">
                  {language === 'ar' && item.descriptionAr ? item.descriptionAr : item.description}
                </p>
              )}
              
              {/* Price range badge on image */}
              <div className="inline-flex items-center gap-2 mt-2">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  {language === 'ar' ? 'السعر:' : 'Price:'} <span dir="ltr">{
                    item.price_min && item.price_max ? (
                      item.price_min === item.price_max 
                        ? formatPrice(item.price_min)
                        : `${formatPrice(item.price_min)} - ${formatPrice(item.price_max)}`
                    ) : (
                      formatPrice(item.price)
                    )
                  }</span>
                  {settings?.showIncludeVat && (
                    <span className="text-[10px] opacity-90">
                      {language === 'ar' ? ' (شامل الضريبة)' : ' (Inc. VAT)'}
                    </span>
                  )}
                </span>
                {item.sub_items && (
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium">
                    {item.sub_items.length} {language === 'ar' ? 'خيارات' : 'options'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Content - scrollable area with better mobile height */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 8rem)' }}>
            {/* Quick info bar */}
            {item.allergens && item.allergens.length > 0 && (
              <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-amber-800">
                    {language === 'ar' ? 'تحتوي على' : 'Contains'}:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {item.allergens.map((allergen, idx) => (
                      <AllergenSVGIcon 
                        key={idx}
                        iconPath={typeof allergen === 'object' ? allergen.iconUrl : `/src/assets/allergy_icons/${allergen}.svg`}
                        size="w-4 h-4"
                        className=""
                        primaryColor="#d97706"
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-items list */}
            <div className="p-3 sm:p-6">
              {/* Section title - smaller on mobile */}
              <div className="mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">
                  {language === 'ar' ? 'اختر من الخيارات التالية' : 'Choose your option'}
                </h3>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {language === 'ar' ? 'اضغط على أي خيار لعرض التفاصيل الكاملة' : 'Tap any option to view full details'}
                </p>
              </div>

              {/* Mobile: Optimized Grid View */}
              <div className="block sm:hidden">
                <div className="grid grid-cols-2 gap-3">
                  {item.sub_items && item.sub_items.length > 0 ? (
                    item.sub_items
                      .sort((a, b) => (a.sub_item_order || 0) - (b.sub_item_order || 0))
                      .map(subItem => (
                        <div key={subItem.id} onClick={(e) => handleSubItemClick(e, subItem)}
                             className={`bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
                               subItem.is_upsell ? 'ring-2' : 'border border-gray-100'
                             }`}
                             style={subItem.is_upsell ? {
                               borderColor: subItem.upsell_border_color || '#FFD700',
                               '--tw-ring-color': subItem.upsell_border_color || '#FFD700'
                             } : {}}>
                          {/* Image section */}
                          {subItem.image && (
                            <div className="relative h-28 bg-gray-100">
                              <LazyImage 
                                src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${subItem.image}`}
                                alt={subItem.name}
                                className="w-full h-full object-cover"
                              />
                              {/* Upsell badge if applicable */}
                              {subItem.is_upsell && subItem.upsell_badge_text && (
                                <div className="absolute top-2 left-2">
                                  <div 
                                    className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-md flex items-center gap-1"
                                    style={{ backgroundColor: subItem.upsell_badge_color || '#FFD700' }}
                                  >
                                    <span className="text-xs">
                                      {subItem.upsell_icon === 'star' ? '⭐' :
                                       subItem.upsell_icon === 'fire' ? '🔥' :
                                       subItem.upsell_icon === 'crown' ? '👑' :
                                       subItem.upsell_icon === 'diamond' ? '💎' : '✨'}
                                    </span>
                                    {subItem.upsell_badge_text}
                                  </div>
                                </div>
                              )}
                              {/* Price badge overlay */}
                              <div className="absolute top-2 right-2">
                                <div className="px-2 py-1 bg-white/95 backdrop-blur-sm rounded-lg shadow-md">
                                  <span className="font-bold text-sm" style={{ color: primaryColor }}>
                                    {formatPrice(subItem.price)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Content section */}
                          <div className="p-3" style={subItem.is_upsell && !subItem.image ? {
                            backgroundColor: `${subItem.upsell_background_color || '#FFFBF0'}`,
                          } : {}}>
                            {/* Upsell badge for items without image */}
                            {subItem.is_upsell && subItem.upsell_badge_text && !subItem.image && (
                              <div className="mb-2">
                                <span 
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold text-white"
                                  style={{ backgroundColor: subItem.upsell_badge_color || '#FFD700' }}
                                >
                                  <span className="text-[10px]">
                                    {subItem.upsell_icon === 'star' ? '⭐' :
                                     subItem.upsell_icon === 'fire' ? '🔥' :
                                     subItem.upsell_icon === 'crown' ? '👑' :
                                     subItem.upsell_icon === 'diamond' ? '💎' : '✨'}
                                  </span>
                                  {subItem.upsell_badge_text}
                                </span>
                              </div>
                            )}
                            <h4 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1.5">
                              {language === 'ar' && (subItem.nameAr || subItem.name_ar) ? (subItem.nameAr || subItem.name_ar) : subItem.name}
                            </h4>
                            
                            {/* Quick info pills */}
                            <div className="flex flex-wrap gap-1 mb-2">
                              {subItem.calories && (
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded text-[10px] font-medium">
                                  {subItem.calories} cal
                                </span>
                              )}
                              {subItem.preparationTime && (
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium">
                                  {subItem.preparationTime} min
                                </span>
                              )}
                              {(subItem.vegetarian || subItem.vegan) && (
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-medium">
                                  {subItem.vegan ? (language === 'ar' ? 'نباتي صرف' : 'Vegan') : (language === 'ar' ? 'نباتي' : 'Veg')}
                                </span>
                              )}
                            </div>
                            
                            {/* If no image, show price here */}
                            {!subItem.image && (
                              <div className="flex items-center justify-between mt-2">
                                <span className="font-bold text-lg" style={{ color: primaryColor }}>
                                  {formatPrice(subItem.price)}
                                </span>
                                {settings?.showIncludeVat && (
                                  <span className="text-[9px] text-gray-500">
                                    {language === 'ar' ? 'شامل الضريبة' : 'Inc. VAT'}
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {/* Tap indicator */}
                            <div className="flex items-center justify-center mt-2 pt-2 border-t border-gray-50">
                              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                {language === 'ar' ? 'اضغط للتفاصيل' : 'Tap for details'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-gray-500 text-center py-8 col-span-2">
                      {language === 'ar' ? 'لا توجد خيارات متاحة' : 'No options available'}
                    </p>
                  )}
                </div>
              </div>

              {/* Desktop: Original vertical layout */}
              <div className="hidden sm:block space-y-3">
                {item.sub_items && item.sub_items.length > 0 ? (
                  item.sub_items
                    .sort((a, b) => (a.sub_item_order || 0) - (b.sub_item_order || 0))
                    .map(subItem => renderSubItem(subItem))
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    {language === 'ar' ? 'لا توجد خيارات متاحة' : 'No options available'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Nutrition Modal for sub-item */}
      {showNutritionModal && selectedSubItem && (
        <AmazingNutritionModal
          item={selectedSubItem}
          isOpen={showNutritionModal}
          language={language}
          formatCategory={formatCategory}
          onClose={() => {
            setShowNutritionModal(false);
            setSelectedSubItem(null);
          }}
          settings={settings}
        />
      )}
    </>
  );
};

export default MultiItemModal;