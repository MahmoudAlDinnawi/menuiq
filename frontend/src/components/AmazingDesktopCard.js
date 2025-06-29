import React, { useState } from 'react';
import AmazingNutritionModal from './AmazingNutritionModal';
import AllergenSVGIcon from './AllergenSVGIcon';

const AmazingDesktopCard = ({ item, language, formatCategory, categories, settings }) => {
  const [showNutritionModal, setShowNutritionModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Get primary color from settings
  const primaryColor = settings?.primaryColor || '#00594f';

  // Format price - price already includes currency from backend
  const formatPrice = (price) => {
    return price || '0';
  };

  // Get allergen display info
  const getAllergenInfo = () => {
    if (!item.allergens || item.allergens.length === 0) return null;
    
    const allergens = item.allergens.map(allergen => {
      if (typeof allergen === 'object') {
        return {
          name: allergen.name || '',
          displayName: language === 'ar' ? allergen.display_name_ar || allergen.display_name : allergen.display_name,
          iconUrl: allergen.icon_url
        };
      }
      return { name: allergen, displayName: allergen, iconUrl: null };
    });

    return allergens;
  };

  const allergenInfo = getAllergenInfo();

  return (
    <>
      <div 
        className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer group"
        onClick={() => setShowNutritionModal(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Section with Overlay Info */}
        <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
          {item.image && !imageError ? (
            <>
              <img 
                src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${item.image}`}
                alt={item.name}
                className={`w-full h-full object-cover transition-transform duration-700 ${isHovered ? 'scale-110' : 'scale-100'}`}
                onError={() => setImageError(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              
              {/* Hover overlay with quick info */}
              <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                <div className="text-center text-white px-6">
                  <p className="text-lg font-medium mb-2">{language === 'ar' ? 'اضغط للتفاصيل' : 'Click for Details'}</p>
                  {item.calories && (
                    <p className="text-sm opacity-90">{item.calories} kcal</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`
              }}
            >
              {/* Decorative pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.1) 35px, rgba(255,255,255,0.1) 70px),
                                   repeating-linear-gradient(-45deg, transparent, transparent 35px, rgba(255,255,255,0.05) 35px, rgba(255,255,255,0.05) 70px)`
                }} />
              </div>
              
              {/* Floating elements for visual interest */}
              <div className="absolute top-10 right-10 text-6xl opacity-10 text-white transform rotate-12">
                🍽️
              </div>
              <div className="absolute bottom-10 left-10 text-5xl opacity-10 text-white transform -rotate-12">
                🥄
              </div>
              
              {/* Item name in center */}
              <div className="text-center px-8 z-10">
                <h3 className="text-3xl font-bold text-white mb-3 drop-shadow-lg">
                  {language === 'ar' && item.nameAr ? item.nameAr : item.name}
                </h3>
                {item.category && (
                  <span className="text-white/90 text-base font-medium">
                    {formatCategory(item.category)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Top badges */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            <div className="flex flex-wrap gap-2">
              {/* Category Badge - only show when there's an image */}
              {(item.image && !imageError) && (
                <span 
                  className="px-4 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-sm font-medium shadow-lg transition-all duration-300 hover:scale-105"
                  style={{ color: primaryColor }}
                >
                  {formatCategory(item.category)}
                </span>
              )}

              {/* Special badges */}
              {item.signatureDish && (
                <span className="px-4 py-1.5 bg-amber-500 text-white rounded-full text-sm font-medium shadow-lg flex items-center gap-1 transition-all duration-300 hover:scale-105">
                  <span className="text-base">⭐</span>
                  {language === 'ar' ? 'طبق مميز' : 'Signature Dish'}
                </span>
              )}
              
              {item.promotionPrice && (
                <span className="px-4 py-1.5 bg-red-500 text-white rounded-full text-sm font-medium shadow-lg animate-pulse">
                  {language === 'ar' ? 'عرض خاص' : 'Special Offer'}
                </span>
              )}

              {item.isNew && (
                <span className="px-4 py-1.5 bg-green-500 text-white rounded-full text-sm font-medium shadow-lg">
                  {language === 'ar' ? 'جديد' : 'New'}
                </span>
              )}
            </div>

            {/* Price on image */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg transition-all duration-300 hover:scale-105">
              {item.promotionPrice ? (
                <div className="text-right">
                  <div className="text-sm text-gray-500 line-through">{formatPrice(item.price)}</div>
                  <div className="text-xl font-bold text-red-600">{formatPrice(item.promotionPrice)}</div>
                </div>
              ) : (
                <div className="text-xl font-bold" style={{ color: primaryColor }}>
                  {formatPrice(item.price)}
                </div>
              )}
            </div>
          </div>

          {/* Bottom gradient info */}
          {(item.preparationTime || item.spicyLevel > 0) && (
            <div className="absolute bottom-4 left-4 flex gap-3">
              {item.preparationTime && (
                <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2 shadow-lg">
                  <span className="text-base">⏱️</span>
                  <span className="text-sm font-medium">{item.preparationTime} min</span>
                </div>
              )}
              {item.spicyLevel > 0 && (
                <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                  <span className="text-base">{'🌶️'.repeat(Math.min(item.spicyLevel, 3))}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-6">
          {/* Title and Description */}
          {(item.image && !imageError) && (
            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
              {language === 'ar' && item.nameAr ? item.nameAr : item.name}
            </h3>
          )}
          
          {item.description && (
            <p className="text-gray-600 line-clamp-2 mb-4 min-h-[3rem]">
              {language === 'ar' && item.descriptionAr ? item.descriptionAr : item.description}
            </p>
          )}

          {/* Nutrition Quick Info */}
          {(item.calories || item.walkMinutes || item.runMinutes || item.vitaminD) && (
            <div className="flex items-center gap-6 mb-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
              {item.calories && (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white text-lg">🔥</span>
                  </div>
                  <div>
                    <div className="text-base font-semibold text-gray-900">{item.calories}</div>
                    <div className="text-xs text-gray-500">calories</div>
                  </div>
                </div>
              )}
              
              {item.walkMinutes && (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white text-lg">🚶</span>
                  </div>
                  <div>
                    <div className="text-base font-semibold text-blue-600">{item.walkMinutes}</div>
                    <div className="text-xs text-gray-500">min walk</div>
                  </div>
                </div>
              )}
              
              {item.runMinutes && (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white text-lg">🏃</span>
                  </div>
                  <div>
                    <div className="text-base font-semibold text-purple-600">{item.runMinutes}</div>
                    <div className="text-xs text-gray-500">min run</div>
                  </div>
                </div>
              )}
              
              {item.vitaminD && (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white text-lg">☀️</span>
                  </div>
                  <div>
                    <div className="text-base font-semibold text-yellow-700">{item.vitaminD}%</div>
                    <div className="text-xs text-gray-500">Vitamin D</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dietary Info */}
          <div className="flex flex-wrap gap-2 mb-4">
            {item.halal && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                <span>✓</span>
                <span>{language === 'ar' ? 'حلال' : 'Halal'}</span>
              </span>
            )}
            {item.vegetarian && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                <span>🌿</span>
                <span>{language === 'ar' ? 'نباتي' : 'Vegetarian'}</span>
              </span>
            )}
            {item.vegan && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                <span>🌱</span>
                <span>{language === 'ar' ? 'نباتي صرف' : 'Vegan'}</span>
              </span>
            )}
            {item.glutenFree && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                <span>🌾</span>
                <span>{language === 'ar' ? 'خالي من الجلوتين' : 'Gluten Free'}</span>
              </span>
            )}
            {item.organic && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                <span>🌿</span>
                <span>{language === 'ar' ? 'عضوي' : 'Organic'}</span>
              </span>
            )}
            {item.caffeineMg && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                <span>☕</span>
                <span>{item.caffeineMg}mg {language === 'ar' ? 'كافيين' : 'Caffeine'}</span>
              </span>
            )}
          </div>

          {/* Allergens Section */}
          {allergenInfo && allergenInfo.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {language === 'ar' ? 'يحتوي على:' : 'Contains:'}
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {allergenInfo.slice(0, 5).map((allergen, index) => (
                      <div
                        key={index}
                        className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full border-2 border-white flex items-center justify-center shadow-md transition-all duration-300 hover:scale-110 hover:z-10"
                        style={{ zIndex: allergenInfo.length - index }}
                        title={allergen.displayName}
                      >
                        {allergen.iconUrl ? (
                          allergen.iconUrl.endsWith('.svg') ? (
                            <AllergenSVGIcon 
                              iconPath={allergen.iconUrl}
                              size="w-6 h-6"
                              primaryColor="#d97706"
                            />
                          ) : (
                            <span className="text-base">{allergen.iconUrl}</span>
                          )
                        ) : (
                          <span className="text-sm font-bold text-amber-700">
                            {allergen.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    ))}
                    {allergenInfo.length > 5 && (
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-full border-2 border-white flex items-center justify-center text-sm font-bold shadow-md">
                        +{allergenInfo.length - 5}
                      </div>
                    )}
                  </div>
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Click for more indicator */}
          <div className={`mt-4 pt-4 border-t flex items-center justify-center gap-2 text-gray-500 transition-all duration-300 ${isHovered ? 'text-gray-700' : ''}`}>
            <span className="text-sm font-medium">
              {language === 'ar' ? 'اضغط للمزيد من التفاصيل' : 'Click for full nutritional details'}
            </span>
            <svg className={`w-5 h-5 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Nutrition Modal */}
      <AmazingNutritionModal 
        item={item}
        isOpen={showNutritionModal}
        onClose={() => setShowNutritionModal(false)}
        language={language}
        formatCategory={formatCategory}
        settings={settings}
      />
    </>
  );
};

export default AmazingDesktopCard;