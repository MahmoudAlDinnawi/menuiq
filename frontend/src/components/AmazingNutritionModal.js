import React, { useEffect, useState } from 'react';
import CustomAllergenIcons from './CustomAllergenIcons';
import DietaryIcons from './DietaryIcons';
import AllergenSVGIcon from './AllergenSVGIcon';

const AmazingNutritionModal = ({ item, isOpen, onClose, language, formatCategory, settings }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const primaryColor = settings?.primaryColor || '#00594f';
  
  const formatLabel = (label, labelAr) => {
    return language === 'ar' ? labelAr : label;
  };
  
  const formatCategoryName = (category) => {
    if (formatCategory) {
      return formatCategory(category);
    }
    return category;
  };

  const hasNutritionLabel = item.totalFat !== null || item.protein !== null || item.totalCarbs !== null || item.sodium !== null;

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
    <div 
      className={`fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
    >
      <div 
        className={`bg-white rounded-2xl md:rounded-3xl w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl transform transition-all duration-500 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'}`}
        onClick={(e) => e.stopPropagation()}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header with Split Layout for Desktop */}
        <div className="lg:flex lg:h-[90vh]">
          {/* Left Side - Image or Gradient */}
          <div className="lg:w-1/2 relative h-64 lg:h-full">
            {item.image && !imageError ? (
              <>
                <img 
                  src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${item.image}`}
                  alt={language === 'ar' && item.nameAr ? item.nameAr : item.name}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent lg:bg-gradient-to-r lg:from-black/70 lg:via-black/20 lg:to-transparent"></div>
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
                    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 50px, rgba(255,255,255,0.1) 50px, rgba(255,255,255,0.1) 100px),
                                     repeating-linear-gradient(-45deg, transparent, transparent 50px, rgba(255,255,255,0.05) 50px, rgba(255,255,255,0.05) 100px)`
                  }} />
                </div>
                
                {/* Floating elements */}
                <div className="absolute top-20 right-20 text-8xl opacity-10 text-white transform rotate-12 animate-float">
                  🍽️
                </div>
                <div className="absolute bottom-20 left-20 text-7xl opacity-10 text-white transform -rotate-12 animate-float" style={{ animationDelay: '2s' }}>
                  🥄
                </div>
                <div className="absolute top-40 left-32 text-6xl opacity-10 text-white transform rotate-45 animate-float" style={{ animationDelay: '4s' }}>
                  🍴
                </div>
                
                {/* Item name in center */}
                <div className="text-center px-4 md:px-8 z-10">
                  <h2 className="text-2xl md:text-5xl font-bold text-white mb-2 md:mb-4 drop-shadow-lg">
                    {language === 'ar' && item.nameAr ? item.nameAr : item.name}
                  </h2>
                  <span className="text-white/90 text-sm md:text-xl font-medium">
                    {formatCategoryName(item.category)}
                  </span>
                </div>
              </div>
            )}
            
            {/* Price and Badges Overlay */}
            <div className="absolute bottom-4 md:bottom-6 left-4 md:left-6 right-4 md:right-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                {/* Left side - Name and Category (only when there's image) */}
                {(item.image && !imageError) && (
                  <div className="text-white flex-1">
                    <p className="text-sm md:text-base opacity-90 mb-1 md:mb-2">{formatCategoryName(item.category)}</p>
                    <h2 className="text-xl md:text-4xl font-bold mb-2 drop-shadow-lg line-clamp-2">
                      {language === 'ar' && item.nameAr ? item.nameAr : item.name}
                    </h2>
                  </div>
                )}
                
                {/* Right side - Price */}
                <div className="bg-white/95 backdrop-blur-sm rounded-xl md:rounded-2xl px-3 py-2 md:px-6 md:py-4 shadow-xl flex-shrink-0 self-start md:self-auto">
                  {item.promotionPrice ? (
                    <div className="text-right">
                      <div className="text-xs md:text-base text-gray-500 line-through">{item.price}</div>
                      <div className="text-lg md:text-3xl font-bold text-red-600">{item.promotionPrice}</div>
                      <div className="text-xs md:text-sm text-red-500 font-medium mt-0.5 md:mt-1">
                        {formatLabel('Special Offer', 'عرض خاص')}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-lg md:text-3xl font-bold" style={{ color: primaryColor }}>
                        {item.price}
                      </div>
                      {item.priceWithoutVat && (
                        <div className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1">
                          {formatLabel('Before VAT', 'قبل الضريبة')}: {item.priceWithoutVat}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* Special Badges */}
              <div className="flex flex-wrap gap-2 mt-2 md:mt-4">
                {item.signatureDish && (
                  <span className="px-2.5 py-1 md:px-4 md:py-2 bg-amber-500 text-white rounded-full text-xs md:text-sm font-medium shadow-lg flex items-center gap-1 md:gap-2">
                    <span className="text-xs md:text-base">⭐</span>
                    {language === 'ar' ? 'طبق مميز' : 'Signature Dish'}
                  </span>
                )}
                {item.isNew && (
                  <span className="px-2.5 py-1 md:px-4 md:py-2 bg-green-500 text-white rounded-full text-xs md:text-sm font-medium shadow-lg">
                    {language === 'ar' ? 'جديد' : 'New'}
                  </span>
                )}
                {item.limitedAvailability && (
                  <span className="px-2.5 py-1 md:px-4 md:py-2 bg-purple-500 text-white rounded-full text-xs md:text-sm font-medium shadow-lg">
                    {language === 'ar' ? 'كمية محدودة' : 'Limited'}
                  </span>
                )}
              </div>
            </div>
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 hover:scale-110 group"
            >
              <svg className="w-6 h-6 transition-transform duration-300 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Right Side - Scrollable Content */}
          <div className="lg:w-1/2 overflow-y-auto max-h-[calc(95vh-16rem)] lg:max-h-full">
            <div className="p-6 md:p-8 lg:p-10">
              {/* Description */}
              {item.description && (
                <div className="mb-8">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {language === 'ar' && item.descriptionAr ? item.descriptionAr : item.description}
                  </p>
                </div>
              )}
              
              {/* Quick Stats Grid */}
              {(item.calories !== null || item.preparationTime || item.servingSize || item.spicyLevel > 0) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
                  {item.calories !== null && (
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-400 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                      <div className="relative bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-4 md:p-6 text-center border border-orange-100 hover:scale-105 transition-transform cursor-pointer">
                        <div className="text-3xl md:text-4xl mb-2">🔥</div>
                        <div className="text-2xl md:text-3xl font-bold text-gray-900">{item.calories}</div>
                        <div className="text-xs md:text-sm text-gray-600 font-medium">{formatLabel('Calories', 'سعرات')}</div>
                      </div>
                    </div>
                  )}
                  {item.preparationTime && (
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                      <div className="relative bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 md:p-6 text-center border border-blue-100 hover:scale-105 transition-transform cursor-pointer">
                        <div className="text-3xl md:text-4xl mb-2">⏱️</div>
                        <div className="text-2xl md:text-3xl font-bold text-gray-900">{item.preparationTime}</div>
                        <div className="text-xs md:text-sm text-gray-600 font-medium">{formatLabel('Minutes', 'دقيقة')}</div>
                      </div>
                    </div>
                  )}
                  {item.servingSize && (
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-400 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                      <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 md:p-6 text-center border border-green-100 hover:scale-105 transition-transform cursor-pointer">
                        <div className="text-3xl md:text-4xl mb-2">🍽️</div>
                        <div className="text-xl md:text-2xl font-bold text-gray-900">{item.servingSize}</div>
                        <div className="text-xs md:text-sm text-gray-600 font-medium">{formatLabel('Serving', 'حصة')}</div>
                      </div>
                    </div>
                  )}
                  {item.spicyLevel > 0 && (
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-pink-400 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                      <div className="relative bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-4 md:p-6 text-center border border-red-100 hover:scale-105 transition-transform cursor-pointer">
                        <div className="text-3xl md:text-4xl mb-2">🌶️</div>
                        <div className="flex justify-center">
                          {[...Array(3)].map((_, i) => (
                            <span key={i} className={`text-xl md:text-2xl ${i < item.spicyLevel ? 'opacity-100' : 'opacity-30'}`}>🌶️</span>
                          ))}
                        </div>
                        <div className="text-xs md:text-sm text-gray-600 font-medium">{formatLabel('Spicy', 'حار')}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Exercise Equivalents */}
              {(item.walkMinutes || item.runMinutes) && (
                <div className="mb-8 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 rounded-2xl p-4 md:p-6 border border-purple-100">
                  <h4 className="text-center text-base md:text-lg font-bold text-gray-800 mb-4 md:mb-6">
                    {formatLabel('Burn These Calories', 'احرق هذه السعرات')} 💪
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {item.walkMinutes && (
                      <div className="bg-white rounded-xl p-4 md:p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-4xl md:text-5xl mb-2 md:mb-3">🚶</div>
                        <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">{item.walkMinutes}</div>
                        <div className="text-xs md:text-sm text-gray-600 font-medium">{formatLabel('Minutes Walking', 'دقيقة مشي')}</div>
                      </div>
                    )}
                    {item.runMinutes && (
                      <div className="bg-white rounded-xl p-4 md:p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-4xl md:text-5xl mb-2 md:mb-3">🏃</div>
                        <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-1">{item.runMinutes}</div>
                        <div className="text-xs md:text-sm text-gray-600 font-medium">{formatLabel('Minutes Running', 'دقيقة جري')}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Dietary Badges */}
              {(item.halal || item.vegetarian || item.vegan || item.glutenFree || item.organic) && (
                <div className="mb-8">
                  <h4 className="text-lg font-bold text-gray-800 mb-4">
                    {formatLabel('Dietary Information', 'معلومات النظام الغذائي')}
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {item.halal && (
                      <span className="px-5 py-3 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 text-emerald-700 rounded-full text-base font-medium flex items-center gap-2 hover:scale-105 transition-transform">
                        <span className="text-lg">✓</span>
                        <span>{language === 'ar' ? 'حلال' : 'Halal Certified'}</span>
                      </span>
                    )}
                    {item.vegetarian && (
                      <span className="px-5 py-3 bg-gradient-to-r from-green-50 to-lime-50 border border-green-200 text-green-700 rounded-full text-base font-medium flex items-center gap-2 hover:scale-105 transition-transform">
                        <span className="text-lg">🌿</span>
                        <span>{language === 'ar' ? 'نباتي' : 'Vegetarian'}</span>
                      </span>
                    )}
                    {item.vegan && (
                      <span className="px-5 py-3 bg-gradient-to-r from-lime-50 to-green-50 border border-lime-200 text-lime-700 rounded-full text-base font-medium flex items-center gap-2 hover:scale-105 transition-transform">
                        <span className="text-lg">🌱</span>
                        <span>{language === 'ar' ? 'نباتي صرف' : 'Vegan'}</span>
                      </span>
                    )}
                    {item.glutenFree && (
                      <span className="px-5 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 text-amber-700 rounded-full text-base font-medium flex items-center gap-2 hover:scale-105 transition-transform">
                        <span className="text-lg">🌾</span>
                        <span>{language === 'ar' ? 'خالي من الجلوتين' : 'Gluten Free'}</span>
                      </span>
                    )}
                    {item.organic && (
                      <span className="px-5 py-3 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 text-teal-700 rounded-full text-base font-medium flex items-center gap-2 hover:scale-105 transition-transform">
                        <span className="text-lg">🌿</span>
                        <span>{language === 'ar' ? 'عضوي' : 'Organic'}</span>
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Allergens Warning Box */}
              {allergenInfo && allergenInfo.length > 0 && (
                <div className="mb-8 relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 rounded-2xl p-4 md:p-6 border-2 border-amber-200">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <h4 className="text-xl font-bold text-amber-800">
                        {formatLabel('Allergen Information', 'معلومات المواد المسببة للحساسية')}
                      </h4>
                    </div>
                    
                    <p className="text-amber-700 font-medium mb-4">
                      {formatLabel('This item contains:', 'يحتوي هذا الطبق على:')}
                    </p>
                    
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                      {allergenInfo.map((allergen, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-xl p-3 md:p-4 text-center hover:scale-105 transition-transform cursor-pointer shadow-sm"
                        >
                          <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-2 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center">
                            {allergen.iconUrl ? (
                              allergen.iconUrl.endsWith('.svg') ? (
                                <AllergenSVGIcon 
                                  iconPath={allergen.iconUrl}
                                  size="w-8 h-8 md:w-10 md:h-10"
                                  primaryColor="#f59e0b"
                                />
                              ) : (
                                <span className="text-3xl">{allergen.iconUrl}</span>
                              )
                            ) : (
                              <span className="text-2xl font-bold text-amber-600">
                                {allergen.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-700">
                            {allergen.displayName}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Nutrition Facts Label Section */}
              {hasNutritionLabel && (
                <div className="mb-8">
                  <h4 className="text-lg font-bold text-gray-800 mb-4">
                    {formatLabel('Nutrition Facts', 'حقائق التغذية')}
                  </h4>
                  
                  <div className="bg-white border-4 border-black rounded-lg p-4 max-w-sm mx-auto">
                    <h2 className="text-2xl font-black text-center mb-1">{formatLabel('Nutrition Facts', 'حقائق التغذية')}</h2>
                    {item.servingSize && (
                      <p className="text-sm text-center border-b-2 border-black pb-2 mb-2">
                        {formatLabel('Serving Size:', 'حجم الحصة:')} {item.servingSize}
                      </p>
                    )}
                    
                    <div className="border-b-8 border-black pb-1 mb-2">
                      <p className="text-xs font-bold">{formatLabel('Amount Per Serving', 'الكمية لكل حصة')}</p>
                      <div className="flex justify-between items-baseline">
                        <h3 className="text-xl font-black">{formatLabel('Calories', 'السعرات الحرارية')}</h3>
                        <span className="text-2xl font-black">{item.calories || 0}</span>
                      </div>
                    </div>
                    
                    <p className="text-right text-xs font-bold mb-1">{formatLabel('% Daily Value*', '٪ القيمة اليومية*')}</p>
                    
                    <div className="space-y-1">
                      {item.totalFat !== null && (
                        <div className="flex justify-between border-b border-gray-300 pb-1">
                          <span className="text-sm">
                            <strong>{formatLabel('Total Fat', 'إجمالي الدهون')}</strong> {item.totalFat}{formatLabel('g', 'جم')}
                          </span>
                          <span className="text-sm font-bold">{Math.round((item.totalFat / 65) * 100)}%</span>
                        </div>
                      )}
                      
                      {item.saturatedFat !== null && (
                        <div className="flex justify-between border-b border-gray-300 pb-1 ml-4">
                          <span className="text-sm">{formatLabel('Saturated Fat', 'الدهون المشبعة')} {item.saturatedFat}{formatLabel('g', 'جم')}</span>
                          <span className="text-sm font-bold">{Math.round((item.saturatedFat / 20) * 100)}%</span>
                        </div>
                      )}
                      
                      {item.transFat !== null && (
                        <div className="flex justify-between border-b border-gray-300 pb-1 ml-4">
                          <span className="text-sm">{formatLabel('Trans Fat', 'الدهون المتحولة')} {item.transFat}{formatLabel('g', 'جم')}</span>
                        </div>
                      )}
                      
                      {item.cholesterol !== null && (
                        <div className="flex justify-between border-b border-gray-300 pb-1">
                          <span className="text-sm">
                            <strong>{formatLabel('Cholesterol', 'الكولسترول')}</strong> {item.cholesterol}{formatLabel('mg', 'ملجم')}
                          </span>
                          <span className="text-sm font-bold">{Math.round((item.cholesterol / 300) * 100)}%</span>
                        </div>
                      )}
                      
                      {item.sodium !== null && (
                        <div className="flex justify-between border-b border-gray-300 pb-1">
                          <span className="text-sm">
                            <strong>{formatLabel('Sodium', 'الصوديوم')}</strong> {item.sodium}{formatLabel('mg', 'ملجم')}
                          </span>
                          <span className="text-sm font-bold">{Math.round((item.sodium / 2300) * 100)}%</span>
                        </div>
                      )}
                      
                      {item.totalCarbs !== null && (
                        <div className="flex justify-between border-b border-gray-300 pb-1">
                          <span className="text-sm">
                            <strong>{formatLabel('Total Carbohydrate', 'إجمالي الكربوهيدرات')}</strong> {item.totalCarbs}{formatLabel('g', 'جم')}
                          </span>
                          <span className="text-sm font-bold">{Math.round((item.totalCarbs / 300) * 100)}%</span>
                        </div>
                      )}
                      
                      {item.dietaryFiber !== null && (
                        <div className="flex justify-between border-b border-gray-300 pb-1 ml-4">
                          <span className="text-sm">{formatLabel('Dietary Fiber', 'الألياف الغذائية')} {item.dietaryFiber}{formatLabel('g', 'جم')}</span>
                          <span className="text-sm font-bold">{Math.round((item.dietaryFiber / 25) * 100)}%</span>
                        </div>
                      )}
                      
                      {item.sugars !== null && (
                        <div className="flex justify-between border-b border-gray-300 pb-1 ml-4">
                          <span className="text-sm">{formatLabel('Sugars', 'السكريات')} {item.sugars}{formatLabel('g', 'جم')}</span>
                        </div>
                      )}
                      
                      {item.protein !== null && (
                        <div className="flex justify-between border-b-4 border-black pb-2 mb-2">
                          <span className="text-sm">
                            <strong>{formatLabel('Protein', 'البروتين')}</strong> {item.protein}{formatLabel('g', 'جم')}
                          </span>
                        </div>
                      )}
                      
                      {/* Vitamins and Minerals */}
                      <div className="space-y-1">
                        {item.vitaminA !== null && (
                          <div className="flex justify-between border-b border-gray-300 pb-1">
                            <span className="text-sm">{formatLabel('Vitamin A', 'فيتامين أ')}</span>
                            <span className="text-sm font-bold">{item.vitaminA}%</span>
                          </div>
                        )}
                        {item.vitaminC !== null && (
                          <div className="flex justify-between border-b border-gray-300 pb-1">
                            <span className="text-sm">{formatLabel('Vitamin C', 'فيتامين ج')}</span>
                            <span className="text-sm font-bold">{item.vitaminC}%</span>
                          </div>
                        )}
                        {item.calcium !== null && (
                          <div className="flex justify-between border-b border-gray-300 pb-1">
                            <span className="text-sm">{formatLabel('Calcium', 'الكالسيوم')}</span>
                            <span className="text-sm font-bold">{item.calcium}%</span>
                          </div>
                        )}
                        {item.iron !== null && (
                          <div className="flex justify-between pb-1">
                            <span className="text-sm">{formatLabel('Iron', 'الحديد')}</span>
                            <span className="text-sm font-bold">{item.iron}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-xs mt-3 leading-tight">
                      {formatLabel(
                        '* Percent Daily Values are based on a 2,000 calorie diet. Your daily values may be higher or lower depending on your calorie needs.',
                        '* النسب المئوية للقيم اليومية مبنية على نظام غذائي يحتوي على 2000 سعرة حرارية. قد تكون قيمك اليومية أعلى أو أقل حسب احتياجاتك من السعرات الحرارية.'
                      )}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Additional Info */}
              {(item.ingredients || item.chefNotes || item.pairingSuggestions) && (
                <div className="space-y-6">
                  {item.ingredients && (
                    <div>
                      <h4 className="text-lg font-bold text-gray-800 mb-3">
                        {formatLabel('Ingredients', 'المكونات')}
                      </h4>
                      <p className="text-gray-600 leading-relaxed">{item.ingredients}</p>
                    </div>
                  )}
                  
                  {item.chefNotes && (
                    <div>
                      <h4 className="text-lg font-bold text-gray-800 mb-3">
                        {formatLabel("Chef's Notes", 'ملاحظات الشيف')}
                      </h4>
                      <p className="text-gray-600 leading-relaxed italic">{item.chefNotes}</p>
                    </div>
                  )}
                  
                  {item.pairingSuggestions && (
                    <div>
                      <h4 className="text-lg font-bold text-gray-800 mb-3">
                        {formatLabel('Pairing Suggestions', 'اقتراحات التقديم')}
                      </h4>
                      <p className="text-gray-600 leading-relaxed">{item.pairingSuggestions}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmazingNutritionModal;