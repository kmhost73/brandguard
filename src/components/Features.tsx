
import React from 'react';
import { CheckIcon, SparklesIcon, ShieldCheckIcon, XIcon } from './icons/Icons';

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
      title: 'Instant Greenlight Analysis',
      description: 'Stop waiting on legal. Our AI scans content for FTC disclosures, brand safety, and custom rules, giving you a definitive GO/STOP answer in seconds. Kill the delays.',
      visual: (
        <div className="w-full p-4 font-mono text-sm text-left bg-dark rounded-md">
          <p className="text-gray-400">&gt; Requesting Greenlight...</p>
          <div className="flex items-center gap-2 mt-2">
            <CheckIcon className="w-5 h-5 text-success" />
            <span className="text-gray-300">Result: GO</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <XIcon className="w-5 h-5 text-danger" />
            <span className="text-gray-300">Result: STOP</span>
          </div>
           <p className="text-success ml-7 text-xs">Reason: All clear. Ship it.</p>
        </div>
      )
    },
    {
      icon: <SparklesIcon/>,
      title: 'One-Click "Magic Fix"',
      description: 'Don\'t just find problems—solve them. Instantly generate compliant revisions of problematic captions and eliminate the soul-crushing back-and-forth that kills creativity and momentum.',
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
    },
    {
      icon: <ShieldCheckIcon />,
      title: 'Issue Certificates of Confidence',
      description: 'Replace ambiguous email chains and verbal approvals. Generate and share authoritative, professional certificates of compliance to provide undeniable proof that due diligence is complete.',
      visual: (
        <div className="w-full p-4 flex flex-col items-center justify-center text-center bg-dark rounded-lg border border-primary/50">
            <ShieldCheckIcon />
            <p className="text-lg font-semibold text-white mt-2">Certificate of Compliance</p>
            <p className="text-sm text-gray-400">Status: <span className="text-success font-bold">GREENLIT</span></p>
            <p className="text-xs text-gray-500 mt-2">Certified by BrandGuard AI</p>
        </div>
      )
    }
  ];

  return (
    <div className="py-24 bg-dark">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-white">Your Velocity is Your Weapon.</h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-400">
            BrandGuard is the safety net that lets you move at the speed of the market.
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
