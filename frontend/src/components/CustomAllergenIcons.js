import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AllergenSVGIcon from './AllergenSVGIcon';

const CustomAllergenIcons = ({ allergens, size = 'w-6 h-6', showLabels = false, language = 'en', primaryColor = '#00594f' }) => {
  const [allergenIcons, setAllergenIcons] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllergenIcons();
  }, []);

  const fetchAllergenIcons = async () => {
    try {
      const response = await api.get('/api/allergen-icons');
      // Convert array to object for easy lookup
      const iconMap = {};
      response.data.allergens.forEach(icon => {
        iconMap[icon.name] = icon;
      });
      setAllergenIcons(iconMap);
    } catch (error) {
      console.error('Error fetching allergen icons:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !allergens || allergens.length === 0) {
    return null;
  }

  const getDisplayName = (icon) => {
    if (!icon) return '';
    return language === 'ar' && icon.display_name_ar ? icon.display_name_ar : icon.display_name;
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {allergens.map((allergen) => {
        // Handle both string allergen names and allergen objects
        const allergenName = typeof allergen === 'string' ? allergen : allergen.name;
        const allergenObj = typeof allergen === 'object' ? allergen : allergenIcons[allergenName];
        
        if (!allergenObj && typeof allergen === 'string') {
          // Fallback if icon not found
          return showLabels ? (
            <span key={allergenName} className="text-xs text-gray-500">
              {allergenName}
            </span>
          ) : null;
        }
        
        // Use allergen object directly if passed, otherwise use from fetched icons
        const icon = typeof allergen === 'object' ? allergen : allergenObj;

        const isEmoji = icon.icon_url && icon.icon_url.length <= 4 && !icon.icon_url.startsWith('/');
        const isSVG = icon.icon_url && icon.icon_url.endsWith('.svg');
        
        const key = icon.id || icon.name || allergenName;
        
        return showLabels ? (
          <div key={key} className="flex flex-col items-center gap-0.5 sm:gap-1 p-1.5 sm:p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all">
            <div className="p-1 sm:p-2 rounded-full">
              {isSVG ? (
                <AllergenSVGIcon 
                  iconPath={icon.icon_url}
                  size={size}
                  primaryColor={primaryColor}
                />
              ) : isEmoji ? (
                <span className={`${size === 'w-6 h-6 sm:w-8 sm:h-8' ? 'text-xl sm:text-3xl' : size === 'w-8 h-8' ? 'text-3xl' : 'text-2xl'} block filter drop-shadow-sm`}>{icon.icon_url}</span>
              ) : (
                <img 
                  src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${icon.icon_url}`}
                  alt={getDisplayName(icon)}
                  className={`${size} object-contain filter drop-shadow-sm`}
                  title={getDisplayName(icon)}
                />
              )}
            </div>
            <span className="text-[10px] sm:text-xs font-medium text-gray-700">
              {getDisplayName(icon)}
            </span>
          </div>
        ) : (
          isSVG ? (
            <AllergenSVGIcon 
              key={key}
              iconPath={icon.icon_url}
              size={size}
              primaryColor={primaryColor}
            />
          ) : isEmoji ? (
            <span key={key} className={`${size === 'w-8 h-8' ? 'text-3xl' : 'text-2xl'} block`} title={getDisplayName(icon)}>
              {icon.icon_url}
            </span>
          ) : (
            <img 
              key={key}
              src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${icon.icon_url}`}
              alt={getDisplayName(icon)}
              className={`${size} object-contain`}
              title={getDisplayName(icon)}
            />
          )
        );
      })}
    </div>
  );
};

export default CustomAllergenIcons;