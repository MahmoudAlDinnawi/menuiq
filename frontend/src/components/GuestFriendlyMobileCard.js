import React, { useState } from 'react';
import GuestFriendlyNutritionModal from './GuestFriendlyNutritionModal';

// Import allergen icons
import milkIcon from '../assets/allergy_icons/milk.svg';
import eggIcon from '../assets/allergy_icons/egg.svg';
import fishIcon from '../assets/allergy_icons/fish.svg';
import glutenIcon from '../assets/allergy_icons/gulten.svg';
import shellfishIcon from '../assets/allergy_icons/Shellfish.svg';
import soyIcon from '../assets/allergy_icons/soy.svg';
import sesameIcon from '../assets/allergy_icons/sesame.svg';
import mustardIcon from '../assets/allergy_icons/mustard.svg';

// Import energy icons
import walkingIcon from '../assets/energy_icons/walking.svg';
import runningIcon from '../assets/energy_icons/running.svg';
import caloriesIcon from '../assets/energy_icons/calories.svg';

const GuestFriendlyMobileCard = ({ item, language, formatCategory, categories, settings }) => {
  const [showNutritionModal, setShowNutritionModal] = useState(false);

  // Map allergen names to icons
  const allergenIcons = {
    'milk': milkIcon,
    'egg': eggIcon,
    'eggs': eggIcon,
    'fish': fishIcon,
    'gluten': glutenIcon,
    'gulten': glutenIcon,
    'shellfish': shellfishIcon,
    'soy': soyIcon,
    'soya': soyIcon,
    'sesame': sesameIcon,
    'mustard': mustardIcon,
    'dairy': milkIcon,
    'lactose': milkIcon
  };

  return (
    <>
      <div 
        className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden active:scale-[0.98] transition-all duration-150 hover:shadow-md cursor-pointer"
        onClick={() => setShowNutritionModal(true)}
      >
        <div className="flex">
          {/* Image - Smaller */}
          {item.image && (
            <div className="w-20 h-20 flex-shrink-0">
              <img 
                src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${item.image}`}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1 p-2.5 relative">
            {/* Title & Price Row */}
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 flex-1 mr-2">
                {language === 'ar' && item.nameAr ? item.nameAr : item.name}
              </h3>
              <span className="text-sm font-bold text-[#00594f] whitespace-nowrap">{item.price}</span>
            </div>
            
            {/* Category & Description */}
            <p className="text-[10px] text-gray-500 mb-0.5">{formatCategory(item.category)}</p>
            <p className="text-[11px] text-gray-600 line-clamp-1 mb-1.5">
              {language === 'ar' && item.descriptionAr ? item.descriptionAr : item.description}
            </p>
            
            {/* Nutrition Row */}
            <div className="flex items-center gap-2 mb-1.5 text-[10px]">
              {item.calories && (
                <span className="font-semibold text-gray-700">
                  {item.calories} <span className="text-gray-500 font-normal">kcal</span>
                </span>
              )}
              {(item.walkMinutes || item.runMinutes) && item.calories && (
                <span className="text-gray-400">•</span>
              )}
              {item.walkMinutes && (
                <span className="font-medium text-blue-600">
                  🚶 {item.walkMinutes}m
                </span>
              )}
              {item.runMinutes && (
                <span className="font-medium text-purple-600">
                  🏃 {item.runMinutes}m
                </span>
              )}
            </div>
            
            {/* Bottom Row - Tags & Allergens */}
            <div className="flex items-center justify-between">
              {/* Dietary Tags */}
              <div className="flex gap-1">
                {item.halal && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-medium">
                    ✓ {language === 'ar' ? 'حلال' : 'Halal'}
                  </span>
                )}
                {item.vegetarian && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-medium">
                    🌿 {language === 'ar' ? 'نباتي' : 'Veg'}
                  </span>
                )}
                {item.spicyLevel > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-medium">
                    {'🌶️'.repeat(Math.min(item.spicyLevel, 3))}
                  </span>
                )}
              </div>
              
              {/* Allergen Icons */}
              {item.allergens && item.allergens.length > 0 && (
                <div className="flex items-center gap-1">
                  <div className="flex items-center -space-x-1">
                  {item.allergens.slice(0, 3).map((allergen, index) => {
                    const allergenData = typeof allergen === 'object' ? allergen : { name: allergen };
                    const allergenName = (allergenData.name || '').toLowerCase();
                    const iconSrc = allergenIcons[allergenName];
                    
                    if (iconSrc) {
                      return (
                        <div 
                          key={index}
                          className="w-4 h-4 bg-amber-600 rounded-full p-0.5 border border-white"
                          style={{ 
                            maskImage: `url(${iconSrc})`,
                            maskSize: 'contain',
                            maskRepeat: 'no-repeat',
                            maskPosition: 'center',
                            WebkitMaskImage: `url(${iconSrc})`,
                            WebkitMaskSize: 'contain',
                            WebkitMaskRepeat: 'no-repeat',
                            WebkitMaskPosition: 'center',
                            zIndex: item.allergens.length - index
                          }}
                          title={allergenData.display_name || allergenName}
                        />
                      );
                    }
                    return null;
                  })}
                  {item.allergens.length > 3 && (
                    <div className="w-4 h-4 bg-amber-100 rounded-full flex items-center justify-center text-[8px] font-bold text-amber-700 border border-amber-400 ml-0.5">
                      +{item.allergens.length - 3}
                    </div>
                  )}
                  </div>
                  <svg className="w-3 h-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
          
          {/* Click Indicator */}
          <div className="flex items-center justify-center px-2 border-l border-gray-100">
            <div className="text-center">
              <svg className="w-4 h-4 text-gray-400 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <p className="text-[8px] text-gray-500 leading-tight">
                {language === 'ar' ? 'المزيد' : 'More'}
              </p>
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
        settings={settings}
      />
    </>
  );
};

export default GuestFriendlyMobileCard;