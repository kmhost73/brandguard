import React from 'react';

interface HeaderProps {
  navigateTo: (view: 'landing' | 'dashboard') => void;
  currentView: 'landing' | 'dashboard';
}

const Header: React.FC<HeaderProps> = ({ navigateTo, currentView }) => {
  const isLanding = currentView === 'landing';
  
  return (
    <header className={`sticky top-0 z-50 ${isLanding ? 'bg-dark/80 backdrop-blur-md' : 'bg-white shadow-sm'}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div 
            className="flex-shrink-0 flex items-center gap-2 cursor-pointer"
            onClick={() => navigateTo('landing')}
          >
             <svg className={`h-8 w-8 ${isLanding ? 'text-primary' : 'text-primary'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286Zm0 13.036h.008v.008h-.008v-.008Z" />
            </svg>
            <span className={`text-2xl font-bold ${isLanding ? 'text-white' : 'text-gray-800'}`}>BrandGuard</span>
          </div>
          <nav className="hidden md:flex md:space-x-8">
            <button 
              onClick={() => navigateTo('landing')}
              className={`font-medium transition-colors ${isLanding ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-primary'}`}
            >
              Home
            </button>
            <button 
              onClick={() => navigateTo('dashboard')}
              className={`font-medium transition-colors ${isLanding ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-primary'}`}
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