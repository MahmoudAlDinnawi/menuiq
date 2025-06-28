import React from 'react';

// Import icons
import milkIcon from '../assets/allergy_icons/milk.svg';
import eggIcon from '../assets/allergy_icons/egg.svg';
import fishIcon from '../assets/allergy_icons/fish.svg';
import glutenIcon from '../assets/allergy_icons/gulten.svg';
import shellfishIcon from '../assets/allergy_icons/Shellfish.svg';
import soyIcon from '../assets/allergy_icons/soy.svg';
import sesameIcon from '../assets/allergy_icons/sesame.svg';
import mustardIcon from '../assets/allergy_icons/mustard.svg';

import walkingIcon from '../assets/energy_icons/walking.svg';
import runningIcon from '../assets/energy_icons/running.svg';
import caloriesIcon from '../assets/energy_icons/calories.svg';

const MobileMenuCard = ({ item, language, formatCategory, onClick, settings }) => {
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
    <div 
      className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden"
      onClick={onClick}
    >
      {/* Compact Layout */}
      <div className="flex">
        {/* Image */}
        {item.image && (
          <div className="w-24 h-24 flex-shrink-0">
            <img 
              src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${item.image}`}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 p-2">
          {/* Title & Price */}
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 flex-1">
              {language === 'ar' && item.nameAr ? item.nameAr : item.name}
            </h3>
            <span className="text-sm font-bold text-[#00594f] ml-2">{item.price}</span>
          </div>
          
          {/* Description */}
          <p className="text-xs text-gray-600 line-clamp-1 mb-1">
            {language === 'ar' && item.descriptionAr ? item.descriptionAr : item.description}
          </p>
          
          {/* Info Row */}
          <div className="flex items-center justify-between">
            {/* Calories & Exercise */}
            <div className="flex items-center gap-2 text-xs">
              {item.calories && (
                <span className="text-gray-600">{item.calories} cal</span>
              )}
              {item.walkMinutes && (
                <span className="text-blue-600">🚶 {item.walkMinutes}m</span>
              )}
            </div>
            
            {/* Allergen Icons */}
            {item.allergens && item.allergens.length > 0 && (
              <div className="flex -space-x-1">
                {item.allergens.slice(0, 3).map((allergen, index) => {
                  const allergenName = (typeof allergen === 'object' ? allergen.name : allergen).toLowerCase();
                  const iconSrc = allergenIcons[allergenName];
                  
                  return iconSrc ? (
                    <img 
                      key={index}
                      src={iconSrc}
                      alt={allergenName}
                      className="w-4 h-4 bg-white rounded-full p-0.5 border border-amber-400"
                      style={{ filter: 'brightness(0.8) sepia(1) hue-rotate(20deg)' }}
                    />
                  ) : null;
                })}
                {item.allergens.length > 3 && (
                  <div className="w-4 h-4 bg-amber-100 rounded-full flex items-center justify-center text-[8px] font-bold text-amber-700 border border-amber-400">
                    +{item.allergens.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Tags */}
          <div className="flex gap-1 mt-1">
            {item.halal && (
              <span className="text-[8px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                ✓ Halal
              </span>
            )}
            {item.vegetarian && (
              <span className="text-[8px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                🌿 Veg
              </span>
            )}
            {item.spicyLevel > 0 && (
              <span className="text-[8px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                {'🌶️'.repeat(item.spicyLevel)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenuCard;