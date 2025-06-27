import React, { useState } from 'react';
import GuestFriendlyNutritionModal from './GuestFriendlyNutritionModal';
import CustomAllergenIcons from './CustomAllergenIcons';

const GuestFriendlyMobileCard = ({ item, language, formatCategory, categories }) => {
  const [showNutritionModal, setShowNutritionModal] = useState(false);

  return (
    <>
      <div 
        className="guest-mobile-card cursor-pointer active:scale-[0.98] transition-transform"
        onClick={() => setShowNutritionModal(true)}
      >
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="p-4">
            <div className="flex gap-4">
              {/* Image Section */}
              {item.image && (
                <div className="relative w-28 h-28 rounded-lg overflow-hidden flex-shrink-0">
                  <img 
                    src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${item.image}`}
                    alt={language === 'ar' && item.nameAr ? item.nameAr : item.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Click indicator */}
                  <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-sm rounded-full p-1">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              )}
              
              {/* Content Section */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="mb-2">
                  <h3 className="font-semibold text-gray-900 text-base leading-tight">
                    {language === 'ar' && item.nameAr ? item.nameAr : item.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatCategory(item.category)}
                  </p>
                </div>
                
                {/* Price */}
                <div className="mb-2">
                  <div className="text-lg font-bold text-[#00594f]">{item.price}</div>
                  {item.priceWithoutVat && (
                    <p className="text-[10px] text-gray-500">
                      {language === 'ar' ? 'قبل الضريبة: ' : 'Before VAT: '}{item.priceWithoutVat}
                    </p>
                  )}
                </div>
                
                {/* Quick Info Row */}
                <div className="flex items-center gap-3 text-xs mb-2">
                  <span className="font-medium">{item.calories} cal</span>
                  {item.walkMinutes && (
                    <span className="text-blue-600">🚶 {item.walkMinutes}min</span>
                  )}
                  {item.spicyLevel > 0 && (
                    <span className="text-red-500">{'🌶️'.repeat(item.spicyLevel)}</span>
                  )}
                </div>
                
                {/* Tags and Warnings */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {item.halal && (
                    <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-medium">
                      {language === 'ar' ? 'حلال' : 'Halal'}
                    </span>
                  )}
                  {(item.vegetarian || item.vegan) && (
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                      item.vegan ? 'bg-lime-100 text-lime-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {item.vegan ? (language === 'ar' ? 'نباتي صرف' : 'Vegan') : (language === 'ar' ? 'نباتي' : 'Veg')}
                    </span>
                  )}
                  {item.glutenFree && (
                    <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-medium">
                      GF
                    </span>
                  )}
                  {item.allergens && item.allergens.length > 0 && (
                    <span className="inline-block px-2 py-0.5 bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 rounded text-[10px] font-medium border border-amber-300">
                      ⚠️ {language === 'ar' ? 'مسببات حساسية' : 'Allergens'}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Arrow indicator */}
              <div className="flex items-center text-gray-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            
            {/* Click hint */}
            <div className="mt-3 pt-3 border-t border-gray-100 text-center">
              <span className="text-[10px] text-gray-500">
                {language === 'ar' ? '👆 اضغط لمعلومات التغذية الكاملة' : '👆 Tap for full nutrition information'}
              </span>
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

export default GuestFriendlyMobileCard;