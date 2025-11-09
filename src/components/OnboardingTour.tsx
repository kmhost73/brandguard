import React, { useState } from 'react';

interface OnboardingTourProps {
  onComplete: () => void;
}

const tourSteps = [
  {
    title: 'Welcome to BrandGuard!',
    content: "Let's take a quick tour to see how you can get your first Greenlight in seconds.",
    target: null, 
  },
  {
    title: '1. Enter Your Content',
    content: 'Paste your social media caption or any text content you want to analyze right here.',
    target: 'textarea', 
  },
  {
    title: '2. Scan for Compliance',
    content: 'Click here to run the analysis. The Greenlight Engine will check it against standard rules and your custom settings.',
    target: '.scan-button',
  },
  {
    title: '3. View Your History',
    content: 'All your past scans are stored here in the Greenlight Log, organized by campaign.',
    target: '.greenlight-log', 
  },
  {
    title: 'Ready to Go!',
    content: "That's it! You're ready to start accelerating your workflow. Let's get your first Greenlight.",
    target: null,
  },
];

const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < tourSteps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };
  
  const currentStep = tourSteps[step];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] animate-fade-in">
      <div className="bg-secondary-dark p-8 rounded-lg shadow-2xl border border-gray-700 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-white">{currentStep.title}</h2>
        <p className="text-gray-400 mt-4">{currentStep.content}</p>
        <div className="mt-8 flex justify-center gap-4">
          {step < tourSteps.length - 1 && (
            <button
              onClick={handleSkip}
              className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-500 transition-colors"
            >
              Skip Tour
            </button>
          )}
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition-colors"
          >
            {step === tourSteps.length - 1 ? "Let's Go!" : 'Next'}
          </button>
        </div>
        <div className="flex justify-center mt-6 gap-2">
            {tourSteps.map((_, index) => (
                <div key={index} className={`w-2 h-2 rounded-full ${step === index ? 'bg-primary' : 'bg-gray-600'}`}></div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;