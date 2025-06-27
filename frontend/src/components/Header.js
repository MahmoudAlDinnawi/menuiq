import React from 'react';
import logo from '../assets/logo.png';

const Header = () => {
  return (
    <header className="relative bg-gradient-to-br from-primary to-primary-light text-white py-8 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-gold to-transparent animate-pulse"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="flex justify-center items-center min-h-[250px]">
          <div className="relative p-8">
            <img 
              src={logo} 
              alt="Entrecôte Café de Paris" 
              className="w-64 md:w-80 h-auto drop-shadow-2xl hover:scale-105 transition-transform duration-300"
            />
            
            {/* Decorative circles */}
            <div className="absolute -top-5 -left-5 w-24 h-24 border border-gold/30 rounded-full animate-float"></div>
            <div className="absolute -bottom-5 -right-5 w-24 h-24 border border-gold/30 rounded-full animate-float" style={{ animationDelay: '3s' }}></div>
          </div>
        </div>
      </div>
      
      {/* Wave decoration */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1200 100" preserveAspectRatio="none" className="w-full h-16">
          <path d="M0,50 Q300,0 600,50 T1200,50 L1200,100 L0,100 Z" fill="white" opacity="0.1"/>
        </svg>
      </div>
    </header>
  );
};

export default Header;