import React, { useState } from 'react';
import AmazingNutritionModal from './AmazingNutritionModal';
import AllergenSVGIcon from './AllergenSVGIcon';
import LazyImage from './LazyImage';

const MultiItemModal = ({ item, language, onClose, settings }) => {
  const [selectedSubItem, setSelectedSubItem] = useState(null);
  const [showNutritionModal, setShowNutritionModal] = useState(false);

  const primaryColor = settings?.primaryColor || '#00594f';

  const formatPrice = (price) => {
    return price || '0';
  };

  const handleSubItemClick = (e, subItem) => {
    e.stopPropagation();
    setSelectedSubItem(subItem);
    setShowNutritionModal(true);
  };

  const renderSubItem = (subItem) => {
    return (
      <div
        key={subItem.id}
        className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 flex flex-col"
        onClick={(e) => handleSubItemClick(e, subItem)}
      >
        {/* Sub-item image - only show if image exists */}
        {subItem.image && (
          <div className="relative h-40 sm:h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-xl overflow-hidden flex-shrink-0">
            <LazyImage 
              src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${subItem.image}`}
              alt={subItem.name}
              className="w-full h-full object-cover"
              placeholder="/images/placeholder.svg"
            />
          </div>
        )}

        {/* Sub-item content */}
        <div className={`p-4 flex-1 flex flex-col ${!subItem.image ? 'rounded-t-xl' : ''}`}>
          <div className="flex-1">
            <h3 className="font-semibold text-base sm:text-lg text-gray-800 mb-2 line-clamp-2">
              {language === 'ar' && (subItem.nameAr || subItem.name_ar) ? (subItem.nameAr || subItem.name_ar) : subItem.name}
            </h3>
            
            {(subItem.description || subItem.description_en) && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {language === 'ar' && (subItem.descriptionAr || subItem.description_ar) ? (subItem.descriptionAr || subItem.description_ar) : (subItem.description || subItem.description_en)}
              </p>
            )}
          </div>

          <div className="mt-auto pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-bold" style={{ color: primaryColor }}>
                {formatPrice(subItem.price)}
              </span>
              
              {subItem.calories && (
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <span>🔥</span>
                  {subItem.calories} {language === 'ar' ? 'سعرة' : 'cal'}
                </span>
              )}
            </div>

            {/* Allergens */}
            {subItem.allergens && subItem.allergens.length > 0 && (
              <div className="flex gap-1 pt-2 border-t border-gray-100">
                {subItem.allergens.slice(0, 4).map((allergen, idx) => (
                  <AllergenSVGIcon 
                    key={idx}
                    allergenName={typeof allergen === 'object' ? allergen.name : allergen}
                    className="w-4 h-4"
                  />
                ))}
                {subItem.allergens.length > 4 && (
                  <span className="text-xs text-gray-500 ml-1">+{subItem.allergens.length - 4}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Multi-item Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
          {/* Header with image */}
          <div className="relative h-48 sm:h-64 bg-gradient-to-br from-gray-100 to-gray-200">
            {item.image ? (
              <>
                <img 
                  src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${item.image}`}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              </>
            ) : (
              <div 
                className="w-full h-full"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`
                }}
              />
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Title on image */}
            <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
                {language === 'ar' && item.nameAr ? item.nameAr : item.name}
              </h2>
              {item.description && (
                <p className="text-white/90 text-base sm:text-lg line-clamp-2 sm:line-clamp-none">
                  {language === 'ar' && item.descriptionAr ? item.descriptionAr : item.description}
                </p>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-12rem)] sm:max-h-[calc(90vh-16rem)]">
            {/* Price range info */}
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">
                {language === 'ar' ? 'نطاق السعر' : 'Price Range'}
              </p>
              <p className="text-xl sm:text-2xl font-bold" style={{ color: primaryColor }}>
                {item.price_min && item.price_max ? (
                  item.price_min === item.price_max 
                    ? formatPrice(item.price_min)
                    : `${formatPrice(item.price_min)} - ${formatPrice(item.price_max)}`
                ) : (
                  formatPrice(item.price)
                )}
              </p>
            </div>

            {/* Section title */}
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
              {language === 'ar' ? 'اختر من الخيارات التالية' : 'Choose from the following options'}
            </h3>

            {/* Sub-items grid */}
            <div className={`grid gap-3 sm:gap-4 ${item.display_as_grid && item.sub_items?.length > 2 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
              {item.sub_items && item.sub_items.length > 0 ? (
                item.sub_items
                  .sort((a, b) => (a.sub_item_order || 0) - (b.sub_item_order || 0))
                  .map(subItem => renderSubItem(subItem))
              ) : (
                <p className="text-gray-500 text-center py-8 col-span-2">
                  {language === 'ar' ? 'لا توجد خيارات متاحة' : 'No options available'}
                </p>
              )}
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