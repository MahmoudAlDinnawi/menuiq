import React, { useState } from 'react';
import GuestFriendlyNutritionModal from './GuestFriendlyNutritionModal';
import CustomAllergenIcons from './CustomAllergenIcons';
import AllergenSVGIcon from './AllergenSVGIcon';
import walkingIcon from '../assets/energy_icons/walking.svg';
import runningIcon from '../assets/energy_icons/running.svg';
import caloriesIcon from '../assets/energy_icons/calories.svg';

// Import allergen icons
import milkIcon from '../assets/allergy_icons/milk.svg';
import eggIcon from '../assets/allergy_icons/egg.svg';
import fishIcon from '../assets/allergy_icons/fish.svg';
import glutenIcon from '../assets/allergy_icons/gulten.svg';
import shellfishIcon from '../assets/allergy_icons/Shellfish.svg';
import soyIcon from '../assets/allergy_icons/soy.svg';
import sesameIcon from '../assets/allergy_icons/sesame.svg';
import mustardIcon from '../assets/allergy_icons/mustard.svg';

const GuestFriendlyMenuCard = ({ item, language, formatCategory, categories, settings }) => {
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
        className="guest-menu-card cursor-pointer transform transition-all duration-300 hover:scale-[1.02]"
        onClick={() => setShowNutritionModal(true)}
      >
        <div className="relative h-full bg-white rounded-lg sm:rounded-2xl overflow-hidden shadow-sm sm:shadow-lg hover:shadow-xl border border-gray-200 sm:border-gray-100">
          
          {/* Image Section */}
          {item.image && (
            <div className="relative h-36 sm:h-52 overflow-hidden">
              <img 
                src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${item.image}`}
                alt={language === 'ar' && item.nameAr ? item.nameAr : item.name}
                className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
              />
              {/* Gradient Overlay - Desktop only */}
              <div className="hidden sm:block absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
              
              {/* Category Badge */}
              <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-white/90 backdrop-blur-sm rounded-full px-2 sm:px-3 py-0.5 sm:py-1 shadow-sm sm:shadow-md">
                <span className="text-[9px] sm:text-xs font-medium text-gray-700 uppercase tracking-wide sm:tracking-wider">
                  {formatCategory(item.category)}
                </span>
              </div>
              
              {/* Click indicator - Desktop only */}
              <div className="hidden sm:block absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          )}
          
          {/* Content Section */}
          <div className="p-4 sm:p-6">
            {/* Title and Price */}
            <div className="mb-3 sm:mb-4">
              <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-1 line-clamp-1 sm:line-clamp-none">
                {language === 'ar' && item.nameAr ? item.nameAr : item.name}
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-lg sm:text-2xl font-bold text-[#00594f]">{item.price}</span>
                {item.priceWithoutVat && (
                  <span className="text-[10px] sm:text-sm text-gray-500">
                    ({language === 'ar' ? 'قبل الضريبة: ' : 'Before VAT: '}{item.priceWithoutVat})
                  </span>
                )}
              </div>
            </div>
            
            {/* Description */}
            <p className="text-gray-600 text-[11px] sm:text-sm mb-2 sm:mb-4 line-clamp-1 sm:line-clamp-2">
              {language === 'ar' && item.descriptionAr ? item.descriptionAr : item.description}
            </p>
            
            {/* Mobile - Quick Info Bar */}
            <div className="sm:hidden flex items-center justify-between mb-2 text-[10px]">
              <div className="flex items-center gap-3">
                {item.calories && (
                  <span className="font-semibold text-gray-700">
                    {item.calories} <span className="text-gray-500 font-normal">kcal</span>
                  </span>
                )}
                {item.walkMinutes && (
                  <span className="font-medium text-blue-600">🚶 {item.walkMinutes}m</span>
                )}
                {item.runMinutes && (
                  <span className="font-medium text-purple-600">🏃 {item.runMinutes}m</span>
                )}
              </div>
              {item.spicyLevel > 0 && (
                <div className="flex items-center">
                  {[...Array(3)].map((_, i) => (
                    <span key={i} className={`text-[10px] ${i < item.spicyLevel ? 'opacity-100' : 'opacity-30'}`}>🌶️</span>
                  ))}
                </div>
              )}
            </div>
            
            {/* Desktop - Luxurious Nutrition Display */}
            {settings?.showCalories !== false && (item.calories || item.walkMinutes || item.runMinutes) && (
              <div className="hidden sm:block mb-4">
                {/* Calories Display */}
                {item.calories && (
                  <div className="mb-3">
                    <div className="inline-flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-full shadow-sm">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-400">
                        <div 
                          className="w-6 h-6"
                          style={{
                            maskImage: `url(${caloriesIcon})`,
                            maskSize: 'contain',
                            maskRepeat: 'no-repeat',
                            maskPosition: 'center',
                            WebkitMaskImage: `url(${caloriesIcon})`,
                            WebkitMaskSize: 'contain',
                            WebkitMaskRepeat: 'no-repeat',
                            WebkitMaskPosition: 'center',
                            backgroundColor: 'white'
                          }}
                        />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-gray-800">{item.calories}</span>
                        <span className="text-sm text-gray-600">{language === 'ar' ? 'سعرة حرارية' : 'Calories'}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Exercise Cards */}
                {(item.walkMinutes || item.runMinutes) && (
                  <div className="flex gap-3">
                    {item.walkMinutes && (
                      <div className="flex-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100/50 p-4 shadow-sm">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100/20 rounded-full -mr-10 -mt-10"></div>
                        <div className="relative flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                            <div 
                              className="w-7 h-7"
                              style={{
                                maskImage: `url(${walkingIcon})`,
                                maskSize: 'contain',
                                maskRepeat: 'no-repeat',
                                maskPosition: 'center',
                                WebkitMaskImage: `url(${walkingIcon})`,
                                WebkitMaskSize: 'contain',
                                WebkitMaskRepeat: 'no-repeat',
                                WebkitMaskPosition: 'center',
                                backgroundColor: 'white'
                              }}
                            />
                          </div>
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-bold text-blue-700">{item.walkMinutes}</span>
                              <span className="text-sm text-blue-600">{language === 'ar' ? 'دقيقة' : 'minutes'}</span>
                            </div>
                            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                              {language === 'ar' ? 'مشي' : 'Walking'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {item.runMinutes && (
                      <div className="flex-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100/50 p-4 shadow-sm">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-purple-100/20 rounded-full -mr-10 -mt-10"></div>
                        <div className="relative flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                            <div 
                              className="w-7 h-7"
                              style={{
                                maskImage: `url(${runningIcon})`,
                                maskSize: 'contain',
                                maskRepeat: 'no-repeat',
                                maskPosition: 'center',
                                WebkitMaskImage: `url(${runningIcon})`,
                                WebkitMaskSize: 'contain',
                                WebkitMaskRepeat: 'no-repeat',
                                WebkitMaskPosition: 'center',
                                backgroundColor: 'white'
                              }}
                            />
                          </div>
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-bold text-purple-700">{item.runMinutes}</span>
                              <span className="text-sm text-purple-600">{language === 'ar' ? 'دقيقة' : 'minutes'}</span>
                            </div>
                            <div className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                              {language === 'ar' ? 'جري' : 'Running'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Dietary Tags */}
            {(item.halal || item.vegetarian || item.vegan || item.glutenFree || item.dairyFree || item.nutFree) && (
              <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-4">
                {item.halal && (
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 text-emerald-700 text-[9px] sm:text-xs font-medium rounded-full">
                    ✓ {language === 'ar' ? 'حلال' : 'Halal'}
                  </span>
                )}
                {item.vegetarian && (
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-green-50 to-lime-50 border border-green-200 text-green-700 text-[9px] sm:text-xs font-medium rounded-full">
                    🌿 {language === 'ar' ? 'نباتي' : 'Vegetarian'}
                  </span>
                )}
                {item.vegan && (
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-lime-50 to-green-50 border border-lime-200 text-lime-700 text-[9px] sm:text-xs font-medium rounded-full">
                    🌱 {language === 'ar' ? 'نباتي صرف' : 'Vegan'}
                  </span>
                )}
                {item.glutenFree && (
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 text-amber-700 text-[9px] sm:text-xs font-medium rounded-full">
                    {language === 'ar' ? 'خالي من الجلوتين' : 'Gluten Free'}
                  </span>
                )}
                {item.dairyFree && (
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 text-blue-700 text-[9px] sm:text-xs font-medium rounded-full">
                    {language === 'ar' ? 'خالي من الألبان' : 'Dairy Free'}
                  </span>
                )}
                {item.nutFree && (
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 text-orange-700 text-[9px] sm:text-xs font-medium rounded-full">
                    {language === 'ar' ? 'خالي من المكسرات' : 'Nut Free'}
                  </span>
                )}
              </div>
            )}
            
            {/* Allergen Section */}
            {item.allergens && item.allergens.length > 0 && (
              <div className="bg-amber-50 sm:bg-gradient-to-br sm:from-amber-50 sm:to-orange-50 rounded-lg sm:rounded-xl p-2 sm:p-4 mb-2 sm:mb-4 sm:shadow-sm sm:border sm:border-amber-200">
                <div className="flex items-center justify-between sm:justify-start sm:gap-3 sm:mb-3">
                  <span className="text-[10px] sm:text-sm font-semibold text-amber-700 sm:text-amber-800 uppercase sm:tracking-wider">
                    {language === 'ar' ? 'يحتوي' : 'Contains'}
                  </span>
                  <div className="sm:hidden flex gap-1">
                    {item.allergens.slice(0, 5).map((allergen, index) => {
                      const allergenData = typeof allergen === 'object' ? allergen : { name: allergen };
                      const allergenName = (allergenData.name || '').toLowerCase();
                      const iconSrc = allergenIcons[allergenName];
                      
                      return (
                        <div key={index} className="relative group">
                          {iconSrc ? (
                            <div 
                              className="w-5 h-5 p-0.5 bg-amber-600 rounded-full shadow-sm"
                              style={{
                                maskImage: `url(${iconSrc})`,
                                maskSize: 'contain',
                                maskRepeat: 'no-repeat',
                                maskPosition: 'center',
                                WebkitMaskImage: `url(${iconSrc})`,
                                WebkitMaskSize: 'contain',
                                WebkitMaskRepeat: 'no-repeat',
                                WebkitMaskPosition: 'center'
                              }}
                            />
                          ) : (
                            <div className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center">
                              <span className="text-[8px]">⚠️</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {item.allergens.length > 5 && (
                      <div className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center">
                        <span className="text-[8px] font-bold">+{item.allergens.length - 5}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Desktop view - Full allergen list */}
                <div className="hidden sm:flex flex-wrap gap-2">
                  {item.allergens.map((allergen, index) => {
                    const allergenData = typeof allergen === 'object' ? allergen : { name: allergen };
                    const allergenName = (allergenData.name || '').toLowerCase();
                    const iconSrc = allergenIcons[allergenName];
                    const displayName = allergenData.display_name || allergenData.name || allergenName;
                    
                    return (
                      <div key={index} className="flex items-center gap-1 bg-white rounded-lg px-2 py-1 shadow-sm">
                        {iconSrc ? (
                          <div 
                            className="w-5 h-5"
                            style={{
                              maskImage: `url(${iconSrc})`,
                              maskSize: 'contain',
                              maskRepeat: 'no-repeat',
                              maskPosition: 'center',
                              WebkitMaskImage: `url(${iconSrc})`,
                              WebkitMaskSize: 'contain',
                              WebkitMaskRepeat: 'no-repeat',
                              WebkitMaskPosition: 'center',
                              backgroundColor: settings?.primaryColor || '#00594f'
                            }}
                          />
                        ) : (
                          <span className="text-sm">⚠️</span>
                        )}
                        <span className="text-xs font-medium text-gray-700">
                          {displayName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Warnings - Compact for mobile */}
            {(item.highSodium || item.containsCaffeine) && (
              <div className="flex gap-2 text-[9px] text-amber-700 mb-2">
                {item.highSodium && (
                  <span className="flex items-center gap-0.5">
                    <span>🧂</span> {language === 'ar' ? 'صوديوم عالي' : 'High Sodium'}
                  </span>
                )}
                {item.containsCaffeine && (
                  <span className="flex items-center gap-0.5">
                    <span>☕</span> {language === 'ar' ? 'كافيين' : 'Caffeine'}
                  </span>
                )}
              </div>
            )}
            
            {/* Click Indicator - Small and subtle */}
            <div className="text-center mt-2">
              <span className="text-[10px] text-gray-500">
                {language === 'ar' ? 'اضغط للتفاصيل' : 'Tap for details'}
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
        settings={settings}
      />
    </>
  );
};

export default GuestFriendlyMenuCard;