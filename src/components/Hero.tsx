import React from 'react';

interface HeroProps {
  navigateToDashboard: () => void;
}

const Hero: React.FC<HeroProps> = ({ navigateToDashboard }) => {
  return (
    <div className="bg-dark relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 leading-tight tracking-tighter">
          <span className="block">Ship Influencer Content.</span>
          <span className="block">With Confidence.</span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-gray-400">
          BrandGuard is the automated pre-publication review platform that catches compliance and brand safety issues before they go live.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={navigateToDashboard}
            className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-secondary transition-transform transform hover:scale-105 shadow-lg shadow-primary/30"
          >
            Explore the Dashboard
            <svg className="ml-2 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <p className="mt-8 text-sm text-gray-500 tracking-wide">
          Trusted by forward-thinking marketing teams.
        </p>
      </div>
    </div>
  );
};

export default Hero;