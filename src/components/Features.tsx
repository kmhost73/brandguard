import React from 'react';
import { CheckIcon, SparklesIcon, WarningIcon } from './icons/Icons';

const FeatureDetail: React.FC<{ icon: React.ReactNode; title: string; description: string; reverse?: boolean }> = ({ icon, title, description, reverse = false }) => (
  <div className={`flex flex-col md:flex-row items-center gap-12 ${reverse ? 'md:flex-row-reverse' : ''}`}>
    <div className="md:w-1/2 text-center md:text-left">
      <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-primary/20 text-primary-light mb-4">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-white">{title}</h3>
      <p className="mt-4 text-lg text-gray-400">{description}</p>
    </div>
    <div className="md:w-1/2 p-8 bg-gray-800/30 rounded-lg border border-gray-700/50">
      {/* Placeholder for a visual element, like a stylized code/report snippet */}
       <div className="w-full h-48 flex items-center justify-center">
        <p className="text-gray-600 italic">Visual representation coming soon</p>
      </div>
    </div>
  </div>
);

const Features: React.FC = () => {
  const features = [
    {
      icon: <CheckIcon className="w-7 h-7"/>,
      title: 'Catch Compliance Errors Instantly',
      description: 'Automatically scan for FTC disclosures like #ad or #sponsored, mandatory product claims, and custom campaign rules to mitigate legal risks before publication.'
    },
    {
      icon: <WarningIcon/>,
      title: 'Protect Your Brand\'s Reputation',
      description: 'Our AI analyzes content for profanity, sensitive topics, and competitor mentions, ensuring every collaboration aligns perfectly with your brand values.'
    },
    {
      icon: <SparklesIcon/>,
      title: 'Fix Issues in One Click',
      description: 'Don\'t just find problems—solve them. Instantly generate compliant revisions of problematic captions with "Magic Fix" and eliminate hours of back-and-forth.'
    }
  ];

  return (
    <div className="py-24 bg-dark">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-white">Never Approve a Bad Post Again.</h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-400">
            BrandGuard provides the safety net you need to move fast and stay compliant.
          </p>
        </div>
        <div className="space-y-20">
          {features.map((feature, index) => (
            <FeatureDetail key={index} {...feature} reverse={index % 2 !== 0} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;