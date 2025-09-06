import React from 'react';
import { SparklesIcon } from './icons/Icons';

interface WelcomeGuideProps {
  onStartExample: () => void;
}

const WelcomeGuide: React.FC<WelcomeGuideProps> = ({ onStartExample }) => {
  return (
    <div className="bg-teal-50 border-2 border-dashed border-teal-200 p-6 rounded-lg text-center mb-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-dark">Welcome to the Clarity AI Demo!</h2>
      <p className="mt-2 text-slate max-w-2xl mx-auto">
        Not sure where to start? We've got you covered. Click the button below to load a sample influencer post with a few compliance issues. You can then scan it to see the AI analysis in action.
      </p>
      <div className="mt-6">
        <button
          onClick={onStartExample}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent text-white font-semibold rounded-md shadow-sm hover:bg-accent-dark transition-transform transform hover:scale-105"
        >
          <SparklesIcon />
          Start with an Example
        </button>
      </div>
      <p className="mt-4 text-sm text-slate-light">
        Or, feel free to paste your own content into the appropriate tab below.
      </p>
    </div>
  );
};

export default WelcomeGuide;