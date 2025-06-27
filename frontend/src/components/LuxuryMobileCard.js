import React, { useState } from 'react';
import LuxuryNutritionModal from './LuxuryNutritionModal';

const LuxuryMobileCard = ({ item, language, formatCategory, categories }) => {
  const [showNutritionModal, setShowNutritionModal] = useState(false);

  return (
    <>
      <div 
        className="luxury-mobile-card"
        onClick={() => setShowNutritionModal(true)}
      >
        <div className="bg-white rounded-xl shadow-sm active:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
          <div className="p-4">
            <div className="flex gap-4">
              {/* Image Section */}
              {item.image && (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                  <img 
                    src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${item.image}`}
                    alt={language === 'ar' && item.nameAr ? item.nameAr : item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {/* Content Section */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1 mr-2">
                    <h3 className="font-semibold text-gray-900 text-base leading-tight">
                      {language === 'ar' && item.nameAr ? item.nameAr : item.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatCategory(item.category)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-primary">{item.price}</div>
                  </div>
                </div>
                
                {/* Description */}
                <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                  {language === 'ar' && item.descriptionAr ? item.descriptionAr : item.description}
                </p>
                
                {/* Quick Info */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {item.calories && <span>{item.calories} cal</span>}
                  {item.preparationTime && <span>{item.preparationTime} min</span>}
                  {item.spicyLevel > 0 && (
                    <span className="text-red-500">{'🌶️'.repeat(item.spicyLevel)}</span>
                  )}
                </div>
                
                {/* Tags */}
                <div className="flex items-center gap-2 mt-2">
                  {item.halal && (
                    <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-medium">
                      Halal
                    </span>
                  )}
                  {(item.vegetarian || item.vegan) && (
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                      item.vegan ? 'bg-lime-100 text-lime-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {item.vegan ? 'Vegan' : 'Veg'}
                    </span>
                  )}
                  {item.allergens && item.allergens.length > 0 && (
                    <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-medium">
                      Allergens
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
          </div>
        </div>
      </div>
      
      {/* Nutrition Modal */}
      <LuxuryNutritionModal 
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

export default LuxuryMobileCard;