import React from 'react';
import AllergenIcons from './AllergenIcons';
import DietaryIcons, { dietaryInfo } from './DietaryIcons';

const NutritionModal = ({ item, isOpen, onClose, language, formatCategory, categories }) => {
  if (!isOpen) return null;

  const formatLabel = (label, labelAr) => {
    return language === 'ar' ? labelAr : label;
  };
  
  const formatCategoryName = (category) => {
    if (formatCategory) {
      return formatCategory(category);
    }
    // Fallback formatting if formatCategory is not provided
    const categoryMap = {
      'appetizers': language === 'ar' ? 'المقبلات' : 'Appetizers',
      'mains': language === 'ar' ? 'الأطباق الرئيسية' : 'Main Courses',
      'desserts': language === 'ar' ? 'الحلويات' : 'Desserts',
      'beverages': language === 'ar' ? 'المشروبات' : 'Beverages'
    };
    return categoryMap[category] || category;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center md:p-4 z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-t-3xl md:rounded-3xl max-w-2xl w-full max-h-[85vh] md:max-h-[90vh] overflow-hidden animate-slideUp md:animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Mobile swipe handle */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>
        
        {/* Scrollable content */}
        <div className="overflow-y-auto max-h-[calc(85vh-2rem)] md:max-h-[calc(90vh-2rem)]">
          {/* Hero section with image */}
          {item.image ? (
            <div className="relative h-48 md:h-64">
              <img 
                src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${item.image}`}
                alt={language === 'ar' && item.nameAr ? item.nameAr : item.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              
              {/* Title overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h2 className="text-2xl md:text-3xl font-playfair font-bold mb-1">
                  {language === 'ar' && item.nameAr ? item.nameAr : item.name}
                </h2>
                <p className="text-sm opacity-90">
                  {formatCategoryName(item.category)}
                </p>
              </div>
              
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
          ) : (
            <div className="bg-gradient-to-br from-primary to-primary-dark p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl md:text-3xl font-playfair font-bold mb-1">
                    {language === 'ar' && item.nameAr ? item.nameAr : item.name}
                  </h2>
                  <p className="text-sm opacity-90">
                    {formatCategoryName(item.category)}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          {/* Content sections */}
          <div className="p-4 md:p-6 space-y-4">
            {/* Price section */}
            <div className="bg-gradient-to-br from-gold/10 to-primary/10 rounded-2xl p-4 text-center">
              <div className="text-3xl font-light text-primary mb-1">
                {item.price}
              </div>
              {item.priceWithoutVat && (
                <p className="text-xs text-gray-600">
                  {language === 'ar' ? 'السعر قبل الضريبة: ' : 'Price before VAT: '}{item.priceWithoutVat}
                </p>
              )}
            </div>
            
            {/* Description */}
            <div>
              <h3 className="font-semibold text-primary mb-2 text-sm uppercase tracking-wider">
                {formatLabel('Description', 'الوصف')}
              </h3>
              <p className="text-gray-700 leading-relaxed text-sm">
                {language === 'ar' && item.descriptionAr ? item.descriptionAr : item.description}
              </p>
            </div>
            
            {/* Quick stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {item.calories && (
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-semibold text-primary mb-1">{item.calories}</div>
                  <div className="text-xs text-gray-600">{formatLabel('Calories', 'سعرات')}</div>
                </div>
              )}
              
              {item.preparationTime && (
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-semibold text-primary mb-1">{item.preparationTime}</div>
                  <div className="text-xs text-gray-600">{formatLabel('Minutes', 'دقيقة')}</div>
                </div>
              )}
              
              {item.servingSize && (
                <div className="bg-gray-50 rounded-xl p-3 text-center col-span-2">
                  <div className="text-lg font-semibold text-primary mb-1">{item.servingSize}</div>
                  <div className="text-xs text-gray-600">{formatLabel('Serving Size', 'حجم الحصة')}</div>
                </div>
              )}
            </div>
            
            {/* Exercise to burn */}
            {(item.walkMinutes || item.runMinutes) && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4">
                <h3 className="font-semibold text-primary mb-3 text-sm uppercase tracking-wider">
                  {formatLabel('Exercise to Burn Calories', 'التمارين لحرق السعرات')}
                </h3>
                <div className="flex justify-around">
                  {item.walkMinutes && (
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-2 bg-white rounded-full flex items-center justify-center shadow-md">
                        <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M14.12,10H19V8.2H15.38L13.38,4.87C13.08,4.37 12.54,4.03 11.92,4.03C11.74,4.03 11.58,4.06 11.42,4.11L6,5.8V11H7.8V7.33L9.91,6.67L6,22H7.8L10.67,13.89L13,17V22H14.8V15.59L12.31,11.05L13.04,8.18M14,3.8C15,3.8 15.8,3 15.8,2C15.8,1 15,0.2 14,0.2C13,0.2 12.2,1 12.2,2C12.2,3 13,3.8 14,3.8Z"/>
                        </svg>
                      </div>
                      <div className="text-xl font-semibold text-gray-800">{item.walkMinutes}</div>
                      <div className="text-xs text-gray-600">{formatLabel('min walk', 'دقيقة مشي')}</div>
                    </div>
                  )}
                  {item.runMinutes && (
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-2 bg-white rounded-full flex items-center justify-center shadow-md">
                        <svg className="w-8 h-8 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M13.5,5.5C14.59,5.5 15.5,4.58 15.5,3.5C15.5,2.38 14.59,1.5 13.5,1.5C12.39,1.5 11.5,2.38 11.5,3.5C11.5,4.58 12.39,5.5 13.5,5.5M9.89,19.38L10.89,15L13,17V23H15V15.5L12.89,13.5L13.5,10.5C14.79,12 16.79,13 19,13V11C17.09,11 15.5,10 14.69,8.58L13.69,7C13.29,6.38 12.69,6 12,6C11.69,6 11.5,6.08 11.19,6.08L6,8.28V13H8V9.58L9.79,8.88L8.19,17L3.29,16L2.89,18L9.89,19.38Z"/>
                        </svg>
                      </div>
                      <div className="text-xl font-semibold text-gray-800">{item.runMinutes}</div>
                      <div className="text-xs text-gray-600">{formatLabel('min run', 'دقيقة جري')}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Dietary badges */}
            <div>
              <h3 className="font-semibold text-primary mb-3 text-sm uppercase tracking-wider">
                {formatLabel('Dietary Information', 'معلومات النظام الغذائي')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {item.halal && (
                  <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                    <DietaryIcons type="halal" size="w-4 h-4" />
                    <span>{language === 'ar' ? 'حلال' : 'Halal'}</span>
                  </div>
                )}
                {item.vegetarian && (
                  <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                    <DietaryIcons type="vegetarian" size="w-4 h-4" />
                    <span>{language === 'ar' ? 'نباتي' : 'Vegetarian'}</span>
                  </div>
                )}
                {item.vegan && (
                  <div className="bg-lime-100 text-lime-800 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                    <DietaryIcons type="vegan" size="w-4 h-4" />
                    <span>{language === 'ar' ? 'نباتي صرف' : 'Vegan'}</span>
                  </div>
                )}
                {item.glutenFree && (
                  <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium">
                    <span>{language === 'ar' ? 'خالي من الجلوتين' : 'Gluten Free'}</span>
                  </div>
                )}
                {item.dairyFree && (
                  <div className="bg-sky-100 text-sky-800 px-4 py-2 rounded-full text-sm font-medium">
                    <span>{language === 'ar' ? 'خالي من الألبان' : 'Dairy Free'}</span>
                  </div>
                )}
                {item.nutFree && (
                  <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
                    <span>{language === 'ar' ? 'خالي من المكسرات' : 'Nut Free'}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Warnings section */}
            {(item.spicyLevel > 0 || item.highSodium || item.containsCaffeine || (item.allergens && item.allergens.length > 0)) && (
              <div className="bg-red-50 rounded-2xl p-4">
                <h3 className="font-semibold text-red-800 mb-3 text-sm uppercase tracking-wider">
                  {formatLabel('Important Information', 'معلومات مهمة')}
                </h3>
                <div className="space-y-2">
                  {item.spicyLevel > 0 && (
                    <div className="flex items-center gap-3 text-red-700">
                      <div className="flex gap-1">
                        {[...Array(3)].map((_, i) => (
                          <span key={i} className={`text-lg ${i < item.spicyLevel ? 'text-red-600' : 'text-red-300'}`}>
                            🌶️
                          </span>
                        ))}
                      </div>
                      <span className="text-sm font-medium">
                        {formatLabel(`Spicy Level ${item.spicyLevel}`, `مستوى الحرارة ${item.spicyLevel}`)}
                      </span>
                    </div>
                  )}
                  
                  {item.highSodium && (
                    <div className="flex items-center gap-3 text-orange-700">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-sm">🧂</span>
                      </div>
                      <span className="text-sm font-medium">
                        {formatLabel('High Sodium Content', 'محتوى صوديوم عالي')}
                      </span>
                    </div>
                  )}
                  
                  {item.containsCaffeine && (
                    <div className="flex items-center gap-3 text-amber-700">
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                        <span className="text-sm">☕</span>
                      </div>
                      <span className="text-sm font-medium">
                        {formatLabel('Contains Caffeine', 'يحتوي على كافيين')}
                      </span>
                    </div>
                  )}
                  
                  {item.allergens && item.allergens.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-red-700 mb-2">
                        {formatLabel('Contains Allergens:', 'يحتوي على مسببات الحساسية:')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <AllergenIcons allergens={item.allergens} size="w-6 h-6" showLabels={true} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NutritionModal;