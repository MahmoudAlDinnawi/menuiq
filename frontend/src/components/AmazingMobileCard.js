import React, { useState } from 'react';
import AmazingNutritionModal from './AmazingNutritionModal';
import AllergenSVGIcon from './AllergenSVGIcon';

const AmazingMobileCard = ({ item, language, formatCategory, categories, settings }) => {
  const [showNutritionModal, setShowNutritionModal] = useState(false);
  const [imageError, setImageError] = useState(false);

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
        className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
        onClick={() => setShowNutritionModal(true)}
      >
        {/* Image Section with Overlay Info */}
        <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
          {item.image && !imageError ? (
            <>
              <img 
                src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${item.image}`}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
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
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.1) 35px, rgba(255,255,255,0.1) 70px)`
                }} />
              </div>
              
              {/* Item name in center */}
              <div className="text-center px-6 z-10">
                <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
                  {language === 'ar' && item.nameAr ? item.nameAr : item.name}
                </h3>
                {item.category && (
                  <span className="text-white/80 text-sm font-medium">
                    {formatCategory(item.category)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Top badges */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
            <div className="flex flex-wrap gap-2">
              {/* Category Badge - only show when there's an image */}
              {(item.image && !imageError) && (
                <span 
                  className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium shadow-sm"
                  style={{ color: primaryColor }}
                >
                  {formatCategory(item.category)}
                </span>
              )}

              {/* Special badges */}
              {item.signatureDish && (
                <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-xs font-medium shadow-sm flex items-center gap-1">
                  <span className="text-sm">⭐</span>
                  {language === 'ar' ? 'طبق مميز' : 'Signature'}
                </span>
              )}
              
              {item.promotionPrice && (
                <span className="px-3 py-1 bg-red-500 text-white rounded-full text-xs font-medium shadow-sm animate-pulse">
                  {language === 'ar' ? 'عرض' : 'Offer'}
                </span>
              )}
            </div>

            {/* Price on image */}
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
              {item.promotionPrice ? (
                <div className="text-right">
                  <div className="text-xs text-gray-500 line-through">{formatPrice(item.price)}</div>
                  <div className="text-lg font-bold text-red-600">{formatPrice(item.promotionPrice)}</div>
                </div>
              ) : (
                <div className="text-lg font-bold" style={{ color: primaryColor }}>
                  {formatPrice(item.price)}
                </div>
              )}
            </div>
          </div>

          {/* Bottom gradient info */}
          {(item.preparationTime || item.spicyLevel > 0) && (
            <div className="absolute bottom-3 left-3 flex gap-3">
              {item.preparationTime && (
                <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
                  <span className="text-sm">⏱️</span>
                  <span className="text-xs font-medium">{item.preparationTime}m</span>
                </div>
              )}
              {item.spicyLevel > 0 && (
                <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1">
                  <span className="text-sm">{'🌶️'.repeat(Math.min(item.spicyLevel, 3))}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4">
          {/* Title and Description */}
          {(item.image && !imageError) && (
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {language === 'ar' && item.nameAr ? item.nameAr : item.name}
            </h3>
          )}
          
          {item.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {language === 'ar' && item.descriptionAr ? item.descriptionAr : item.description}
            </p>
          )}

          {/* Nutrition Quick Info */}
          {(item.calories || item.walkMinutes || item.runMinutes) && (
            <div className="flex items-center gap-4 mb-3 p-3 bg-gray-50 rounded-lg">
              {item.calories && (
                <div className="flex items-center gap-1">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-sm">🔥</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{item.calories}</div>
                    <div className="text-xs text-gray-500">kcal</div>
                  </div>
                </div>
              )}
              
              {item.walkMinutes && (
                <div className="flex items-center gap-1">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm">🚶</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-blue-600">{item.walkMinutes}</div>
                    <div className="text-xs text-gray-500">min</div>
                  </div>
                </div>
              )}
              
              {item.runMinutes && (
                <div className="flex items-center gap-1">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm">🏃</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-purple-600">{item.runMinutes}</div>
                    <div className="text-xs text-gray-500">min</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dietary Info */}
          <div className="flex flex-wrap gap-2 mb-3">
            {item.halal && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                <span>✓</span>
                <span>{language === 'ar' ? 'حلال' : 'Halal'}</span>
              </span>
            )}
            {item.vegetarian && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                <span>🌿</span>
                <span>{language === 'ar' ? 'نباتي' : 'Vegetarian'}</span>
              </span>
            )}
            {item.vegan && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                <span>🌱</span>
                <span>{language === 'ar' ? 'نباتي صرف' : 'Vegan'}</span>
              </span>
            )}
            {item.glutenFree && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                <span>🌾</span>
                <span>{language === 'ar' ? 'خالي من الجلوتين' : 'Gluten Free'}</span>
              </span>
            )}
          </div>

          {/* Allergens Section */}
          {allergenInfo && allergenInfo.length > 0 && (
            <div className="border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">
                  {language === 'ar' ? 'يحتوي على:' : 'Contains:'}
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {allergenInfo.slice(0, 4).map((allergen, index) => (
                      <div
                        key={index}
                        className="w-8 h-8 bg-amber-100 rounded-full border-2 border-white flex items-center justify-center"
                        style={{ zIndex: allergenInfo.length - index }}
                        title={allergen.displayName}
                      >
                        {allergen.iconUrl ? (
                          allergen.iconUrl.endsWith('.svg') ? (
                            <AllergenSVGIcon 
                              iconPath={allergen.iconUrl}
                              size="w-5 h-5"
                              primaryColor="#d97706"
                            />
                          ) : (
                            <span className="text-sm">{allergen.iconUrl}</span>
                          )
                        ) : (
                          <span className="text-xs font-bold text-amber-700">
                            {allergen.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    ))}
                    {allergenInfo.length > 4 && (
                      <div className="w-8 h-8 bg-amber-600 text-white rounded-full border-2 border-white flex items-center justify-center text-xs font-bold">
                        +{allergenInfo.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tap for more indicator */}
          <div className="mt-3 pt-3 border-t flex items-center justify-center gap-2 text-gray-400">
            <span className="text-xs">
              {language === 'ar' ? 'اضغط للمزيد من التفاصيل' : 'Tap for full details'}
            </span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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

export default AmazingMobileCard;