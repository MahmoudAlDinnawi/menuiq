import React from 'react';

const LuxuryCategoryFilter = ({ categories, activeCategory, onCategoryChange, language = 'en' }) => {
  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="py-3 sm:py-4">
          {/* Desktop Layout */}
          <div className="hidden md:flex justify-center items-center gap-6">
            <button
              onClick={() => onCategoryChange('all')}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                activeCategory === 'all'
                  ? 'bg-[#00594f] text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-sm">
                {language === 'ar' ? 'الكل' : 'All'}
              </span>
            </button>
            
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => onCategoryChange(category.value)}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                  activeCategory === category.value
                    ? 'bg-[#00594f] text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-sm">
                  {language === 'ar' && category.labelAr ? category.labelAr : category.label}
                </span>
              </button>
            ))}
          </div>
          
          {/* Mobile Layout */}
          <div className="md:hidden">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => onCategoryChange('all')}
                className={`px-3 py-1.5 rounded-full font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                  activeCategory === 'all'
                    ? 'bg-[#00594f] text-white'
                    : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                }`}
              >
                <span className="text-xs">
                  {language === 'ar' ? 'الكل' : 'All'}
                </span>
              </button>
              
              {categories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => onCategoryChange(category.value)}
                  className={`px-3 py-1.5 rounded-full font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                    activeCategory === category.value
                      ? 'bg-[#00594f] text-white'
                      : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                  }`}
                >
                  <span className="text-xs">
                    {language === 'ar' && category.labelAr ? category.labelAr : category.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default LuxuryCategoryFilter;