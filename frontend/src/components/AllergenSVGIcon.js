import React from 'react';

// Import all allergen SVGs
import milkIcon from '../assets/allergy_icons/milk.svg';
import eggIcon from '../assets/allergy_icons/egg.svg';
import fishIcon from '../assets/allergy_icons/fish.svg';
import glutenIcon from '../assets/allergy_icons/gulten.svg';
import shellfishIcon from '../assets/allergy_icons/Shellfish.svg';
import soyIcon from '../assets/allergy_icons/soy.svg';
import sesameIcon from '../assets/allergy_icons/sesame.svg';
import saltIcon from '../assets/allergy_icons/salt.svg';
import mustardIcon from '../assets/allergy_icons/mustard.svg';
import nutsIcon from '../assets/allergy_icons/nuts.svg';

const AllergenSVGIcon = ({ iconPath, size = 'w-8 h-8', primaryColor = '#00594f', className = '' }) => {
  // Extract filename from path
  const filename = iconPath.split('/').pop()?.toLowerCase() || '';
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('AllergenSVGIcon - iconPath:', iconPath, 'filename:', filename);
  }
  
  // Map filenames to imported icons
  const iconMap = {
    'milk.svg': milkIcon,
    'egg.svg': eggIcon,
    'fish.svg': fishIcon,
    'gulten.svg': glutenIcon,
    'gluten.svg': glutenIcon,
    'shellfish.svg': shellfishIcon,
    'soy.svg': soyIcon,
    'sesame.svg': sesameIcon,
    'salt.svg': saltIcon,
    'mustard.svg': mustardIcon,
    'nuts.svg': nutsIcon,
  };

  // Also check direct path mapping
  const pathMap = {
    '/src/assets/allergy_icons/milk.svg': milkIcon,
    '/src/assets/allergy_icons/egg.svg': eggIcon,
    '/src/assets/allergy_icons/fish.svg': fishIcon,
    '/src/assets/allergy_icons/gulten.svg': glutenIcon,
    '/src/assets/allergy_icons/Shellfish.svg': shellfishIcon,
    '/src/assets/allergy_icons/shellfish.svg': shellfishIcon,
    '/src/assets/allergy_icons/soy.svg': soyIcon,
    '/src/assets/allergy_icons/sesame.svg': sesameIcon,
    '/src/assets/allergy_icons/salt.svg': saltIcon,
    '/src/assets/allergy_icons/mustard.svg': mustardIcon,
    '/src/assets/allergy_icons/nuts.svg': nutsIcon,
    // Additional path formats that might be returned by API
    'src/assets/allergy_icons/milk.svg': milkIcon,
    'src/assets/allergy_icons/egg.svg': eggIcon,
    'src/assets/allergy_icons/fish.svg': fishIcon,
    'src/assets/allergy_icons/gulten.svg': glutenIcon,
    'src/assets/allergy_icons/Shellfish.svg': shellfishIcon,
    'src/assets/allergy_icons/shellfish.svg': shellfishIcon,
    'src/assets/allergy_icons/soy.svg': soyIcon,
    'src/assets/allergy_icons/sesame.svg': sesameIcon,
    'src/assets/allergy_icons/salt.svg': saltIcon,
    'src/assets/allergy_icons/mustard.svg': mustardIcon,
    'src/assets/allergy_icons/nuts.svg': nutsIcon,
  };

  // Check all possible path formats
  const iconSrc = iconMap[filename] || pathMap[iconPath] || pathMap[iconPath.replace(/^\//, '')];

  if (!iconSrc) {
    return <span className={`${size} flex items-center justify-center text-2xl`}>⚠️</span>;
  }

  return (
    <div 
      className={`${size} ${className} flex items-center justify-center`}
      style={{
        maskImage: `url(${iconSrc})`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskImage: `url(${iconSrc})`,
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        backgroundColor: primaryColor
      }}
    />
  );
};

export default AllergenSVGIcon;