import React, { useState } from 'react';
import AllergenIcons from './AllergenIcons';
import NutritionModal from './NutritionModal';

const MenuItemCard = ({ item, language, formatCategory, categories }) => {
  const [showNutritionModal, setShowNutritionModal] = useState(false);

  return (
    <>
      <div className="menu-item-card group cursor-pointer" onClick={() => setShowNutritionModal(true)}>
        <div className="relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 h-full">
          {/* Elegant border effect */}
          <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-gold/30 transition-colors duration-500"></div>
          
          {/* Luxury gold accent */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold/0 via-gold/50 to-gold/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          
          {/* Main content */}
          <div className="relative">
            {/* Compact header with price */}
            <div className="bg-gradient-to-br from-primary/5 to-gold/5 px-4 py-3 flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-800 leading-tight group-hover:text-primary transition-colors duration-300">
                  {language === 'ar' && item.nameAr ? item.nameAr : item.name}
                </h3>
                <p className="text-[10px] text-primary/60 font-medium tracking-wider uppercase mt-0.5">
                  {formatCategory(item.category)}
                </p>
              </div>
              <div className="ml-3 text-right">
                <span className="text-lg font-light text-primary">
                  {item.price}
                </span>
                {item.priceWithoutVat && (
                  <p className="text-[9px] text-gray-500 -mt-0.5">
                    {language === 'ar' ? 'قبل الضريبة' : 'Before VAT'}
                  </p>
                )}
              </div>
            </div>
            
            {/* Image or description */}
            {item.image ? (
              <div className="relative h-32 overflow-hidden">
                <img 
                  src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${item.image}`}
                  alt={language === 'ar' && item.nameAr ? item.nameAr : item.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            ) : (
              <div className="px-4 py-3">
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                  {language === 'ar' && item.descriptionAr ? item.descriptionAr : item.description}
                </p>
              </div>
            )}
            
            {/* Compact info section */}
            <div className="px-4 py-3 space-y-2">
              {/* Quick stats */}
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-3">
                  {item.calories && (
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      <span className="text-gray-600">{item.calories} cal</span>
                    </div>
                  )}
                  {(item.walkMinutes || item.runMinutes) && (
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-gold"></div>
                      <span className="text-gray-600">🏃 {item.walkMinutes || item.runMinutes}m</span>
                    </div>
                  )}
                  {item.preparationTime && (
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                      <span className="text-gray-600">⏱ {item.preparationTime}m</span>
                    </div>
                  )}
                </div>
                
                {/* Spicy level */}
                {item.spicyLevel > 0 && (
                  <div className="flex">
                    {[...Array(3)].map((_, i) => (
                      <span key={i} className={`text-[10px] ${i < item.spicyLevel ? 'text-red-500' : 'text-gray-300'}`}>
                        🌶
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Tags row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {/* Dietary badges */}
                  {item.halal && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-emerald-500 text-white text-[8px] font-bold">
                      H
                    </span>
                  )}
                  {(item.vegetarian || item.vegan) && (
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-white text-[8px] font-bold ${
                      item.vegan ? 'bg-lime-500' : 'bg-green-500'
                    }`}>
                      {item.vegan ? 'VG' : 'V'}
                    </span>
                  )}
                  {item.glutenFree && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-amber-500 text-white text-[8px] font-bold">
                      GF
                    </span>
                  )}
                  {item.dairyFree && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-sky-500 text-white text-[8px] font-bold">
                      DF
                    </span>
                  )}
                  {item.nutFree && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-purple-500 text-white text-[8px] font-bold">
                      NF
                    </span>
                  )}
                  
                  {/* Warnings */}
                  {(item.allergens && item.allergens.length > 0) && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-red-500 text-white animate-pulse">
                      <span className="text-[10px] font-bold">!</span>
                    </span>
                  )}
                  {item.highSodium && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-orange-500 text-white text-[10px]">
                      Na
                    </span>
                  )}
                  {item.containsCaffeine && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-amber-600 text-white text-[10px]">
                      ☕
                    </span>
                  )}
                </div>
                
                {/* View more indicator */}
                <div className="flex items-center text-primary/40 group-hover:text-primary transition-colors duration-300">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          {/* Hover overlay effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-gold/0 via-transparent to-primary/0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"></div>
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

export default MenuItemCard;