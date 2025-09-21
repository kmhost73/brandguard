import React, { useEffect, useMemo } from 'react';
import type { TourStep } from '../types';
import { XIcon, LightbulbIcon } from './icons/Icons';

interface OnboardingTourProps {
  step: TourStep;
  onStepChange: (step: TourStep) => void;
  onScan: () => void;
  onEndTour: () => void;
  targetRefs: {
    scan: React.RefObject<HTMLElement>;
    fix: React.RefObject<HTMLElement>;
    rescan: React.RefObject<HTMLElement>;
  };
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ step, onStepChange, onScan, onEndTour, targetRefs }) => {
  const tourConfig = useMemo(() => ({
    'start': {
      title: 'Welcome to the Greenlight Engine!',
      content: 'This quick tour will show you how to go from review to approval in seconds. We\'ve loaded a sample post with some compliance issues.',
      buttonText: 'Let\'s Go!',
      target: null,
      action: () => onStepChange('scan'),
    },
    'scan': {
      title: 'Step 1: Scan Your Content',
      content: 'Click the "Scan Post" button to send the content to the Greenlight Engine for analysis.',
      buttonText: 'Scan Post',
      target: targetRefs.scan,
      action: onScan,
    },
     'review': {
      title: 'Step 2: Review the Report',
      content: 'The engine found issues and gave the post a low score. The detailed checks show exactly what needs to be fixed.',
      buttonText: 'Next: The Magic Fix',
      target: null, // The report card itself is the focus
      action: () => onStepChange('fix'),
    },
    'fix': {
      title: 'Step 3: Apply the "Magic Fix"',
      content: 'The engine automatically wrote a compliant version of the caption. Click "Accept Revision & Re-Scan" to apply it.',
      buttonText: 'Got it!',
      target: targetRefs.fix,
      action: () => {}, // User must click the actual button
    },
    'rescan': {
        title: 'Step 4: Get Your Greenlight',
        content: 'The revised content is now being re-scanned. This is much faster as the engine already has context.',
        buttonText: 'Final Step...',
        target: targetRefs.rescan,
        action: () => {},
    },
    'complete': {
      title: 'Congratulations!',
      content: 'You just went from a failing post to a 100% compliant Greenlight in seconds. You\'re ready to ship with confidence!',
      buttonText: 'Finish Tour',
      target: null,
      action: onEndTour,
    }
  }), [onStepChange, onScan, onEndTour, targetRefs]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEndTour();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEndTour]);

  if (!step || !tourConfig[step]) return null;

  const currentStep = tourConfig[step];
  const targetElement = currentStep.target?.current;
  const targetRect = targetElement?.getBoundingClientRect();

  const tooltipStyle: React.CSSProperties = targetRect ? {
    position: 'absolute',
    top: targetRect.bottom + 12,
    left: targetRect.left,
    transform: 'translateX(0)',
    maxWidth: '320px',
  } : {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '450px',
  };

  const highlightStyle: React.CSSProperties = targetRect ? {
    position: 'fixed',
    top: `${targetRect.top - 8}px`,
    left: `${targetRect.left - 8}px`,
    width: `${targetRect.width + 16}px`,
    height: `${targetRect.height + 16}px`,
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
    borderRadius: '8px',
    zIndex: 1000,
    pointerEvents: 'none',
    transition: 'all 0.3s ease-in-out',
  } : {};

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      {!targetRect && <div className="fixed inset-0 bg-black/70 animate-fade-in" onClick={onEndTour}></div>}
      
      {/* Highlight Box */}
      {targetRect && <div style={highlightStyle}></div>}

      {/* Tooltip */}
      <div
        style={tooltipStyle}
        className="bg-secondary-dark p-6 rounded-lg shadow-2xl border border-primary/50 z-[1001] animate-fade-in"
      >
        <button onClick={onEndTour} className="absolute top-2 right-2 text-gray-500 hover:text-white">
          <XIcon />
        </button>
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><LightbulbIcon className="text-primary"/> {currentStep.title}</h3>
        <p className="text-gray-300 mb-4">{currentStep.content}</p>
        
        {currentStep.action && (step === 'start' || step === 'scan' || step === 'review' || step === 'complete') && (
            <button
                onClick={currentStep.action}
                className="w-full px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition-colors"
            >
                {currentStep.buttonText}
            </button>
        )}
      </div>
    </div>
  );
};

export default OnboardingTour;