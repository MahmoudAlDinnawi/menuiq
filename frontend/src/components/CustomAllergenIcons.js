import React, { useState, useEffect } from 'react';
import api from '../services/api';

const CustomAllergenIcons = ({ allergens, size = 'w-6 h-6', showLabels = false, language = 'en' }) => {
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
        const icon = allergenIcons[allergen];
        
        if (!icon) {
          // Fallback if icon not found
          return showLabels ? (
            <span key={allergen} className="text-xs text-gray-500">
              {allergen}
            </span>
          ) : null;
        }

        const iconUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${icon.icon_url}`;
        
        return showLabels ? (
          <div key={allergen} className="flex items-center gap-1">
            <img 
              src={iconUrl}
              alt={getDisplayName(icon)}
              className={`${size} object-contain`}
              title={getDisplayName(icon)}
            />
            <span className="text-xs text-gray-700">
              {getDisplayName(icon)}
            </span>
          </div>
        ) : (
          <img 
            key={allergen}
            src={iconUrl}
            alt={getDisplayName(icon)}
            className={`${size} object-contain`}
            title={getDisplayName(icon)}
          />
        );
      })}
    </div>
  );
};

export default CustomAllergenIcons;