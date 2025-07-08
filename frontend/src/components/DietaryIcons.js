import React from 'react';

const dietaryIcons = {
  glutenFree: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,2C17.5,2 22,6.5 22,12C22,17.5 17.5,22 12,22C6.5,22 2,17.5 2,12C2,6.5 6.5,2 12,2M12,4C7.58,4 4,7.58 4,12C4,16.42 7.58,20 12,20C16.42,20 20,16.42 20,12C20,7.58 16.42,4 12,4M11.5,6L12.5,9L9.5,11L11.5,14L10.5,17L9.5,13L6.5,12L9.5,10L11.5,6M15.5,9L14.5,11L16.5,12L14.5,13L13.5,15L12.5,13L14.5,11L15.5,9Z"/>
    </svg>
  ),
  dairyFree: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,2C17.5,2 22,6.5 22,12C22,17.5 17.5,22 12,22C6.5,22 2,17.5 2,12C2,6.5 6.5,2 12,2M12,4C7.58,4 4,7.58 4,12C4,16.42 7.58,20 12,20C16.42,20 20,16.42 20,12C20,7.58 16.42,4 12,4M19.03,7.39L17.88,8.54C19.19,10.06 20,12 20,14C20,15.5 19.5,17 18.5,18L19.89,19.39L21.03,18.25C22.21,16.81 23,14.85 23,12.74C23,10.75 22.22,8.87 21.03,7.39M12,7C12,7 11,7 10,7.18C8.21,7.45 7,8.65 7,10.5C7,13.06 8.7,15.26 11,17.77V7M13,9.18V17.76C15.3,15.26 17,13.06 17,10.5C17,8.91 16,7.82 14.5,7.38L13,9.18Z"/>
    </svg>
  ),
  nutFree: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,2C17.5,2 22,6.5 22,12C22,17.5 17.5,22 12,22C6.5,22 2,17.5 2,12C2,6.5 6.5,2 12,2M12,4C7.58,4 4,7.58 4,12C4,16.42 7.58,20 12,20C16.42,20 20,16.42 20,12C20,7.58 16.42,4 12,4M16.5,8.5C16.5,7.67 15.83,7 15,7C14.17,7 13.5,7.67 13.5,8.5C13.5,8.71 13.56,8.91 13.65,9.08C13.43,9.35 13.21,9.64 13.04,9.96C12.73,9.64 12.37,9.39 11.97,9.23C11.93,8.82 11.6,8.5 11.2,8.5C10.76,8.5 10.4,8.86 10.4,9.3C10.4,9.74 10.76,10.1 11.2,10.1C11.26,10.1 11.32,10.09 11.38,10.08C11.74,10.25 12.05,10.54 12.26,10.9C12.07,11.5 11.97,12.13 11.97,12.78C11.97,14.88 13.64,16.59 15.71,16.65L16,17H8V15H10V12H8V10H10V7H8V5H10L12,7L14,5H16V7H16.09C16.56,7.27 16.91,7.71 17.08,8.23C16.82,8.39 16.5,8.5 16.5,8.5Z"/>
    </svg>
  ),
  vegetarian: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"/>
    </svg>
  ),
  vegan: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M1.5,21L12,2.5L22.5,21H1.5M12,6L3.43,19H8.5V17C8.5,15.62 9.62,14.5 11,14.5H13C14.38,14.5 15.5,15.62 15.5,17V19H20.57L12,6M13,16H11C10.72,16 10.5,16.22 10.5,16.5V19H13.5V16.5C13.5,16.22 13.28,16 13,16Z"/>
    </svg>
  ),
  halal: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.2,7.9C19.2,8.4 19.1,8.9 18.9,9.3L17.9,13.5L16.2,12.7C16.2,11.5 15.2,10.5 14,10.5C12.8,10.5 11.8,11.5 11.8,12.7L10.1,13.5L9.1,9.3C8.9,8.9 8.8,8.4 8.8,7.9C8.8,5.2 11,3 13.7,3H14C16.8,3 19,5.2 19,7.9M7.2,9.5L8.4,14.5L12,12.7C12,12.3 12.3,12 12.7,12H15.3C15.7,12 16,12.3 16,12.7L19.6,14.5L20.8,9.5C21,8.9 21.2,8.3 21.2,7.7C21.2,4 18.1,1 14.5,1H13.5C9.9,1 6.8,4 6.8,7.7C6.8,8.3 7,8.9 7.2,9.5M12,20C12,20 8,20 8,16C8,13 10,11.2 10,11.2L12,10.2V20M14,10.2L16,11.2C16,11.2 18,13 18,16C18,20 14,20 14,20V10.2Z"/>
    </svg>
  ),
  highSodium: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7,2V13H10V22L17,10H13L17,2M7,4H11L8,10H11V17L13,13H9V4H7Z"/>
    </svg>
  ),
  containsCaffeine: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2,21V19H20V21H2M20,8V5H18V8H20M20,3A2,2 0 0,1 22,5V8A2,2 0 0,1 20,10H18V13A4,4 0 0,1 14,17H8A4,4 0 0,1 4,13V3H20M16,5H6V13A2,2 0 0,0 8,15H14A2,2 0 0,0 16,13V5Z"/>
    </svg>
  )
};

const DietaryIcons = ({ type, size = 'w-5 h-5', className = '' }) => {
  const icon = dietaryIcons[type];
  if (!icon) return null;

  return React.cloneElement(icon, { 
    className: `${size} ${className}` 
  });
};

export const getDietaryIcon = (type) => {
  return dietaryIcons[type] || null;
};

export const dietaryInfo = {
  glutenFree: { label: 'Gluten Free', labelAr: 'خالي من الجلوتين', color: 'emerald' },
  dairyFree: { label: 'Dairy Free', labelAr: 'خالي من الألبان', color: 'sky' },
  nutFree: { label: 'Nut Free', labelAr: 'خالي من المكسرات', color: 'purple' },
  vegetarian: { label: 'Vegetarian', labelAr: 'نباتي', color: 'green' },
  vegan: { label: 'Vegan', labelAr: 'نباتي صرف', color: 'lime' },
  halal: { label: 'Halal', labelAr: 'حلال', color: 'emerald' },
  highSodium: { label: 'High Sodium', labelAr: 'صوديوم عالي', color: 'orange' },
  containsCaffeine: { label: 'Contains Caffeine', labelAr: 'يحتوي على كافيين', color: 'amber' }
};

export default DietaryIcons;