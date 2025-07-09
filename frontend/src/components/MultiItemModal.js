import React, { useState } from 'react';
import AmazingNutritionModal from './AmazingNutritionModal';
import AllergenSVGIcon from './AllergenSVGIcon';
import LazyImage from './LazyImage';

const MultiItemModal = ({ item, language, onClose, settings, formatCategory }) => {
  const [selectedSubItem, setSelectedSubItem] = useState(null);
  const [showNutritionModal, setShowNutritionModal] = useState(false);

  const primaryColor = settings?.primaryColor || '#00594f';

  const formatPrice = (price) => {
    return price || '0';
  };

  const handleSubItemClick = (e, subItem) => {
    e.stopPropagation();
    
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
        `}
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
              
              {/* Price badge - positioned to avoid overlap */}
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                <div 
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl font-bold text-lg sm:text-xl"
                  style={{ color: primaryColor }}
                >
                  {formatPrice(subItem.price)}
                  {settings?.showIncludeVat && (
                    <div className="text-[9px] sm:text-[10px] font-normal opacity-75 mt-0.5">
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
                  <span className="text-xs sm:text-sm text-gray-500 ml-2">
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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
        {/* Modal container - slides up from bottom on mobile */}
        <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-4xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden animate-slide-up sm:animate-fade-in">
          {/* Header with swipe indicator for mobile */}
          <div className="sm:hidden sticky top-0 z-10 bg-white px-4 py-2">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto"></div>
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

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 bg-black/20 backdrop-blur-sm rounded-full text-white hover:bg-black/30 transition-colors"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium">
                  {language === 'ar' ? 'السعر' : 'Price'}: {
                    item.price_min && item.price_max ? (
                      item.price_min === item.price_max 
                        ? formatPrice(item.price_min)
                        : `${formatPrice(item.price_min)} - ${formatPrice(item.price_max)}`
                    ) : (
                      formatPrice(item.price)
                    )
                  }
                  {settings?.showIncludeVat && (
                    <span className="text-[10px] ml-1 opacity-90">
                      ({language === 'ar' ? 'شامل الضريبة' : 'Inc. VAT'})
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

          {/* Content - scrollable area */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 10rem)' }}>
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
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 px-1">
                {language === 'ar' ? 'اختر من الخيارات التالية' : 'Choose your option'}
              </h3>

              {/* Sub-items - single column on mobile for better readability */}
              <div className="space-y-3">
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