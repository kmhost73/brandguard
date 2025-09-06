import React from 'react';
import { BrandGuardLogoIcon } from './icons/Icons';

interface HeaderProps {
  navigateTo: (view: 'landing' | 'dashboard') => void;
}

const Header: React.FC<HeaderProps> = ({ navigateTo }) => {
  return (
    <header className="sticky top-0 z-50 bg-dark/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div 
            className="flex-shrink-0 flex items-center gap-3 cursor-pointer"
            onClick={() => navigateTo('landing')}
          >
            <BrandGuardLogoIcon />
            <span className="text-2xl font-bold text-white">BrandGuard</span>
          </div>
          <nav className="hidden md:flex md:space-x-8">
            <button 
              onClick={() => navigateTo('landing')}
              className="font-medium transition-colors text-gray-300 hover:text-white"
            >
              Home
            </button>
            <button 
              onClick={() => navigateTo('dashboard')}
              className="font-medium transition-colors text-gray-300 hover:text-white"
            >
              Dashboard
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;