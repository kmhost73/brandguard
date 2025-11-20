
import React, { useEffect } from 'react';
import type { ComplianceReport, CheckItem } from '../types';
import { BrandGuardLogoIcon, CheckIcon, WarningIcon, XIcon, CogIcon, FilmIcon, UserIcon, ShieldCheckIcon } from './icons/Icons';

const statusConfig = {
  pass: { icon: <CheckIcon />, color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30' },
  warn: { icon: <WarningIcon />, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30' },
  fail: { icon: <XIcon />, color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' },
};

const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  return 'text-red-400';
};

const ModalityTag: React.FC<{ modality: CheckItem['modality'] }> = ({ modality }) => {
  if (modality !== 'audio' && modality !== 'visual') return null;
  const config = {
    audio: { text: 'Audio', className: 'bg-blue-500/20 text-blue-300' },
    visual: { text: 'Visual', className: 'bg-purple-500/20 text-purple-300' }
  };
  const { text, className } = config[modality];
  return (<span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${className}`}>{text}</span>);
};

const CheckItemCard: React.FC<{ item: CheckItem }> = ({ item }) => {
  const config = statusConfig[item.status];
  return (
    <div className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor} flex items-start space-x-4`}>
      <div className={`flex-shrink-0 w-6 h-6 ${config.color}`}>{config.icon}</div>
      <div>
        <h4 className="font-semibold text-gray-200 flex items-center">{item.name}<ModalityTag modality={item.modality} /></h4>
        <p className="text-gray-400 text-sm">{item.details}</p>
      </div>
    </div>
  );
};

interface CertificatePDFProps {
  report: ComplianceReport;
  onRendered?: () => void;
}

const CertificatePDF: React.FC<CertificatePDFProps> = ({ report, onRendered }) => {
  const hasCustomRules = report.customRulesApplied && report.customRulesApplied.length > 0;
  const isApproved = report.overallScore >= 90;

  useEffect(() => {
    // Signal that the component has mounted and rendered.
    // This is more reliable than a timeout for PDF generation.
    onRendered?.();
  }, [onRendered]);

  return (
    <div className="bg-dark text-gray-300 p-10 font-sans">
        <header className="flex justify-between items-center pb-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
                <BrandGuardLogoIcon />
                <span className="text-3xl font-bold text-white">BrandGuard</span>
            </div>
            <div className="text-right">
                <p className="text-2xl font-bold text-white">Certificate of Compliance</p>
                <p className="text-sm text-gray-400">ID: {report.id.slice(0, 12)}</p>
            </div>
        </header>

        <main className="mt-8">
            <div className={`p-6 rounded-lg border-2 ${isApproved ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'} flex flex-col items-center text-center`}>
                <ShieldCheckIcon className={`w-16 h-16 ${isApproved ? 'text-green-400' : 'text-red-400'}`} />
                <h1 className={`text-4xl font-bold mt-2 ${isApproved ? 'text-green-300' : 'text-red-300'}`}>
                    {isApproved ? 'GREENLIT' : 'NEEDS REVISION'}
                </h1>
                <p className="text-gray-400 mt-1">This document certifies that the content has been analyzed by the BrandGuard Engine.</p>
            </div>

            <div className="grid grid-cols-3 gap-6 my-8">
                <div className="bg-secondary-dark p-4 rounded-lg text-center border border-gray-700">
                    <h3 className="text-sm font-medium text-gray-400 uppercase">Compliance Score</h3>
                    <p className={`text-5xl font-bold ${getScoreColor(report.overallScore)}`}>{report.overallScore}</p>
                </div>
                <div className="col-span-2 bg-secondary-dark p-4 rounded-lg border border-gray-700">
                    <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">Engine Summary</h3>
                    <p className="text-gray-300">{report.summary}</p>
                </div>
            </div>

            <div className="bg-secondary-dark p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Analysis Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="font-semibold text-gray-400">Timestamp:</div>
                    <div className="text-gray-200">{new Date(report.timestamp).toLocaleString()}</div>

                    <div className="font-semibold text-gray-400">Analysis Type:</div>
                    <div className="text-gray-200 capitalize">{report.analysisType}</div>

                    {report.campaignName && <>
                        <div className="font-semibold text-gray-400">Campaign:</div>
                        <div className="text-gray-200">{report.campaignName}</div>
                    </>}

                    {report.influencerHandle && <>
                         <div className="font-semibold text-gray-400">Influencer:</div>
                         <div className="text-gray-200 font-medium">{report.influencerHandle}</div>
                    </>}

                     {report.clientBrand && <>
                         <div className="font-semibold text-gray-400">Client Brand:</div>
                         <div className="text-gray-200">{report.clientBrand}</div>
                    </>}

                    {report.userName && <>
                        <div className="font-semibold text-gray-400">Reviewer:</div>
                        <div className="text-gray-200">{report.userName}</div>
                    </>}
                </div>
            </div>

            <div className="mt-8">
                <h3 className="text-lg font-semibold text-white mb-4">Source Content</h3>
                 {report.sourceMedia?.mimeType.startsWith('image/') && (
                    <div className="mb-4 p-4 bg-dark rounded-lg border border-gray-700 flex justify-center">
                        <img src={`data:${report.sourceMedia.mimeType};base64,${report.sourceMedia.data}`} alt="Analyzed content" className="max-h-60 rounded object-contain" />
                    </div>
                )}
                 {report.sourceMedia?.mimeType.startsWith('video/') && (
                     <div className="mb-4 p-6 bg-dark rounded-lg border border-gray-700 flex flex-col items-center justify-center">
                        <FilmIcon />
                        <p className="text-gray-400 font-medium mt-2">Video Content Analyzed</p>
                    </div>
                )}
                <div className="bg-dark p-4 rounded-lg border border-gray-700">
                    <p className="text-gray-300 whitespace-pre-wrap font-mono text-sm">{report.sourceContent}</p>
                </div>
            </div>
            
            {hasCustomRules && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><CogIcon/> Custom Rules Applied</h3>
                    <div className="bg-secondary-dark p-4 rounded-lg border border-gray-700">
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-400">{report.customRulesApplied?.map(rule => (<li key={rule.id}>{rule.intent}</li>))}</ul>
                    </div>
                </div>
            )}
            
            <div className="mt-8">
                <h3 className="text-lg font-semibold text-white mb-4">Detailed Checks</h3>
                <div className="space-y-4">{report.checks.map((item, index) => (<CheckItemCard key={index} item={item} />))}</div>
            </div>
        </main>
        
        <footer className="mt-10 pt-6 border-t border-gray-700 text-center">
            <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} BrandGuard. All rights reserved. This certificate is a record of an automated compliance scan and does not constitute legal advice.</p>
        </footer>
    </div>
  );
};

export default CertificatePDF;
