import React, { useState } from 'react';
import GuestFriendlyNutritionModal from './GuestFriendlyNutritionModal';
import CustomAllergenIcons from './CustomAllergenIcons';

const GuestFriendlyMenuCard = ({ item, language, formatCategory, categories }) => {
  const [showNutritionModal, setShowNutritionModal] = useState(false);

  const getDietaryIcons = () => {
    const icons = [];
    if (item.halal) icons.push({ type: 'halal', label: language === 'ar' ? 'حلال' : 'Halal' });
    if (item.vegetarian) icons.push({ type: 'vegetarian', label: language === 'ar' ? 'نباتي' : 'Vegetarian' });
    if (item.vegan) icons.push({ type: 'vegan', label: language === 'ar' ? 'نباتي صرف' : 'Vegan' });
    if (item.glutenFree) icons.push({ type: 'glutenFree', label: language === 'ar' ? 'خالي من الجلوتين' : 'Gluten Free' });
    if (item.dairyFree) icons.push({ type: 'dairyFree', label: language === 'ar' ? 'خالي من الألبان' : 'Dairy Free' });
    if (item.nutFree) icons.push({ type: 'nutFree', label: language === 'ar' ? 'خالي من المكسرات' : 'Nut Free' });
    return icons;
  };

  return (
    <>
      <div 
        className="guest-menu-card group cursor-pointer transform transition-all duration-300 hover:scale-[1.02]"
        onClick={() => setShowNutritionModal(true)}
      >
        <div className="relative h-full bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl border border-gray-100">
          {/* Click indicator */}
          <div className="absolute top-4 right-4 z-10 bg-black/70 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          {/* Image Section */}
          {item.image && (
            <div className="relative h-52 overflow-hidden">
              <img 
                src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${item.image}`}
                alt={language === 'ar' && item.nameAr ? item.nameAr : item.name}
                className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
              
              {/* Category Badge */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-md">
                <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                  {formatCategory(item.category)}
                </span>
              </div>
            </div>
          )}
          
          {/* Content Section */}
          <div className="p-6">
            {/* Title and Price */}
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                {language === 'ar' && item.nameAr ? item.nameAr : item.name}
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#00594f]">{item.price}</span>
                {item.priceWithoutVat && (
                  <span className="text-sm text-gray-500">
                    ({language === 'ar' ? 'قبل الضريبة: ' : 'Before VAT: '}{item.priceWithoutVat})
                  </span>
                )}
              </div>
            </div>
            
            {/* Description */}
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {language === 'ar' && item.descriptionAr ? item.descriptionAr : item.description}
            </p>
            
            {/* Nutrition Quick Info */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {/* Calories */}
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-gray-900">{item.calories || 0}</div>
                <div className="text-xs text-gray-500">{language === 'ar' ? 'سعرات' : 'Calories'}</div>
              </div>
              
              {/* Walk Time */}
              {item.walkMinutes && (
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-lg">🚶</span>
                    <span className="text-lg font-semibold text-blue-700">{item.walkMinutes}</span>
                  </div>
                  <div className="text-xs text-gray-500">{language === 'ar' ? 'دقيقة مشي' : 'min walk'}</div>
                </div>
              )}
              
              {/* Run Time */}
              {item.runMinutes && (
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-lg">🏃</span>
                    <span className="text-lg font-semibold text-purple-700">{item.runMinutes}</span>
                  </div>
                  <div className="text-xs text-gray-500">{language === 'ar' ? 'دقيقة جري' : 'min run'}</div>
                </div>
              )}
            </div>
            
            {/* Dietary Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {getDietaryIcons().map((diet, index) => (
                <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  {diet.label}
                </span>
              ))}
            </div>
            
            {/* Important Information - Luxury Style */}
            {(item.spicyLevel > 0 || item.highSodium || item.containsCaffeine || (item.allergens && item.allergens.length > 0)) && (
              <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl border border-amber-200/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center shadow-sm">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                    {language === 'ar' ? 'معلومات مهمة' : 'Important Information'}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {/* Spicy Level */}
                  {item.spicyLevel > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[...Array(3)].map((_, i) => (
                          <span key={i} className={`text-sm ${i < item.spicyLevel ? 'text-orange-600' : 'text-gray-300'}`}>
                            🌶️
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-amber-700">
                        {language === 'ar' ? `مستوى الحرارة ${item.spicyLevel}` : `Spicy Level ${item.spicyLevel}`}
                      </span>
                    </div>
                  )}
                  
                  {/* High Sodium Warning */}
                  {item.highSodium && (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-amber-200/50 rounded-full flex items-center justify-center">
                        <span className="text-xs">🧂</span>
                      </div>
                      <span className="text-xs text-amber-700">
                        {language === 'ar' ? 'محتوى صوديوم عالي' : 'High Sodium Content'}
                      </span>
                    </div>
                  )}
                  
                  {/* Caffeine Warning */}
                  {item.containsCaffeine && (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-amber-200/50 rounded-full flex items-center justify-center">
                        <span className="text-xs">☕</span>
                      </div>
                      <span className="text-xs text-amber-700">
                        {language === 'ar' ? 'يحتوي على كافيين' : 'Contains Caffeine'}
                      </span>
                    </div>
                  )}
                  
                  {/* Allergens */}
                  {item.allergens && item.allergens.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-amber-700 font-medium">
                          {language === 'ar' ? 'يحتوي على:' : 'Contains:'}
                        </span>
                      </div>
                      <CustomAllergenIcons allergens={item.allergens} size="w-5 h-5" language={language} />
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Click for More Info */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-center gap-2 text-[#00594f] group-hover:text-[#003d35] transition-colors">
                <span className="text-sm font-medium">
                  {language === 'ar' ? 'اضغط للمزيد من المعلومات' : 'Click for more information'}
                </span>
                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Nutrition Modal */}
      <GuestFriendlyNutritionModal 
        item={item}
        isOpen={showNutritionModal}
        onClose={() => setShowNutritionModal(false)}
        language={language}
        formatCategory={formatCategory}
        categories={categories}
      />
    </>
  );
};

export default GuestFriendlyMenuCard;