import React from 'react';
import CustomAllergenIcons from './CustomAllergenIcons';
import DietaryIcons from './DietaryIcons';

const LuxuryNutritionModal = ({ item, isOpen, onClose, language, formatCategory }) => {
  if (!isOpen) return null;

  const formatLabel = (label, labelAr) => {
    return language === 'ar' ? labelAr : label;
  };
  
  const formatCategoryName = (category) => {
    if (formatCategory) {
      return formatCategory(category);
    }
    const categoryMap = {
      'appetizers': language === 'ar' ? 'المقبلات' : 'Appetizers',
      'mains': language === 'ar' ? 'الأطباق الرئيسية' : 'Main Courses',
      'desserts': language === 'ar' ? 'الحلويات' : 'Desserts',
      'beverages': language === 'ar' ? 'المشروبات' : 'Beverages'
    };
    return categoryMap[category] || category;
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header with Image or Gradient */}
        <div className="relative">
          {item.image ? (
            <div className="relative h-64">
              <img 
                src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${item.image}`}
                alt={language === 'ar' && item.nameAr ? item.nameAr : item.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <p className="text-sm opacity-90 mb-1">{formatCategoryName(item.category)}</p>
                <h2 className="text-3xl font-bold mb-2">
                  {language === 'ar' && item.nameAr ? item.nameAr : item.name}
                </h2>
                <div className="text-2xl font-light">{item.price}</div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-900 to-gray-700 p-8 text-white">
              <p className="text-sm opacity-90 mb-1">{formatCategoryName(item.category)}</p>
              <h2 className="text-3xl font-bold mb-2">
                {language === 'ar' && item.nameAr ? item.nameAr : item.name}
              </h2>
              <div className="text-2xl font-light">{item.price}</div>
            </div>
          )}
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-16rem)] p-6">
          {/* Description */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {formatLabel('Description', 'الوصف')}
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {language === 'ar' && item.descriptionAr ? item.descriptionAr : item.description}
            </p>
          </div>
          
          {/* Nutrition Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {item.calories && (
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{item.calories}</div>
                <div className="text-xs text-gray-500 mt-1">{formatLabel('Calories', 'سعرات')}</div>
              </div>
            )}
            {item.preparationTime && (
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{item.preparationTime}</div>
                <div className="text-xs text-gray-500 mt-1">{formatLabel('Minutes', 'دقيقة')}</div>
              </div>
            )}
            {item.servingSize && (
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-lg font-bold text-gray-900">{item.servingSize.split(' ')[0]}</div>
                <div className="text-xs text-gray-500 mt-1">{formatLabel('Serving', 'حصة')}</div>
              </div>
            )}
          </div>
          
          {/* Exercise Section */}
          {(item.walkMinutes || item.runMinutes) && (
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                {formatLabel('Burn These Calories With', 'احرق هذه السعرات مع')}
              </h3>
              <div className="flex justify-around">
                {item.walkMinutes && (
                  <div className="text-center">
                    <div className="text-3xl mb-1">🚶</div>
                    <div className="text-xl font-bold text-blue-700">{item.walkMinutes}</div>
                    <div className="text-xs text-gray-600">{formatLabel('min walk', 'دقيقة مشي')}</div>
                  </div>
                )}
                {item.runMinutes && (
                  <div className="text-center">
                    <div className="text-3xl mb-1">🏃</div>
                    <div className="text-xl font-bold text-purple-700">{item.runMinutes}</div>
                    <div className="text-xs text-gray-600">{formatLabel('min run', 'دقيقة جري')}</div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Dietary Information */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {formatLabel('Dietary Information', 'معلومات النظام الغذائي')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {item.halal && (
                <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium flex items-center gap-2">
                  <DietaryIcons type="halal" size="w-4 h-4" />
                  <span>{language === 'ar' ? 'حلال' : 'Halal'}</span>
                </span>
              )}
              {item.vegetarian && (
                <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-2">
                  <DietaryIcons type="vegetarian" size="w-4 h-4" />
                  <span>{language === 'ar' ? 'نباتي' : 'Vegetarian'}</span>
                </span>
              )}
              {item.vegan && (
                <span className="px-4 py-2 bg-lime-100 text-lime-700 rounded-full text-sm font-medium flex items-center gap-2">
                  <DietaryIcons type="vegan" size="w-4 h-4" />
                  <span>{language === 'ar' ? 'نباتي صرف' : 'Vegan'}</span>
                </span>
              )}
              {item.glutenFree && (
                <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                  {language === 'ar' ? 'خالي من الجلوتين' : 'Gluten Free'}
                </span>
              )}
              {item.dairyFree && (
                <span className="px-4 py-2 bg-sky-100 text-sky-700 rounded-full text-sm font-medium">
                  {language === 'ar' ? 'خالي من الألبان' : 'Dairy Free'}
                </span>
              )}
              {item.nutFree && (
                <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  {language === 'ar' ? 'خالي من المكسرات' : 'Nut Free'}
                </span>
              )}
            </div>
          </div>
          
          {/* Warnings */}
          {(item.spicyLevel > 0 || item.highSodium || item.containsCaffeine || (item.allergens && item.allergens.length > 0)) && (
            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <h3 className="text-sm font-semibold text-red-800 mb-3">
                {formatLabel('Important Information', 'معلومات مهمة')}
              </h3>
              <div className="space-y-2">
                {item.spicyLevel > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{'🌶️'.repeat(item.spicyLevel)}</span>
                    <span className="text-sm text-red-700">
                      {formatLabel(`Spicy Level ${item.spicyLevel}`, `مستوى الحرارة ${item.spicyLevel}`)}
                    </span>
                  </div>
                )}
                
                {item.highSodium && (
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🧂</span>
                    <span className="text-sm text-orange-700">
                      {formatLabel('High Sodium Content', 'محتوى صوديوم عالي')}
                    </span>
                  </div>
                )}
                
                {item.containsCaffeine && (
                  <div className="flex items-center gap-3">
                    <span className="text-lg">☕</span>
                    <span className="text-sm text-amber-700">
                      {formatLabel('Contains Caffeine', 'يحتوي على كافيين')}
                    </span>
                  </div>
                )}
                
                {item.allergens && item.allergens.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-red-700 mb-2">
                      {formatLabel('Contains:', 'يحتوي على:')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <CustomAllergenIcons allergens={item.allergens} size="w-6 h-6" showLabels={true} language={language} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LuxuryNutritionModal;