import React from 'react';
import CustomAllergenIcons from './CustomAllergenIcons';
import DietaryIcons from './DietaryIcons';

const GuestFriendlyNutritionModal = ({ item, isOpen, onClose, language, formatCategory }) => {
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

  const hasNutritionLabel = item.totalFat !== null || item.protein !== null || item.totalCarbs !== null || item.sodium !== null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <p className="text-sm opacity-90 mb-1">{formatCategoryName(item.category)}</p>
                <h2 className="text-3xl font-bold mb-2">
                  {language === 'ar' && item.nameAr ? item.nameAr : item.name}
                </h2>
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-light">{item.price}</span>
                  {item.priceWithoutVat && (
                    <span className="text-sm opacity-80">
                      ({formatLabel('Before VAT: ', 'قبل الضريبة: ')}{item.priceWithoutVat})
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-[#00594f] to-[#003d35] p-8 text-white">
              <p className="text-sm opacity-90 mb-1">{formatCategoryName(item.category)}</p>
              <h2 className="text-3xl font-bold mb-2">
                {language === 'ar' && item.nameAr ? item.nameAr : item.name}
              </h2>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-light">{item.price}</span>
                {item.priceWithoutVat && (
                  <span className="text-sm opacity-80">
                    ({formatLabel('Before VAT: ', 'قبل الضريبة: ')}{item.priceWithoutVat})
                  </span>
                )}
              </div>
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
          {/* General Information Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              {formatLabel('General Information', 'معلومات عامة')}
            </h3>
            
            {/* Description */}
            <div className="mb-4">
              <p className="text-gray-700 leading-relaxed">
                {language === 'ar' && item.descriptionAr ? item.descriptionAr : item.description}
              </p>
            </div>
            
            {/* Key Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {item.calories !== null && (
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
                  <div className="text-lg font-bold text-gray-900">{item.servingSize}</div>
                  <div className="text-xs text-gray-500 mt-1">{formatLabel('Serving', 'حصة')}</div>
                </div>
              )}
              {item.spicyLevel > 0 && (
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <div className="text-xl">{'🌶️'.repeat(item.spicyLevel)}</div>
                  <div className="text-xs text-gray-500 mt-1">{formatLabel('Spicy Level', 'مستوى الحرارة')}</div>
                </div>
              )}
            </div>
            
            {/* Exercise Section */}
            {(item.walkMinutes || item.runMinutes) && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-5 mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  {formatLabel('Burn These Calories With:', 'احرق هذه السعرات مع:')}
                </h4>
                <div className="flex justify-around">
                  {item.walkMinutes && (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-2">
                        <span className="text-3xl">🚶</span>
                      </div>
                      <div className="text-xl font-bold text-blue-700">{item.walkMinutes}</div>
                      <div className="text-xs text-gray-600">{formatLabel('min walk', 'دقيقة مشي')}</div>
                    </div>
                  )}
                  {item.runMinutes && (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-2">
                        <span className="text-3xl">🏃</span>
                      </div>
                      <div className="text-xl font-bold text-purple-700">{item.runMinutes}</div>
                      <div className="text-xs text-gray-600">{formatLabel('min run', 'دقيقة جري')}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Dietary Information */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                {formatLabel('Dietary Information', 'معلومات النظام الغذائي')}
              </h4>
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
            
            {/* Warnings - Luxury Style */}
            {(item.highSodium || item.containsCaffeine || (item.allergens && item.allergens.length > 0)) && (
              <div className="relative bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-5 border border-amber-200/50 shadow-sm">
                <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center shadow-md">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                
                <h4 className="text-sm font-bold text-amber-800 mb-3 uppercase tracking-wider">
                  {formatLabel('Important Information', 'معلومات مهمة')}
                </h4>
                
                <div className="space-y-3">
                  {item.highSodium && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-200/50 rounded-full flex items-center justify-center">
                        <span className="text-base">🧂</span>
                      </div>
                      <span className="text-sm text-amber-800 font-medium">
                        {formatLabel('High Sodium Content', 'محتوى صوديوم عالي')}
                      </span>
                    </div>
                  )}
                  
                  {item.containsCaffeine && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-200/50 rounded-full flex items-center justify-center">
                        <span className="text-base">☕</span>
                      </div>
                      <span className="text-sm text-amber-800 font-medium">
                        {formatLabel('Contains Caffeine', 'يحتوي على كافيين')}
                      </span>
                    </div>
                  )}
                  
                  {item.allergens && item.allergens.length > 0 && (
                    <div className="pt-2">
                      <p className="text-sm font-semibold text-amber-800 mb-3">
                        {formatLabel('Contains:', 'يحتوي على:')}
                      </p>
                      <div className="bg-white/50 rounded-lg p-3">
                        <CustomAllergenIcons allergens={item.allergens} size="w-6 h-6" showLabels={true} language={language} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Nutrition Facts Label Section */}
          {hasNutritionLabel && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                {formatLabel('Nutrition Facts', 'حقائق التغذية')}
              </h3>
              
              <div className="bg-white border-4 border-black rounded-lg p-4 max-w-sm mx-auto">
                <h2 className="text-2xl font-black text-center mb-1">Nutrition Facts</h2>
                {item.servingSize && (
                  <p className="text-sm text-center border-b-2 border-black pb-2 mb-2">
                    Serving Size: {item.servingSize}
                  </p>
                )}
                
                <div className="border-b-8 border-black pb-1 mb-2">
                  <p className="text-xs font-bold">Amount Per Serving</p>
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-xl font-black">Calories</h3>
                    <span className="text-2xl font-black">{item.calories || 0}</span>
                  </div>
                </div>
                
                <p className="text-right text-xs font-bold mb-1">% Daily Value*</p>
                
                <div className="space-y-1">
                  {item.totalFat !== null && (
                    <div className="flex justify-between border-b border-gray-300 pb-1">
                      <span className="text-sm">
                        <strong>Total Fat</strong> {item.totalFat}g
                      </span>
                      <span className="text-sm font-bold">{Math.round((item.totalFat / 65) * 100)}%</span>
                    </div>
                  )}
                  
                  {item.saturatedFat !== null && (
                    <div className="flex justify-between border-b border-gray-300 pb-1 ml-4">
                      <span className="text-sm">Saturated Fat {item.saturatedFat}g</span>
                      <span className="text-sm font-bold">{Math.round((item.saturatedFat / 20) * 100)}%</span>
                    </div>
                  )}
                  
                  {item.transFat !== null && (
                    <div className="flex justify-between border-b border-gray-300 pb-1 ml-4">
                      <span className="text-sm">Trans Fat {item.transFat}g</span>
                    </div>
                  )}
                  
                  {item.cholesterol !== null && (
                    <div className="flex justify-between border-b border-gray-300 pb-1">
                      <span className="text-sm">
                        <strong>Cholesterol</strong> {item.cholesterol}mg
                      </span>
                      <span className="text-sm font-bold">{Math.round((item.cholesterol / 300) * 100)}%</span>
                    </div>
                  )}
                  
                  {item.sodium !== null && (
                    <div className="flex justify-between border-b border-gray-300 pb-1">
                      <span className="text-sm">
                        <strong>Sodium</strong> {item.sodium}mg
                      </span>
                      <span className="text-sm font-bold">{Math.round((item.sodium / 2300) * 100)}%</span>
                    </div>
                  )}
                  
                  {item.totalCarbs !== null && (
                    <div className="flex justify-between border-b border-gray-300 pb-1">
                      <span className="text-sm">
                        <strong>Total Carbohydrate</strong> {item.totalCarbs}g
                      </span>
                      <span className="text-sm font-bold">{Math.round((item.totalCarbs / 300) * 100)}%</span>
                    </div>
                  )}
                  
                  {item.dietaryFiber !== null && (
                    <div className="flex justify-between border-b border-gray-300 pb-1 ml-4">
                      <span className="text-sm">Dietary Fiber {item.dietaryFiber}g</span>
                      <span className="text-sm font-bold">{Math.round((item.dietaryFiber / 25) * 100)}%</span>
                    </div>
                  )}
                  
                  {item.sugars !== null && (
                    <div className="flex justify-between border-b border-gray-300 pb-1 ml-4">
                      <span className="text-sm">Sugars {item.sugars}g</span>
                    </div>
                  )}
                  
                  {item.protein !== null && (
                    <div className="flex justify-between border-b-4 border-black pb-2 mb-2">
                      <span className="text-sm">
                        <strong>Protein</strong> {item.protein}g
                      </span>
                    </div>
                  )}
                  
                  {/* Vitamins and Minerals */}
                  <div className="space-y-1">
                    {item.vitaminA !== null && (
                      <div className="flex justify-between border-b border-gray-300 pb-1">
                        <span className="text-sm">Vitamin A</span>
                        <span className="text-sm font-bold">{item.vitaminA}%</span>
                      </div>
                    )}
                    {item.vitaminC !== null && (
                      <div className="flex justify-between border-b border-gray-300 pb-1">
                        <span className="text-sm">Vitamin C</span>
                        <span className="text-sm font-bold">{item.vitaminC}%</span>
                      </div>
                    )}
                    {item.calcium !== null && (
                      <div className="flex justify-between border-b border-gray-300 pb-1">
                        <span className="text-sm">Calcium</span>
                        <span className="text-sm font-bold">{item.calcium}%</span>
                      </div>
                    )}
                    {item.iron !== null && (
                      <div className="flex justify-between pb-1">
                        <span className="text-sm">Iron</span>
                        <span className="text-sm font-bold">{item.iron}%</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="text-xs mt-3 leading-tight">
                  * Percent Daily Values are based on a 2,000 calorie diet. Your daily values may be higher or lower depending on your calorie needs.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuestFriendlyNutritionModal;