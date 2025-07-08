import React, { useState } from 'react';
import AmazingNutritionModal from './AmazingNutritionModal';

const SubItemModal = ({ multiItem, subItems, isOpen, onClose, language, settings }) => {
  const [selectedSubItem, setSelectedSubItem] = useState(null);
  const [showNutritionModal, setShowNutritionModal] = useState(false);

  if (!isOpen) return null;

  // Get primary color from settings
  const primaryColor = settings?.primaryColor || '#00594f';

  // Format price
  const formatPrice = (price) => {
    return price || '0';
  };

  const handleSubItemClick = (subItem) => {
    setSelectedSubItem(subItem);
    setShowNutritionModal(true);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div 
            className="text-white p-6"
            style={{
              background: `linear-gradient(to bottom right, ${primaryColor}, ${primaryColor}dd)`
            }}
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {language === 'ar' && multiItem.nameAr ? multiItem.nameAr : multiItem.name}
                </h2>
                {multiItem.description && (
                  <p className="text-white/90">
                    {language === 'ar' && multiItem.descriptionAr ? multiItem.descriptionAr : multiItem.description}
                  </p>
                )}
                {multiItem.price_min !== null && multiItem.price_max !== null && (
                  <p className="text-lg font-semibold mt-3">
                    {language === 'ar' ? 'السعر: ' : 'Price Range: '}
                    {formatPrice(multiItem.price_min)} - {formatPrice(multiItem.price_max)}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Sub-items Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {subItems && subItems.length > 0 ? (
              <div className={`grid ${multiItem.display_as_grid ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-4`}>
                {subItems.map((subItem) => (
                  <div
                    key={subItem.id}
                    className="bg-gray-50 rounded-xl p-4 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105"
                    onClick={() => handleSubItemClick(subItem)}
                  >
                    {/* Sub-item Image */}
                    {subItem.image && (
                      <div className="h-32 mb-3 overflow-hidden rounded-lg">
                        <img 
                          src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${subItem.image}`}
                          alt={subItem.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Sub-item Details */}
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {language === 'ar' && subItem.nameAr ? subItem.nameAr : subItem.name}
                    </h3>
                    
                    {subItem.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {language === 'ar' && subItem.descriptionAr ? subItem.descriptionAr : subItem.description}
                      </p>
                    )}

                    {/* Sub-item Price */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-lg font-bold" style={{ color: primaryColor }}>
                        {formatPrice(subItem.price)}
                      </div>
                      
                      {/* Quick info badges */}
                      <div className="flex gap-2">
                        {subItem.calories && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                            {subItem.calories} cal
                          </span>
                        )}
                        {subItem.spicyLevel > 0 && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                            {'🌶️'.repeat(Math.min(subItem.spicyLevel, 3))}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dietary badges */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {subItem.vegetarian && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          {language === 'ar' ? 'نباتي' : 'Vegetarian'}
                        </span>
                      )}
                      {subItem.vegan && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          {language === 'ar' ? 'نباتي صرف' : 'Vegan'}
                        </span>
                      )}
                      {subItem.glutenFree && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          {language === 'ar' ? 'خالي من الجلوتين' : 'Gluten Free'}
                        </span>
                      )}
                    </div>

                    {/* Click for details indicator */}
                    <div className="mt-3 pt-3 border-t text-center">
                      <span className="text-xs text-gray-500">
                        {language === 'ar' ? 'اضغط للتفاصيل' : 'Click for details'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {language === 'ar' ? 'لا توجد خيارات متاحة' : 'No options available'}
                </p>
              </div>
            )}

            {/* Info Note */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                {language === 'ar' 
                  ? 'اختر من الخيارات أعلاه لعرض التفاصيل الكاملة بما في ذلك المعلومات الغذائية والمكونات'
                  : 'Select from the options above to view full details including nutritional information and ingredients'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Nutrition Modal for selected sub-item */}
      {selectedSubItem && (
        <AmazingNutritionModal 
          item={selectedSubItem}
          isOpen={showNutritionModal}
          onClose={() => {
            setShowNutritionModal(false);
            setSelectedSubItem(null);
          }}
          language={language}
          settings={settings}
        />
      )}
    </>
  );
};

export default SubItemModal;