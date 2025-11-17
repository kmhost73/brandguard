

import React from 'react';
import PublicAuditTool from './PublicAuditTool';

const Hero: React.FC = () => {
  return (
    <div className="bg-dark relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 leading-tight tracking-tighter">
          <span className="block">Every Influencer Post is a</span>
          <span className="block">Potential $53,000 Liability.</span>
        </h1>
        <p className="mt-6 max-w-3xl mx-auto text-lg sm:text-xl text-gray-400">
          Stop guessing. Get an instant, AI-powered compliance audit and ship your campaigns with bulletproof legal protection. Go from risk to revenue in 60 seconds.
        </p>
        <div className="mt-10 max-w-2xl mx-auto">
           <PublicAuditTool 
              ctaButtonText="Audit My Content For Free"
              riskReversal="No credit card required. 3 free scans per session."
           />
        </div>
      </div>
    </div>
  );
};

export default Hero;