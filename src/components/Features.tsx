
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
      title: '10-Second Greenlight Scans',
      description: 'Stop waiting on manual review. Scan text, images, and video for FTC disclosures and brand safety rules instantly. Get a definitive GO/STOP answer before you blink.',
      visual: (
        <div className="w-full p-4 font-mono text-sm text-left bg-dark rounded-md">
          <p className="text-gray-400">&gt; Scanning post...</p>
          <div className="flex items-center gap-2 mt-2">
            <XIcon className="w-5 h-5 text-danger" />
            <span className="text-gray-300">Status: STOP (Missing Disclosure)</span>
          </div>
           <p className="text-danger ml-7 text-xs">Risk: $51,744 Fine</p>
        </div>
      )
    },
    {
      icon: <SparklesIcon/>,
      title: 'Instant "Magic Fix" Revisions',
      description: 'Finding the problem is only half the battle. BrandGuard instantly generates the compliant version of your caption, ready to copy-paste and send to your influencer.',
       visual: (
        <div className="w-full p-2 font-mono text-xs text-left">
          <div className="p-2 bg-red-900/40 rounded border border-danger/50 opacity-50">
            <p className="text-red-300 font-bold">Original:</p>
            <p className="text-gray-400">Love these new shoes!</p>
          </div>
          <div className="p-2 bg-green-900/40 rounded border border-success/50 mt-2 scale-105 shadow-lg">
            <p className="text-green-300 font-bold">Magic Fix:</p>
            <p className="text-gray-300">#ad Love these new shoes!</p>
          </div>
        </div>
      )
    },
    {
      icon: <ShieldCheckIcon />,
      title: 'Audit Trail Certificates',
      description: 'Protect your agency and your clients. Every scan generates a timestamped Certificate of Compliance, proving you did your due diligence.',
      visual: (
        <div className="w-full p-4 flex flex-col items-center justify-center text-center bg-dark rounded-lg border border-primary/50">
            <ShieldCheckIcon />
            <p className="text-lg font-semibold text-white mt-2">Compliance Certificate</p>
            <p className="text-xs text-gray-500 mt-1">ID: 8X29-A1B2</p>
            <div className="mt-2 px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-bold">VERIFIED</div>
        </div>
      )
    }
  ];

  return (
    <div className="py-24 bg-dark">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-white">Speed is Your Competitive Advantage.</h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-400">
            Stop letting compliance bottlenecks kill your campaign momentum.
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
