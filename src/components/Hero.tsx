import React from 'react';

interface HeroProps {
  navigateToDashboard: () => void;
}

const Hero: React.FC<HeroProps> = ({ navigateToDashboard }) => {
  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
          <span className="block">Automate Influencer Compliance.</span>
          <span className="block text-primary">Protect Your Brand.</span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-gray-500">
          BrandGuard AI uses advanced AI to continuously monitor sponsored content, ensuring FTC compliance and brand safety, so you can focus on growth.
        </p>
        <div className="mt-8 flex justify-center">
          <button
            onClick={navigateToDashboard}
            className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-secondary transition-transform transform hover:scale-105 shadow-lg"
          >
            Try the Live Demo
            <svg className="ml-2 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;
