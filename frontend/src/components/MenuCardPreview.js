import React, { useState } from 'react';

const MenuCardPreview = ({ item, categories }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const category = categories.find(c => c.id === item.category_id);
  
  const getDietaryIcons = () => {
    const icons = [];
    if (item.halal) icons.push({ type: 'halal', label: 'Halal', icon: '🥩' });
    if (item.vegetarian) icons.push({ type: 'vegetarian', label: 'Vegetarian', icon: '🥗' });
    if (item.vegan) icons.push({ type: 'vegan', label: 'Vegan', icon: '🌱' });
    if (item.gluten_free) icons.push({ type: 'glutenFree', label: 'Gluten Free', icon: '🌾' });
    if (item.dairy_free) icons.push({ type: 'dairyFree', label: 'Dairy Free', icon: '🥛' });
    if (item.nut_free) icons.push({ type: 'nutFree', label: 'Nut Free', icon: '🥜' });
    return icons;
  };

  return (
    <>
      <div 
        className="group cursor-pointer transform transition-all duration-300 hover:scale-[1.02]"
        onClick={() => setShowDetails(true)}
      >
        <div className="relative h-full bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl border border-gray-100">
          {/* Status Badges */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            {!item.is_available && (
              <span className="px-3 py-1 bg-gray-800/80 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                Unavailable
              </span>
            )}
            {item.limited_availability && (
              <span className="px-3 py-1 bg-orange-500/80 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                Limited
              </span>
            )}
            {item.pre_order_required && (
              <span className="px-3 py-1 bg-purple-500/80 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                Pre-order
              </span>
            )}
          </div>

          {/* Custom Badge */}
          {item.badge_text && (
            <div className="absolute top-4 right-4 z-10">
              <span 
                className="px-3 py-1 text-white text-xs font-bold rounded-full shadow-lg"
                style={{ backgroundColor: item.badge_color || '#EF4444' }}
              >
                {item.badge_text}
              </span>
            </div>
          )}
          
          {/* Special Recognition */}
          {(item.signature_dish || item.michelin_recommended || item.award_winning) && (
            <div className="absolute top-14 right-4 z-10 flex flex-col gap-2">
              {item.signature_dish && (
                <div className="bg-gold-gradient text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                  <span>⭐</span> Signature
                </div>
              )}
              {item.michelin_recommended && (
                <div className="bg-red-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                  Michelin ★
                </div>
              )}
              {item.award_winning && (
                <div className="bg-purple-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                  🏆 Award Winner
                </div>
              )}
            </div>
          )}
          
          {/* Image Section */}
          <div className="relative h-52 overflow-hidden bg-gray-100">
            {item.image ? (
              <img 
                src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${item.image}`}
                alt={item.name}
                className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
            
            {/* Category Badge */}
            {category && (
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-md flex items-center gap-2">
                {category.icon && <span className="text-sm">{category.icon}</span>}
                <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                  {category.name}
                </span>
              </div>
            )}

            {/* Instagram Worthy */}
            {item.instagram_worthy && (
              <div className="absolute bottom-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full p-2 shadow-lg">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                </svg>
              </div>
            )}
          </div>
          
          {/* Content Section */}
          <div className="p-6">
            {/* Title and Price */}
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-1">{item.name}</h3>
              <div className="flex items-baseline gap-2">
                {item.promotion_price ? (
                  <>
                    <span className="text-2xl font-bold text-red-600">{item.promotion_price} SAR</span>
                    <span className="text-lg text-gray-400 line-through">{item.price} SAR</span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-[#00594f]">{item.price || '0'} SAR</span>
                )}
                {item.price_without_vat && (
                  <span className="text-sm text-gray-500">(Before VAT: {item.price_without_vat} SAR)</span>
                )}
              </div>
            </div>
            
            {/* Highlight Message */}
            {item.highlight_message && (
              <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">{item.highlight_message}</p>
              </div>
            )}
            
            {/* Description */}
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {item.description || 'No description available'}
            </p>
            
            {/* Quick Info Grid */}
            {(item.calories || item.preparation_time || item.portion_size) && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                {item.calories && (
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-semibold text-gray-900">{item.calories}</div>
                    <div className="text-xs text-gray-500">Calories</div>
                  </div>
                )}
                
                {item.preparation_time && (
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-semibold text-blue-700">{item.preparation_time}'</div>
                    <div className="text-xs text-gray-500">Prep Time</div>
                  </div>
                )}
                
                {item.portion_size && (
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <div className="text-sm font-semibold text-purple-700">{item.portion_size}</div>
                    <div className="text-xs text-gray-500">Portion</div>
                  </div>
                )}
              </div>
            )}
            
            {/* Exercise Equivalents */}
            {(item.walk_minutes || item.run_minutes) && (
              <div className="flex gap-3 mb-4">
                {item.walk_minutes && (
                  <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
                    <span className="text-lg">🚶</span>
                    <span className="text-sm font-medium text-blue-700">{item.walk_minutes} min</span>
                  </div>
                )}
                {item.run_minutes && (
                  <div className="flex items-center gap-1 bg-purple-50 px-3 py-1 rounded-full">
                    <span className="text-lg">🏃</span>
                    <span className="text-sm font-medium text-purple-700">{item.run_minutes} min</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Dietary Tags */}
            {getDietaryIcons().length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {getDietaryIcons().map((diet, index) => (
                  <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                    <span>{diet.icon}</span>
                    {diet.label}
                  </span>
                ))}
              </div>
            )}
            
            {/* Culinary Info */}
            {(item.cooking_method || item.origin_country || item.flavor_profile) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {item.cooking_method && (
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    👨‍🍳 {item.cooking_method}
                  </span>
                )}
                {item.origin_country && (
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    🌍 {item.origin_country}
                  </span>
                )}
                {item.flavor_profile && (
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    👅 {item.flavor_profile}
                  </span>
                )}
              </div>
            )}
            
            {/* Warnings */}
            {(item.spicy_level > 0 || item.high_sodium || item.contains_caffeine) && (
              <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl border border-amber-200/50 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center shadow-sm">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                    Important Information
                  </span>
                </div>
                
                <div className="space-y-2">
                  {item.spicy_level > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[...Array(3)].map((_, i) => (
                          <span key={i} className={`text-sm ${i < item.spicy_level ? 'text-orange-600' : 'text-gray-300'}`}>
                            🌶️
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-amber-700">Spicy Level {item.spicy_level}</span>
                    </div>
                  )}
                  
                  {item.high_sodium && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs">🧂</span>
                      <span className="text-xs text-amber-700">High Sodium Content</span>
                    </div>
                  )}
                  
                  {item.contains_caffeine && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs">☕</span>
                      <span className="text-xs text-amber-700">Contains Caffeine</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Pairing Suggestions */}
            {(item.wine_pairing || item.beer_pairing) && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs font-medium text-gray-700 mb-1">Perfect with:</p>
                <div className="flex flex-wrap gap-2">
                  {item.wine_pairing && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                      🍷 {item.wine_pairing}
                    </span>
                  )}
                  {item.beer_pairing && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                      🍺 {item.beer_pairing}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Sustainability */}
            {(item.carbon_footprint || item.local_ingredients || item.organic_certified) && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-medium text-gray-600">Sustainability:</span>
                {item.carbon_footprint && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    item.carbon_footprint === 'low' ? 'bg-green-100 text-green-700' :
                    item.carbon_footprint === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    🌍 {item.carbon_footprint} carbon
                  </span>
                )}
                {item.local_ingredients && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    📍 Local
                  </span>
                )}
                {item.organic_certified && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    🌿 Organic
                  </span>
                )}
              </div>
            )}
            
            {/* Reward Points */}
            {item.reward_points > 0 && (
              <div className="flex items-center gap-2 text-purple-600 mb-4">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm font-medium">Earn {item.reward_points} points</span>
              </div>
            )}
            
            {/* Customer Rating */}
            {item.customer_rating && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(item.customer_rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {item.customer_rating} ({item.review_count || 0} reviews)
                </span>
              </div>
            )}
            
            {/* Click for More Info */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-center gap-2 text-[#00594f] group-hover:text-[#003d35] transition-colors">
                <span className="text-sm font-medium">Click for detailed information</span>
                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal content would go here - similar to the nutrition modal */}
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{item.name}</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Add more details here */}
              <p className="text-gray-600">Full item details would be displayed here...</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MenuCardPreview;