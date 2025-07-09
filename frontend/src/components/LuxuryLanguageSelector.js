import React, { useState, useEffect } from 'react';
import './LuxuryLanguageSelector.css';

const LuxuryLanguageSelector = ({ settings, onLanguageSelect, isOpen }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 50);
      document.body.style.overflow = 'hidden';
    } else {
      setIsAnimating(false);
      setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isVisible) return null;

  const primaryColor = settings?.primaryColor || '#00594f';
  const logoUrl = settings?.logoUrl || '/default-logo.png';
  const tenantName = settings?.tenantName || 'Restaurant';

  const handleLanguageSelect = (lang) => {
    setIsAnimating(false);
    setTimeout(() => {
      onLanguageSelect(lang);
    }, 300);
  };

  return (
    <div 
      className={`luxury-language-selector ${isAnimating ? 'active' : ''}`}
      style={{ 
        '--primary-color': primaryColor,
        background: `radial-gradient(circle at center, ${primaryColor}15 0%, rgba(0,0,0,0.95) 100%)` 
      }}
    >
      {/* Decorative rotating elements */}
      <div className="decorative-elements">
        <div 
          className="rotating-gradient rotating-gradient-1"
          style={{
            background: `conic-gradient(from 0deg, transparent, ${primaryColor}40, transparent)`
          }}
        />
        <div 
          className="rotating-gradient rotating-gradient-2"
          style={{
            background: `conic-gradient(from 180deg, transparent, ${primaryColor}40, transparent)`
          }}
        />
      </div>

      {/* Main content */}
      <div className={`content-wrapper ${isAnimating ? 'active' : ''}`}>
        {/* Logo and welcome */}
        <div className="logo-section">
          <div className="logo-wrapper">
            <div 
              className="logo-glow"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
            />
            <img
              src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${logoUrl}`}
              alt={tenantName}
              className="logo"
              style={{ filter: 'brightness(0) invert(1)' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/default-logo.png';
              }}
            />
          </div>
          
          <div className="welcome-text">
            <h1 className="welcome-title">Welcome to</h1>
            <h2 className="restaurant-name">{tenantName}</h2>
          </div>
        </div>

        {/* Language selection */}
        <div className="language-section">
          <p className="language-prompt">Please select your preferred language</p>
          
          <div className="language-buttons">
            {/* English button */}
            <button
              onClick={() => handleLanguageSelect('en')}
              className="language-button"
            >
              <div className="button-shine" />
              
              <div className="button-content">
                <div className="flag-emoji">🇬🇧</div>
                <h3 className="language-name">English</h3>
                <p className="language-subtitle">International</p>
              </div>
              
              <div className="button-arrow">
                <svg className="arrow-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Arabic button */}
            <button
              onClick={() => handleLanguageSelect('ar')}
              className="language-button rtl"
              dir="rtl"
            >
              <div className="button-shine rtl" />
              
              <div className="button-content">
                <div className="flag-emoji">🇸🇦</div>
                <h3 className="language-name">العربية</h3>
                <p className="language-subtitle">المحلية</p>
              </div>
              
              <div className="button-arrow">
                <svg className="arrow-icon rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>

          {/* Skip option */}
          <div className="skip-section">
            <button
              onClick={() => handleLanguageSelect(localStorage.getItem('menuLanguage') || 'en')}
              className="skip-button"
            >
              Continue with previous selection
            </button>
          </div>
        </div>
      </div>

      {/* Luxury corner decorations */}
      <div className="corner-decoration top-left" />
      <div className="corner-decoration top-right" />
      <div className="corner-decoration bottom-left" />
      <div className="corner-decoration bottom-right" />
    </div>
  );
};

export default LuxuryLanguageSelector;