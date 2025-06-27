import React from 'react';

const MenuItem = ({ item }) => {
  const formatCategory = (category) => {
    const categoryNames = {
      'appetizers': 'Appetizer',
      'mains': 'Main Course',
      'steaks': 'Signature Steak',
      'desserts': 'Dessert',
      'beverages': 'Beverage'
    };
    return categoryNames[category] || category;
  };

  return (
    <div className="group bg-white rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border border-transparent hover:border-primary/20 relative overflow-hidden">
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-gold to-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
      
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-playfair font-bold text-primary flex-1 mr-4">{item.name}</h3>
        <span className="text-xl font-semibold text-gold whitespace-nowrap animate-shimmer bg-gradient-to-r from-gold via-primary to-gold bg-[length:200%_auto] bg-clip-text text-transparent">
          {item.price}
        </span>
      </div>
      
      {/* Description */}
      <p className="text-primary-dark/80 text-sm leading-relaxed mb-4">{item.description}</p>
      
      {/* Footer */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <span className="inline-block bg-gradient-to-r from-primary to-primary-light text-white px-4 py-1 rounded-full text-xs font-medium uppercase tracking-wider shadow-md">
          {formatCategory(item.category)}
        </span>
        
        {/* Dietary tags */}
        <div className="flex gap-2 flex-wrap">
          {item.glutenFree && <span className="dietary-tag">GF</span>}
          {item.dairyFree && <span className="dietary-tag">DF</span>}
          {item.nutFree && <span className="dietary-tag">NF</span>}
          {item.vegetarian && <span className="dietary-tag">V</span>}
          {item.vegan && <span className="dietary-tag">VG</span>}
        </div>
      </div>
      
      {/* Info badges */}
      {(item.calories || item.highSodium || item.walkMinutes || item.runMinutes || (item.allergens && item.allergens.length > 0)) && (
        <div className="mt-4 pt-4 border-t border-primary/10 flex flex-wrap gap-3 text-xs">
          {item.calories && (
            <div className="flex items-center gap-1 text-secondary">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16Z"/>
              </svg>
              <span>{item.calories} cal</span>
            </div>
          )}
          
          {item.highSodium && (
            <div className="flex items-center gap-1 text-orange-500" title="High Sodium">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2,12H4V14H2V12M20,6H22V8H20V6M20,12H22V14H20V12M20,18H22V20H20V18M6,4V6H8V4H6M6,20V22H8V20H6M12,2V4H14V2H12M12,20V22H14V20H12M18,4V6H20V4H18M2,6H4V8H2V6M2,18H4V20H2V18M8,14A2,2 0 0,1 6,12A2,2 0 0,1 8,10H11V8A2,2 0 0,1 13,6A2,2 0 0,1 15,8V10H18A2,2 0 0,1 20,12A2,2 0 0,1 18,14H15V16A2,2 0 0,1 13,18A2,2 0 0,1 11,16V14H8Z"/>
              </svg>
              <span>High Sodium</span>
            </div>
          )}
          
          {(item.walkMinutes || item.runMinutes) && (
            <div className="flex items-center gap-3 text-primary">
              {item.walkMinutes && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14.12,10H19V8.2H15.38L13.38,4.87C13.08,4.37 12.54,4.03 11.92,4.03C11.74,4.03 11.58,4.06 11.42,4.11L6,5.8V11H7.8V7.33L9.91,6.67L6,22H7.8L10.67,13.89L13,17V22H14.8V15.59L12.31,11.05L13.04,8.18M14,3.8C15,3.8 15.8,3 15.8,2C15.8,1 15,0.2 14,0.2C13,0.2 12.2,1 12.2,2C12.2,3 13,3.8 14,3.8Z"/>
                  </svg>
                  <span>{item.walkMinutes}min</span>
                </div>
              )}
              {item.runMinutes && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.5,5.5C14.59,5.5 15.5,4.58 15.5,3.5C15.5,2.38 14.59,1.5 13.5,1.5C12.39,1.5 11.5,2.38 11.5,3.5C11.5,4.58 12.39,5.5 13.5,5.5M9.89,19.38L10.89,15L13,17V23H15V15.5L12.89,13.5L13.5,10.5C14.79,12 16.79,13 19,13V11C17.09,11 15.5,10 14.69,8.58L13.69,7C13.29,6.38 12.69,6 12,6C11.69,6 11.5,6.08 11.19,6.08L6,8.28V13H8V9.58L9.79,8.88L8.19,17L3.29,16L2.89,18L9.89,19.38Z"/>
                  </svg>
                  <span>{item.runMinutes}min</span>
                </div>
              )}
            </div>
          )}
          
          {item.allergens && item.allergens.length > 0 && (
            <div className="flex items-center gap-1 text-red-500" title={`Contains: ${item.allergens.join(', ')}`}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20Z"/>
              </svg>
              <span>Allergens</span>
            </div>
          )}
        </div>
      )}
      
      {/* Decorative star on hover */}
      <div className="absolute bottom-2 right-2 w-12 h-12 opacity-0 group-hover:opacity-10 transition-opacity duration-300">
        <svg viewBox="0 0 100 100" fill="currentColor" className="text-gold">
          <path d="M50 5 L60 40 L95 40 L70 60 L80 95 L50 70 L20 95 L30 60 L5 40 L40 40 Z"/>
        </svg>
      </div>
    </div>
  );
};

export default MenuItem;