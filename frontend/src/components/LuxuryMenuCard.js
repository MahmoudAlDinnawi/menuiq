import React, { useState } from 'react';
import LuxuryNutritionModal from './LuxuryNutritionModal';

const LuxuryMenuCard = ({ item, language, formatCategory, categories }) => {
  const [showNutritionModal, setShowNutritionModal] = useState(false);

  return (
    <>
      <div 
        className="luxury-menu-card group cursor-pointer"
        onClick={() => setShowNutritionModal(true)}
      >
        <div className="relative h-full">
          {/* Card Container */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 h-full border border-gray-100">
            
            {/* Image Section */}
            {item.image && (
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${item.image}`}
                  alt={language === 'ar' && item.nameAr ? item.nameAr : item.name}
                  className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Price Badge */}
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                  <span className="text-lg font-semibold text-gray-900">{item.price}</span>
                </div>
                
                {/* Category Badge */}
                <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1">
                  <span className="text-xs text-white font-medium uppercase tracking-wider">
                    {formatCategory(item.category)}
                  </span>
                </div>
              </div>
            )}
            
            {/* Content Section */}
            <div className={`p-6 ${!item.image ? 'pt-8' : ''}`}>
              {/* Header without image */}
              {!item.image && (
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                    {formatCategory(item.category)}
                  </span>
                  <span className="text-xl font-semibold text-gray-900">{item.price}</span>
                </div>
              )}
              
              {/* Title */}
              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors duration-300">
                {language === 'ar' && item.nameAr ? item.nameAr : item.name}
              </h3>
              
              {/* Description */}
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {language === 'ar' && item.descriptionAr ? item.descriptionAr : item.description}
              </p>
              
              {/* Info Grid */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {item.calories && (
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900">{item.calories}</div>
                    <div className="text-xs text-gray-500">Calories</div>
                  </div>
                )}
                {item.preparationTime && (
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900">{item.preparationTime}</div>
                    <div className="text-xs text-gray-500">Min</div>
                  </div>
                )}
                {item.servingSize && (
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900">{item.servingSize.split(' ')[0]}</div>
                    <div className="text-xs text-gray-500">Serving</div>
                  </div>
                )}
              </div>
              
              {/* Dietary Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {item.halal && (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                    Halal
                  </span>
                )}
                {item.vegetarian && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Vegetarian
                  </span>
                )}
                {item.vegan && (
                  <span className="px-3 py-1 bg-lime-100 text-lime-700 rounded-full text-xs font-medium">
                    Vegan
                  </span>
                )}
                {item.glutenFree && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                    Gluten Free
                  </span>
                )}
              </div>
              
              {/* Bottom Section */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  {/* Spicy Level */}
                  {item.spicyLevel > 0 && (
                    <div className="flex gap-0.5">
                      {[...Array(3)].map((_, i) => (
                        <span key={i} className={`text-sm ${i < item.spicyLevel ? 'text-red-500' : 'text-gray-300'}`}>
                          🌶️
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Allergen Warning */}
                  {item.allergens && item.allergens.length > 0 && (
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 font-bold text-sm">!</span>
                    </div>
                  )}
                </div>
                
                {/* View Details Button */}
                <button className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors">
                  <span>View Details</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
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

export default LuxuryMenuCard;