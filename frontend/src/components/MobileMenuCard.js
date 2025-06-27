import React, { useState } from 'react';
import NutritionModal from './NutritionModal';

const MobileMenuCard = ({ item, language, formatCategory, categories }) => {
  const [showNutritionModal, setShowNutritionModal] = useState(false);

  return (
    <>
      <div className="mobile-menu-card" onClick={() => setShowNutritionModal(true)}>
        <div className="bg-white rounded-2xl shadow-sm active:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="flex">
            {/* Image section */}
            {item.image ? (
              <div className="relative w-28 h-28 flex-shrink-0">
                <img 
                  src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${item.image}`}
                  alt={language === 'ar' && item.nameAr ? item.nameAr : item.name}
                  className="w-full h-full object-cover"
                />
                {/* Price overlay */}
                <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1">
                  <span className="text-sm font-semibold text-white">
                    {item.price}
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-24 h-24 flex-shrink-0 bg-gradient-to-br from-primary/10 to-gold/10 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-lg font-semibold text-primary">
                    {item.price}
                  </span>
                  <p className="text-[8px] text-primary/60 uppercase tracking-wider">
                    {formatCategory(item.category)}
                  </p>
                </div>
              </div>
            )}
            
            {/* Content section */}
            <div className="flex-1 p-3 flex flex-col justify-between">
              {/* Header */}
              <div>
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-sm font-semibold text-gray-800 leading-tight flex-1 mr-2">
                    {language === 'ar' && item.nameAr ? item.nameAr : item.name}
                  </h3>
                  {!item.image && (
                    <span className="text-sm font-semibold text-primary">
                      {item.price}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-600 line-clamp-2 leading-relaxed">
                  {language === 'ar' && item.descriptionAr ? item.descriptionAr : item.description}
                </p>
              </div>
              
              {/* Footer info */}
              <div className="mt-2">
                {/* Quick stats */}
                <div className="flex items-center gap-3 text-[9px] text-gray-500 mb-2">
                  {item.calories && (
                    <span>{item.calories} cal</span>
                  )}
                  {(item.walkMinutes || item.runMinutes) && (
                    <span>🏃 {item.walkMinutes || item.runMinutes}min</span>
                  )}
                  {item.spicyLevel > 0 && (
                    <span>{'🌶️'.repeat(item.spicyLevel)}</span>
                  )}
                </div>
                
                {/* Tags */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {item.halal && (
                      <span className="w-5 h-5 rounded bg-emerald-500 text-white text-[8px] font-bold flex items-center justify-center">
                        H
                      </span>
                    )}
                    {(item.vegetarian || item.vegan) && (
                      <span className={`w-5 h-5 rounded text-white text-[8px] font-bold flex items-center justify-center ${
                        item.vegan ? 'bg-lime-500' : 'bg-green-500'
                      }`}>
                        {item.vegan ? 'VG' : 'V'}
                      </span>
                    )}
                    {item.glutenFree && (
                      <span className="w-5 h-5 rounded bg-amber-500 text-white text-[8px] font-bold flex items-center justify-center">
                        GF
                      </span>
                    )}
                    {(item.allergens && item.allergens.length > 0) && (
                      <span className="w-5 h-5 rounded bg-red-500 text-white text-[8px] font-bold flex items-center justify-center animate-pulse">
                        !
                      </span>
                    )}
                  </div>
                  
                  <svg className="w-4 h-4 text-primary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Nutrition Modal */}
      <NutritionModal 
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

export default MobileMenuCard;