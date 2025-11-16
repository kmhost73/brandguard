import React, { useState, useLayoutEffect, useEffect } from 'react';

interface OnboardingTourProps {
  onComplete: () => void;
}

interface TooltipPosition {
  top?: number;
  left?: number;
}

interface TourStep {
  title: string;
  content: string;
  selector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    title: 'Welcome to BrandGuard!',
    content: "Let's take a quick tour to see how you can get your first Greenlight in seconds.",
  },
  {
    selector: '[data-tour="content-input"]',
    title: '1. Enter Your Content',
    content: 'Paste your social media caption or any text content you want to analyze right here.',
    position: 'bottom',
  },
  {
    selector: '[data-tour="scan-button"]',
    title: '2. Scan for Compliance',
    content: 'Click here to run the analysis. The Greenlight Engine will check it against standard rules.',
    position: 'bottom',
  },
  {
    selector: '[data-tour="report-card-area"]',
    title: '3. See Your Results',
    content: 'Your detailed compliance report will appear here, complete with a score, summary, and actionable feedback.',
    position: 'right',
  },
  {
    selector: '[data-tour="greenlight-log"]',
    title: '4. View Your History',
    content: 'All your past scans are stored here in the Greenlight Log, organized by campaign.',
    position: 'left',
  },
  {
    title: 'Ready to Go!',
    content: "That's it! You're ready to accelerate your workflow. Let's get your first Greenlight.",
  },
];

const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition>({});
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [highlightedElement, setHighlightedElement] = useState<Element | null>(null);

  const currentStep = tourSteps[stepIndex];
  const isModalStep = !currentStep.selector;

  const updatePosition = () => {
    if (highlightedElement) {
        highlightedElement.classList.remove('tour-highlight');
    }
    
    if (isModalStep || !currentStep.selector) {
      setHighlightedElement(null);
      setTooltipPos({});
      return;
    }

    const element = document.querySelector(currentStep.selector);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

        // Add a delay to allow for scrolling animation to finish
        setTimeout(() => {
            const rect = element.getBoundingClientRect();
            const pos: TooltipPosition = {};
            const style: React.CSSProperties = {};
            const offset = 12;

            switch (currentStep.position) {
                case 'bottom':
                    pos.top = rect.bottom + offset;
                    pos.left = rect.left + rect.width / 2;
                    style.transform = 'translateX(-50%)';
                    break;
                case 'top':
                    pos.top = rect.top - offset;
                    pos.left = rect.left + rect.width / 2;
                    style.transform = 'translate(-50%, -100%)';
                    break;
                case 'left':
                    pos.top = rect.top + rect.height / 2;
                    pos.left = rect.left - offset;
                    style.transform = 'translate(-100%, -50%)';
                    break;
                case 'right':
                    pos.top = rect.top + rect.height / 2;
                    pos.left = rect.right + offset;
                    style.transform = 'translateY(-50%)';
                    break;
                default:
                    break;
            }
            setTooltipPos(pos);
            setTooltipStyle(style);
            setHighlightedElement(element);
        }, 300);
    } else {
        setHighlightedElement(null);
        setTooltipPos({});
    }
  };

  useLayoutEffect(() => {
    updatePosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  useEffect(() => {
    window.addEventListener('resize', updatePosition);
    if (highlightedElement) {
      highlightedElement.classList.add('tour-highlight');
    }
    return () => {
      window.removeEventListener('resize', updatePosition);
      if (highlightedElement) {
        highlightedElement.classList.remove('tour-highlight');
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedElement]);

  const handleNext = () => {
    if (stepIndex < tourSteps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };
  
  const handleSkip = () => {
      onComplete();
  }
  
  const Tooltip = () => (
    <div
        className="tour-tooltip"
        style={{ ...tooltipPos, ...tooltipStyle, ...(isModalStep && { top: '50%', left: '50%', transform: 'translate(-50%, -50%)'}) }}
    >
        {!isModalStep && <div className={`tour-tooltip-arrow ${currentStep.position}`} />}
        <h3 className="text-xl font-bold text-white mb-2">{currentStep.title}</h3>
        <p className="text-gray-300">{currentStep.content}</p>
        <div className="mt-6 flex justify-between items-center">
            <button onClick={handleSkip} className="text-sm text-gray-400 hover:text-white">Skip Tour</button>
            <div className="flex items-center gap-3">
                {stepIndex > 0 && <button onClick={handlePrev} className="px-4 py-2 text-sm bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-500">Prev</button>}
                <button onClick={handleNext} className="px-5 py-2 text-sm bg-primary text-white font-semibold rounded-md hover:bg-primary-dark">
                    {stepIndex === tourSteps.length - 1 ? "Finish" : 'Next'}
                </button>
            </div>
        </div>
        <div className="flex justify-center mt-4 gap-1.5">
            {tourSteps.map((_, index) => (
                <div key={index} className={`w-2 h-2 rounded-full transition-colors ${stepIndex === index ? 'bg-primary' : 'bg-gray-600'}`}></div>
            ))}
        </div>
    </div>
  );

  return (
    <>
      <div className="tour-overlay" onClick={handleSkip} />
      <Tooltip />
    </>
  );
};

export default OnboardingTour;
