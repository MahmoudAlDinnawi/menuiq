import React, { useState } from 'react';
import AmazingNutritionModal from './AmazingNutritionModal';
import MultiItemModal from './MultiItemModal';
import AllergenSVGIcon from './AllergenSVGIcon';
import analyticsTracker from '../services/analyticsTracker';
import LazyImage from './LazyImage';

const MultiItemCard = ({ item, language, formatCategory, categories, settings, isMobile }) => {
  const [showNutritionModal, setShowNutritionModal] = useState(false);
  const [showMultiItemModal, setShowMultiItemModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Get primary color from settings
  const primaryColor = settings?.primaryColor || '#00594f';

  // Format price - price already includes currency from backend
  const formatPrice = (price) => {
    return price || '0';
  };

  // Format price range for multi-items
  const formatPriceRange = () => {
    if (!item.is_multi_item || !item.price_min || !item.price_max) {
      return formatPrice(item.price);
    }
    
    if (item.price_min === item.price_max) {
      return formatPrice(item.price_min);
    }
    
    return `${formatPrice(item.price_min)} - ${formatPrice(item.price_max)}`;
  };

  // Get allergen display info
  const getAllergenInfo = (menuItem) => {
    if (!menuItem.allergens || menuItem.allergens.length === 0) return null;
    
    const allergens = menuItem.allergens.map(allergen => {
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

  // Get upsell icon emoji
  const getUpsellIcon = () => {
    const icons = {
      star: '⭐',
      fire: '🔥',
      crown: '👑',
      diamond: '💎',
      rocket: '🚀',
      heart: '❤️',
      lightning: '⚡',
      trophy: '🏆'
    };
    return icons[item.upsell_icon] || '⭐';
  };

  // Build card classes
  const cardClasses = `bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
    item.is_upsell ? 'relative ring-2' : ''
  } ${
    item.is_upsell && item.upsell_animation === 'glow' ? 'upsell-glow' : ''
  } ${
    item.is_upsell && item.upsell_animation === 'shine' ? 'upsell-shine' : ''
  }`;

  const cardStyle = item.is_upsell ? {
    borderColor: item.upsell_border_color || '#FFD700',
    backgroundColor: item.upsell_background_color || '#FFFFFF',
    '--ring-color': item.upsell_border_color || '#FFD700'
  } : {};

  return (
    <>
      <div className={cardClasses} style={cardStyle}>
        {/* Main Item Header */}
        <div 
          className="cursor-pointer"
          onClick={() => {
            setShowMultiItemModal(true);
            analyticsTracker.trackItemClick(item.id, item.categoryId);
          }}
        >
          {/* Image Section */}
          <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
            {item.image && !imageError ? (
              <>
                <LazyImage 
                  src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${item.image}`}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                  placeholder="/images/placeholder.svg"
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
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.1) 35px, rgba(255,255,255,0.1) 70px)`
                  }} />
                </div>
                
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

            {/* Badges */}
            <div className="absolute top-3 left-3 right-3">
              <div className="flex flex-wrap gap-2">
                {(item.image && !imageError) && (
                  <span 
                    className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium shadow-sm"
                    style={{ color: primaryColor }}
                  >
                    {formatCategory(item.category)}
                  </span>
                )}

                {item.is_multi_item && (
                  <span className="px-3 py-1 bg-purple-500 text-white rounded-full text-xs font-medium shadow-sm flex items-center gap-1">
                    <span className="text-sm">📋</span>
                    {language === 'ar' ? 'متعدد' : 'Multiple Options'}
                  </span>
                )}

                {item.signatureDish && (
                  <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-xs font-medium shadow-sm flex items-center gap-1">
                    <span className="text-sm">⭐</span>
                    {language === 'ar' ? 'طبق مميز' : 'Signature'}
                  </span>
                )}

                {item.is_upsell && item.upsell_badge_text && (
                  <span 
                    className="px-3 py-1 text-white rounded-full text-xs font-medium shadow-sm flex items-center gap-1"
                    style={{ backgroundColor: item.upsell_badge_color || '#FFD700' }}
                  >
                    <span className="text-sm">{getUpsellIcon()}</span>
                    {item.upsell_badge_text}
                  </span>
                )}
              </div>
            </div>

            {/* Price on image */}
            <div className="absolute bottom-3 right-3">
              <div 
                className="px-4 py-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg font-bold text-lg"
                style={{ color: primaryColor }}
              >
                {formatPriceRange()}
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-5">
            <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-1">
              {language === 'ar' && item.nameAr ? item.nameAr : item.name}
            </h3>
            
            {item.description && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {language === 'ar' && item.descriptionAr ? item.descriptionAr : item.description}
              </p>
            )}

            {/* Quick Info for main item */}
            {!item.is_multi_item && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {item.calories && (
                    <span className="flex items-center gap-1">
                      <span>🔥</span>
                      {item.calories} {language === 'ar' ? 'سعرة' : 'cal'}
                    </span>
                  )}
                  {item.preparationTime && (
                    <span className="flex items-center gap-1">
                      <span>⏱️</span>
                      {item.preparationTime} {language === 'ar' ? 'د' : 'min'}
                    </span>
                  )}
                </div>
                {getAllergenInfo(item) && (
                  <div className="flex gap-1">
                    {getAllergenInfo(item).map((allergen, idx) => (
                      <AllergenSVGIcon 
                        key={idx}
                        allergenName={allergen.name}
                        className="w-6 h-6"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Multi-item indicator */}
            {item.is_multi_item && (
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs sm:text-sm text-gray-600">
                  {item.sub_items?.length || 0} {language === 'ar' ? 'خيارات' : 'options'}
                </span>
                <span 
                  className="text-xs sm:text-sm font-medium flex items-center gap-1"
                  style={{ color: primaryColor }}
                >
                  {language === 'ar' ? 'عرض الخيارات' : 'View Options'}
                  <svg 
                    className="w-3 h-3 sm:w-4 sm:h-4"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Multi-Item Modal */}
      {showMultiItemModal && (
        <MultiItemModal
          item={item}
          language={language}
          onClose={() => setShowMultiItemModal(false)}
          settings={settings}
        />
      )}

      {/* Nutrition Modal */}
      {showNutritionModal && (
        <AmazingNutritionModal
          item={item}
          language={language}
          onClose={() => setShowNutritionModal(false)}
          settings={settings}
        />
      )}
    </>
  );
};

export default MultiItemCard;