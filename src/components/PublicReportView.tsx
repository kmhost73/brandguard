import React from 'react';
import type { ComplianceReport } from '../types';
import ReportCard from './ReportCard';
// FIX: Replaced non-existent 'XCircleIcon' with the available 'XIcon'.
import { BrandGuardLogoIcon, ShieldCheckIcon, XIcon } from './icons/Icons';

const PublicReportView: React.FC<{ report: ComplianceReport | 'invalid' }> = ({ report }) => {
  if (report === 'invalid') {
    return (
       <div className="min-h-screen bg-dark text-gray-300 flex flex-col items-center justify-center p-4">
        <div className="text-center p-8 bg-secondary-dark border border-danger rounded-lg shadow-lg max-w-2xl">
            <div className="flex justify-center mb-4">
                <XIcon className="w-12 h-12 text-danger"/>
            </div>
            <h1 className="text-3xl font-bold text-white">Certificate Invalid or Revoked</h1>
            <p className="text-gray-400 mt-2">
                The link you used is either incorrect or the certificate has been revoked by the owner.
            </p>
            <a href={window.location.origin} className="mt-6 inline-block text-primary-light font-bold hover:underline text-lg">
                Return to BrandGuard
            </a>
        </div>
    </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark text-gray-300 flex flex-col">
        <header className="bg-secondary-dark shadow-md">
             <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex-shrink-0 flex items-center gap-3">
                        <BrandGuardLogoIcon />
                        <span className="text-2xl font-bold text-white">BrandGuard</span>
                    </div>
                </div>
            </div>
        </header>
        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8 p-6 bg-secondary-dark border border-primary/30 rounded-lg">
                    <div className="flex justify-center mb-4">
                        <ShieldCheckIcon className="w-12 h-12 text-primary"/>
                    </div>
                    <h1 className="text-3xl font-bold text-white">Certificate of Compliance</h1>
                    <p className="text-gray-400 mt-2">
                        This document certifies that the content has been analyzed by the BrandGuard Greenlight Engine.
                        {report.userName && <span> Run by: <strong className="font-semibold text-gray-200">{report.userName}</strong>.</span>}
                    </p>
                </div>
                <ReportCard report={report} />
            </div>
        </main>
        <footer className="w-full text-center p-6 bg-secondary-dark border-t border-gray-700">
            <p className="text-gray-400">Want to issue your own Certificates of Confidence and ship campaigns 3x faster?</p>
            <a href={window.location.origin} className="text-primary-light font-bold hover:underline text-lg">
                Activate Your Greenlight Engine
            </a>
            <p className="text-xs text-gray-500 mt-4">&copy; 2024 BrandGuard. All rights reserved.</p>
        </footer>
    </div>
  );
};

export default PublicReportView;