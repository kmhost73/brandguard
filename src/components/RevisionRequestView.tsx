import React, { useState } from 'react';
import type { ComplianceReport, CheckItem } from '../types';
import { BrandGuardLogoIcon, CheckIcon, XIcon, WarningIcon, SparklesIcon, ClipboardIcon, FilmIcon } from './icons/Icons';

// Re-using some components from ReportCard for consistency
const statusConfig = {
  pass: { icon: <CheckIcon />, color: 'text-success', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30' },
  warn: { icon: <WarningIcon />, color: 'text-warning', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30' },
  fail: { icon: <XIcon />, color: 'text-danger', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' },
};

const CheckItemCard: React.FC<{ item: CheckItem }> = ({ item }) => {
  const config = statusConfig[item.status];
  return (
    <div className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor} flex items-start space-x-4`}>
      <div className={`flex-shrink-0 w-6 h-6 ${config.color}`}>{config.icon}</div>
      <div>
        <h4 className="font-semibold text-gray-200 flex items-center">{item.name}</h4>
        <p className="text-gray-400">{item.details}</p>
      </div>
    </div>
  );
};


const RevisionRequestView: React.FC<{ report: ComplianceReport | 'invalid' }> = ({ report }) => {
  const [copyConfirmation, setCopyConfirmation] = useState('');
  
  if (report === 'invalid') {
    return (
       <div className="min-h-screen bg-dark text-gray-300 flex flex-col items-center justify-center p-4">
        <div className="text-center p-8 bg-secondary-dark border border-danger rounded-lg shadow-lg max-w-2xl">
            <div className="flex justify-center mb-4">
                <XIcon className="w-12 h-12 text-danger"/>
            </div>
            <h1 className="text-3xl font-bold text-white">Revision Request Not Found</h1>
            <p className="text-gray-400 mt-2">
                The link you used is either incorrect or the revision request has been deleted.
            </p>
            <a href={window.location.origin} className="mt-6 inline-block text-primary-light font-bold hover:underline text-lg">
                Return to BrandGuard
            </a>
        </div>
    </div>
    )
  }
  
  const failedChecks = report.checks.filter(c => c.status === 'fail' || c.status === 'warn');
  const hasSuggestedRevision = report.suggestedRevision && report.suggestedRevision.trim() !== '';

  const handleCopy = () => {
    if (report.suggestedRevision) {
        navigator.clipboard.writeText(report.suggestedRevision);
        setCopyConfirmation('Copied!');
        setTimeout(() => setCopyConfirmation(''), 2000);
    }
  };

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
                <div className="text-center mb-8 p-6 bg-secondary-dark border border-yellow-500/30 rounded-lg">
                    <div className="flex justify-center mb-4 text-yellow-400">
                        <SparklesIcon />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Revision Requested</h1>
                    <p className="text-gray-400 mt-2">
                        The following content requires changes to meet compliance standards. Please review the details below and use the suggested revision.
                    </p>
                </div>
                
                 <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Original Content</h3>
                        {report.sourceMedia?.mimeType.startsWith('image/') && (
                            <div className="mb-4 p-4 bg-dark rounded-lg border border-gray-700 flex justify-center">
                                <img
                                    src={`data:${report.sourceMedia.mimeType};base64,${report.sourceMedia.data}`}
                                    alt="Analyzed content"
                                    className="max-h-72 rounded-lg object-contain shadow-md"
                                />
                            </div>
                        )}
                        {report.sourceMedia?.mimeType.startsWith('video/') && (
                            <div className="mb-4 p-4 bg-dark rounded-lg border border-gray-700 flex justify-center">
                                <video
                                    src={`data:${report.sourceMedia.mimeType};base64,${report.sourceMedia.data}`}
                                    controls
                                    className="max-h-72 rounded-lg shadow-md w-full"
                                >
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                        )}
                        <div className="bg-dark p-4 rounded-lg border border-gray-700">
                            <p className="text-gray-300 whitespace-pre-wrap font-mono text-sm">{report.sourceContent}</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Issues to Address</h3>
                         <div className="space-y-4">{failedChecks.map((item, index) => (<CheckItemCard key={index} item={item} />))}</div>
                    </div>
                    
                    {hasSuggestedRevision && (
                        <div className="p-6 border-t border-gray-700 bg-dark rounded-lg animate-fade-in">
                            <h4 className="font-semibold text-gray-200 flex items-center gap-2 mb-2"><SparklesIcon /> AI-Suggested Revision</h4>
                            <p className="text-sm text-gray-400 mb-2">The following revision has been generated to address the compliance issues.</p>
                            <div className="mt-2 p-4 bg-green-900/30 border-l-4 border-success text-gray-200 rounded-r-lg">
                                <p className="whitespace-pre-wrap font-mono text-sm">{report.suggestedRevision}</p>
                            </div>
                            <button
                                onClick={handleCopy}
                                className="mt-4 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-success text-white font-semibold rounded-md hover:bg-green-600 transition-colors">
                                <ClipboardIcon /> {copyConfirmation || 'Copy Suggested Revision'}
                            </button>
                        </div>
                    )}
                 </div>

            </div>
        </main>
        <footer className="w-full text-center p-6 bg-secondary-dark border-t border-gray-700">
            <p className="text-xs text-gray-500 mt-4">&copy; {new Date().getFullYear()} BrandGuard. All rights reserved.</p>
        </footer>
    </div>
  );
};

export default RevisionRequestView;