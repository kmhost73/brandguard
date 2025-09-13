import React from 'react';
import { SparklesIcon } from './icons/Icons';

interface WelcomeGuideProps {
  onStartExample: () => void;
}

const WelcomeGuide: React.FC<WelcomeGuideProps> = ({ onStartExample }) => {
  return (
    <div className="bg-secondary-dark/50 border-2 border-dashed border-primary/20 p-6 rounded-lg text-center mb-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-white">Welcome to the BrandGuard Demo!</h2>
      <p className="mt-2 text-gray-400 max-w-2xl mx-auto">
        Not sure where to start? We've got you covered. Click the button below to load a sample influencer post with a few compliance issues. You can then scan it to see the Greenlight Engine in action.
      </p>
      <div className="mt-6">
        <button
          onClick={onStartExample}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-md shadow-sm hover:bg-primary-dark transition-transform transform hover:scale-105"
        >
          <SparklesIcon />
          Start with an Example
        </button>
      </div>
      <p className="mt-4 text-sm text-gray-500">
        Or, feel free to paste your own content into the appropriate tab below.
      </p>
    </div>
  );
};

export default WelcomeGuide;