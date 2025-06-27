import React from 'react';

const CategoryFilter = ({ categories, activeCategory, onCategoryChange, language = 'en' }) => {
  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-100">
      <div className="container mx-auto px-3 md:px-4 py-3 md:py-5">
        <div className="flex md:justify-center items-center gap-2 md:gap-4 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => onCategoryChange('all')}
            className={`relative px-6 md:px-8 py-2 md:py-3 rounded-full font-medium transition-all duration-500 group whitespace-nowrap ${
              activeCategory === 'all'
                ? 'text-white shadow-lg md:shadow-2xl transform scale-105'
                : 'text-gray-700 hover:text-primary'
            }`}
          >
            {/* Background gradient for active state */}
            {activeCategory === 'all' && (
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-dark to-primary rounded-full animate-pulse"></div>
            )}
            
            {/* Gold accent on hover */}
            <div className={`absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/20 to-gold/0 rounded-full transition-opacity duration-500 ${
              activeCategory === 'all' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}></div>
            
            {/* Border */}
            <div className={`absolute inset-0 rounded-full border-2 transition-all duration-500 ${
              activeCategory === 'all' ? 'border-gold/30' : 'border-primary/30 group-hover:border-primary'
            }`}></div>
            
            <span className="relative z-10 text-xs md:text-sm tracking-wider md:tracking-widest uppercase font-medium md:font-light">
              {language === 'ar' ? 'الكل' : 'All'}
            </span>
          </button>
          
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => onCategoryChange(category.value)}
              className={`relative px-6 md:px-8 py-2 md:py-3 rounded-full font-medium transition-all duration-500 group whitespace-nowrap ${
                activeCategory === category.value
                  ? 'text-white shadow-lg md:shadow-2xl transform scale-105'
                  : 'text-gray-700 hover:text-primary'
              }`}
            >
              {/* Background gradient for active state */}
              {activeCategory === category.value && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-dark to-primary rounded-full animate-pulse"></div>
              )}
              
              {/* Gold accent on hover */}
              <div className={`absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/20 to-gold/0 rounded-full transition-opacity duration-500 ${
                activeCategory === category.value ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}></div>
              
              {/* Border */}
              <div className={`absolute inset-0 rounded-full border-2 transition-all duration-500 ${
                activeCategory === category.value ? 'border-gold/30' : 'border-primary/30 group-hover:border-primary'
              }`}></div>
              
              <span className="relative z-10 text-xs md:text-sm tracking-wider md:tracking-widest uppercase font-medium md:font-light">
                {language === 'ar' && category.labelAr ? category.labelAr : category.label}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Luxury accent lines */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/50 to-transparent"></div>
      <div className="absolute bottom-[-1px] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
    </nav>
  );
};

export default CategoryFilter;