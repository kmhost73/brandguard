import React from 'react';
import { CheckIcon, SparklesIcon, WarningIcon } from './icons/Icons';

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    <p className="mt-2 text-base text-gray-500">{description}</p>
  </div>
);

const Features: React.FC = () => {
  const features = [
    {
      icon: <CheckIcon/>,
      title: 'Automated Disclosure Checks',
      description: 'Our AI instantly verifies if influencer posts include required FTC disclosures like #ad or #sponsored, mitigating legal risks.'
    },
    {
      icon: <WarningIcon/>,
      title: 'Brand Safety Monitoring',
      description: 'Scan content for profanity, sensitive topics, and competitor mentions to ensure all collaborations align with your brand values.'
    },
    {
      icon: <SparklesIcon/>,
      title: 'AI-Powered Revisions',
      description: 'Instantly generate compliant revisions of problematic content with our "Magic Fix" feature, saving hours of back-and-forth.'
    }
  ];

  return (
    <div className="py-12 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Why Choose BrandGuard AI?</h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            We provide the tools you need to build trustworthy and effective influencer partnerships at scale.
          </p>
        </div>
        <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
