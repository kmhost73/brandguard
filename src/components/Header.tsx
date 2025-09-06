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
            className="flex-shrink-0 flex items-center gap-3 cursor-pointer"
            onClick={() => navigateTo('landing')}
          >
             <svg className="h-8 w-8 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
             </svg>
            <span className={`text-2xl font-bold ${isLanding ? 'text-white' : 'text-slate-dark'}`}>Clarity</span>
          </div>
          <nav className="hidden md:flex md:space-x-8">
            <button 
              onClick={() => navigateTo('landing')}
              className={`font-medium transition-colors ${isLanding ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-accent-dark'}`}
            >
              Home
            </button>
            <button 
              onClick={() => navigateTo('dashboard')}
              className={`font-medium transition-colors ${isLanding ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-accent-dark'}`}
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