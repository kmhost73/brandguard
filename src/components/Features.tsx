import React from 'react';
import { CheckIcon, SparklesIcon, WarningIcon, XIcon } from './icons/Icons';

const FeatureDetail: React.FC<{ icon: React.ReactNode; title: string; description: string; visual: React.ReactNode; reverse?: boolean }> = ({ icon, title, description, visual, reverse = false }) => (
  <div className={`flex flex-col md:flex-row items-center gap-12 ${reverse ? 'md:flex-row-reverse' : ''}`}>
    <div className="md:w-1/2 text-center md:text-left">
      <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-primary/20 text-primary-light mb-4">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-white">{title}</h3>
      <p className="mt-4 text-lg text-gray-400">{description}</p>
    </div>
    <div className="md:w-1/2 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 min-h-[220px] flex items-center justify-center">
       {visual}
    </div>
  </div>
);

const Features: React.FC = () => {
  const features = [
    {
      icon: <CheckIcon className="w-7 h-7"/>,
      title: 'Catch Compliance Errors Instantly',
      description: 'Automatically scan for FTC disclosures like #ad or #sponsored, mandatory product claims, and custom campaign rules to mitigate legal risks before publication.',
      visual: (
        <div className="w-full p-4 font-mono text-sm text-left bg-dark rounded-md">
          <p className="text-gray-400">&gt; Analyzing post...</p>
          <div className="flex items-center gap-2 mt-2">
            <CheckIcon className="w-5 h-5 text-success" />
            <span className="text-gray-300">Brand Safety: Pass</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <XIcon className="w-5 h-5 text-danger" />
            <span className="text-gray-300">FTC Disclosure: Fail</span>
          </div>
           <p className="text-danger ml-7 text-xs">Missing required disclosure #ad</p>
        </div>
      )
    },
    {
      icon: <WarningIcon/>,
      title: 'Protect Your Brand\'s Reputation',
      description: 'Our AI analyzes content for profanity, sensitive topics, and competitor mentions, ensuring every collaboration aligns perfectly with your brand values.',
      visual: (
        <div className="w-full p-4 flex flex-col items-center justify-center text-center">
            <p className="text-lg font-semibold text-gray-300">Brand Safety Scan</p>
            <div className="flex flex-wrap gap-2 justify-center mt-3">
                <span className="px-2 py-1 text-sm bg-green-500/20 text-green-300 rounded">Positive</span>
                <span className="px-2 py-1 text-sm bg-green-500/20 text-green-300 rounded">On-Brand</span>
                <span className="px-2 py-1 text-sm bg-red-500/20 text-red-400 rounded line-through">Profanity</span>
                <span className="px-2 py-1 text-sm bg-green-500/20 text-green-300 rounded">Safe</span>
                <span className="px-2 py-1 text-sm bg-red-500/20 text-red-400 rounded line-through">Controversial</span>
            </div>
        </div>
      )
    },
    {
      icon: <SparklesIcon/>,
      title: 'Fix Issues in One Click',
      description: 'Don\'t just find problems—solve them. Instantly generate compliant revisions of problematic captions with "Magic Fix" and eliminate hours of back-and-forth.',
       visual: (
        <div className="w-full p-2 font-mono text-xs text-left">
          <div className="p-2 bg-red-900/40 rounded border border-danger/50">
            <p className="text-red-300 font-bold">Before:</p>
            <p className="text-gray-400">My new shoes are made with 100% organic materials!</p>
          </div>
          <div className="p-2 bg-green-900/40 rounded border border-success/50 mt-2">
            <p className="text-green-300 font-bold">After (Magic Fix):</p>
            <p className="text-gray-300">#ad My new shoes are made with 100% organic materials!</p>
          </div>
        </div>
      )
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