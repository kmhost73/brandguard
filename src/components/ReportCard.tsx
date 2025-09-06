import React, { useState } from 'react';
import type { ComplianceReport, CheckItem, ReportStatus } from '../types';
import { generateCompliantRevision } from '../services/geminiService';
import { CheckIcon, WarningIcon, XIcon, CogIcon, SparklesIcon, ShareIcon, FilmIcon, TagIcon, ChevronDownIcon } from './icons/Icons';
import Loader from './Loader';

const statusConfig = {
  pass: { icon: <CheckIcon />, color: 'text-success', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30' },
  warn: { icon: <WarningIcon />, color: 'text-warning', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30' },
  fail: { icon: <XIcon />, color: 'text-danger', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' },
};

const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-success';
  if (score >= 60) return 'text-warning';
  return 'text-danger';
};

const statusDisplayConfig: Record<ReportStatus, { text: string; className: string }> = {
  pending: { text: 'Pending Review', className: 'bg-yellow-500/20 text-yellow-300' },
  approved: { text: 'Approved', className: 'bg-green-500/20 text-green-300' },
  revision: { text: 'Needs Revision', className: 'bg-red-500/20 text-red-300' },
};

const ModalityTag: React.FC<{ modality: CheckItem['modality'] }> = ({ modality }) => {
  if (modality !== 'audio' && modality !== 'visual') {
    return null;
  }
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
        <p className="text-gray-400">{item.details}</p>
      </div>
    </div>
  );
};

interface ReportCardProps {
    report: ComplianceReport;
    onStatusChange?: (reportId: string, newStatus: ReportStatus) => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ report, onStatusChange }) => {
  const hasCustomRules = report.customRulesApplied && report.customRulesApplied.length > 0;
  const failedChecks = report.checks.filter(c => c.status === 'fail');
  const [isRevising, setIsRevising] = useState(false);
  const [revisedContent, setRevisedContent] = useState<string | null>(null);
  const [revisionError, setRevisionError] = useState<string | null>(null);
  const [shareConfirmation, setShareConfirmation] = useState<string>('');


  const handleGenerateRevision = async () => { if (failedChecks.length === 0) { setRevisionError("No failing checks to revise."); return; } setIsRevising(true); setRevisedContent(null); setRevisionError(null); try { const revision = await generateCompliantRevision(report.sourceContent, report.analysisType, failedChecks); setRevisedContent(revision); } catch (err) { setRevisionError(err instanceof Error ? err.message : "An unknown error occurred."); } finally { setIsRevising(false); } };
  const handleShareReport = () => { try { const data = btoa(JSON.stringify(report)); const url = `${window.location.origin}${window.location.pathname}?report=${data}`; navigator.clipboard.writeText(url); setShareConfirmation('Link copied!'); setTimeout(() => setShareConfirmation(''), 3000); } catch (error) { setShareConfirmation('Could not create link.'); setTimeout(() => setShareConfirmation(''), 3000); }};

  return (
    <div className="bg-secondary-dark shadow-lg rounded-lg overflow-hidden animate-fade-in border border-gray-700">
       {report.sourceMedia?.mimeType.startsWith('image/') && (
            <div className="bg-dark p-4 flex justify-center border-b border-gray-700">
                <img
                    src={`data:${report.sourceMedia.mimeType};base64,${report.sourceMedia.data}`}
                    alt="Analyzed content"
                    className="max-h-72 rounded-lg object-contain shadow-md"
                />
            </div>
        )}
        {report.sourceMedia?.mimeType.startsWith('video/') && (
             <div className="bg-dark p-4 flex flex-col justify-center items-center h-72 border-b border-gray-700">
                <div className="w-20 h-20 text-gray-500">
                    <FilmIcon />
                </div>
                <p className="text-gray-400 font-medium mt-2">Video Content Analyzed</p>
            </div>
        )}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-white">Analysis Report</h2>
            <div className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${statusDisplayConfig[report.status || 'pending'].className}`}>
                <TagIcon/>
                {onStatusChange ? (
                    <>
                        <select
                            value={report.status || 'pending'}
                            onChange={(e) => onStatusChange(report.id, e.target.value as ReportStatus)}
                            className="bg-transparent border-0 focus:ring-0 p-0 pr-6 appearance-none cursor-pointer"
                            aria-label="Report status"
                        >
                            <option value="pending">Pending Review</option>
                            <option value="approved">Approved</option>
                            <option value="revision">Needs Revision</option>
                        </select>
                        <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" />
                    </>
                ) : (
                    <span>{statusDisplayConfig[report.status || 'pending'].text}</span>
                )}
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-dark p-4 rounded-lg text-center border border-gray-700">
                <h3 className="text-sm font-medium text-gray-400 uppercase">Compliance Score</h3>
                <p className={`text-5xl font-bold ${getScoreColor(report.overallScore)}`}>{report.overallScore}</p>
            </div>
            <div className="md:col-span-2 bg-dark p-4 rounded-lg border border-gray-700">
                <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">AI Summary</h3>
                <p className="text-gray-300">{report.summary}</p>
            </div>
        </div>
        
        {hasCustomRules && (<div className="mb-6"><h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><CogIcon/> Custom Rules Applied</h3><div className="bg-dark p-4 rounded-lg border border-gray-700"><ul className="list-disc list-inside space-y-1 text-sm text-gray-400">{report.customRulesApplied?.map(rule => (<li key={rule.id}>{rule.text}</li>))}</ul></div></div>)}
        <h3 className="text-lg font-semibold text-white mb-4">Detailed Checks</h3>
        <div className="space-y-4">{report.checks.map((item, index) => (<CheckItemCard key={index} item={item} />))}</div>
      </div>
      <div className="p-6 border-t border-gray-700 bg-dark">
        <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg bg-secondary-dark items-center">
            <div className="flex-grow">
                <h3 className="text-lg font-bold text-white">Unlock "Magic Fix" & More</h3>
                <p className="text-sm text-white/80">This is a demo. Upgrade to Pro for full features.</p>
            </div>
             <button disabled className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-secondary-dark bg-white cursor-not-allowed opacity-70" title="This is a demo feature."><SparklesIcon /> Upgrade to Pro</button>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <button onClick={handleGenerateRevision} disabled={isRevising || failedChecks.length === 0} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-secondary hover:bg-secondary-light disabled:bg-gray-600 disabled:cursor-not-allowed transition-all shadow-sm" title={failedChecks.length === 0 ? "No failing checks to fix!" : "AI-powered content revision"}><SparklesIcon /> {isRevising ? 'Generating...' : 'Magic Fix (Demo)'}</button>
            <button onClick={handleShareReport} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-secondary-dark hover:bg-gray-700 transition-all shadow-sm"><ShareIcon /> {shareConfirmation ? shareConfirmation : 'Share Report'}</button>
        </div>
        {isRevising && <div className="mt-4"><Loader/></div>}
        {revisionError && <div className="mt-4 bg-red-900/50 border border-danger text-red-300 px-4 py-3 rounded-lg" role="alert">{revisionError}</div>}
        {revisedContent && (<div className="mt-6"><h4 className="font-semibold text-gray-200">AI-Generated Compliant Revision:</h4><div className="mt-2 p-4 bg-green-900/30 border-l-4 border-success text-gray-200 rounded-r-lg"><p className="whitespace-pre-wrap font-mono text-sm">{revisedContent}</p></div></div>)}
      </div>
    </div>
  );
};

export default ReportCard;