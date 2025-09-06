import React, { useState } from 'react';
import type { ComplianceReport, CheckItem, ReportStatus } from '../types';
import { generateCompliantRevision } from '../services/geminiService';
import { CheckIcon, WarningIcon, XIcon, CogIcon, SparklesIcon, ShareIcon, FilmIcon, TagIcon, ChevronDownIcon, DocumentTextIcon } from './icons/Icons';
import Loader from './Loader';

const statusConfig = {
  pass: { icon: <CheckIcon />, color: 'text-green-500', bgColor: 'bg-green-50', borderColor: 'border-green-300' },
  warn: { icon: <WarningIcon />, color: 'text-yellow-500', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-300' },
  fail: { icon: <XIcon />, color: 'text-red-500', bgColor: 'bg-red-50', borderColor: 'border-red-300' },
};

const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-success';
  if (score >= 60) return 'text-warning';
  return 'text-danger';
};

const statusDisplayConfig: Record<ReportStatus, { text: string; className: string }> = {
  pending: { text: 'Pending Review', className: 'bg-yellow-100 text-yellow-800' },
  approved: { text: 'Approved', className: 'bg-green-100 text-green-800' },
  revision: { text: 'Needs Revision', className: 'bg-red-100 text-red-800' },
};

const ModalityTag: React.FC<{ modality: CheckItem['modality'] }> = ({ modality }) => {
  if (modality !== 'audio' && modality !== 'visual') {
    return null;
  }
  const config = {
    audio: { text: 'Audio', className: 'bg-blue-100 text-blue-800' },
    visual: { text: 'Visual', className: 'bg-purple-100 text-purple-800' }
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
        <h4 className="font-semibold text-slate-dark flex items-center">{item.name}<ModalityTag modality={item.modality} /></h4>
        <p className="text-slate-light">{item.details}</p>
      </div>
    </div>
  );
};

interface ReportCardProps {
    report: ComplianceReport;
    // FIX: Made onStatusChange optional to support read-only views.
    onStatusChange?: (reportId: string, newStatus: ReportStatus) => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ report, onStatusChange }) => {
  const hasCustomRules = report.customRulesApplied && report.customRulesApplied.length > 0;
  const hasCreativeBrief = report.creativeBrief && report.creativeBrief.trim().length > 0;
  const failedChecks = report.checks.filter(c => c.status === 'fail');
  const [isRevising, setIsRevising] = useState(false);
  const [revisedContent, setRevisedContent] = useState<string | null>(null);
  const [revisionError, setRevisionError] = useState<string | null>(null);
  const [shareConfirmation, setShareConfirmation] = useState<string>('');
  const [showBrief, setShowBrief] = useState(false);


  const handleGenerateRevision = async () => { if (failedChecks.length === 0) { setRevisionError("No failing checks to revise."); return; } setIsRevising(true); setRevisedContent(null); setRevisionError(null); try { const revision = await generateCompliantRevision(report.sourceContent, report.analysisType, failedChecks); setRevisedContent(revision); } catch (err) { setRevisionError(err instanceof Error ? err.message : "An unknown error occurred."); } finally { setIsRevising(false); } };
  const handleShareReport = () => { try { const data = btoa(JSON.stringify(report)); const url = `${window.location.origin}${window.location.pathname}?report=${data}`; navigator.clipboard.writeText(url); setShareConfirmation('Link copied!'); setTimeout(() => setShareConfirmation(''), 3000); } catch (error) { setShareConfirmation('Could not create link.'); setTimeout(() => setShareConfirmation(''), 3000); }};

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden animate-fade-in border border-gray-200">
       {report.sourceMedia?.mimeType.startsWith('image/') && (
            <div className="bg-gray-100 p-4 flex justify-center border-b">
                <img
                    src={`data:${report.sourceMedia.mimeType};base64,${report.sourceMedia.data}`}
                    alt="Analyzed content"
                    className="max-h-72 rounded-lg object-contain shadow-md"
                />
            </div>
        )}
        {report.sourceMedia?.mimeType.startsWith('video/') && (
             <div className="bg-gray-100 p-4 flex flex-col justify-center items-center h-72 border-b">
                <div className="w-20 h-20 text-gray-400">
                    <FilmIcon />
                </div>
                <p className="text-gray-500 font-medium mt-2">Video Content Analyzed</p>
            </div>
        )}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-slate-dark">Analysis Report</h2>
            <div className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${statusDisplayConfig[report.status || 'pending'].className}`}>
                <TagIcon/>
                {/* FIX: Conditionally render status control based on onStatusChange prop. */}
                {onStatusChange ? (
                    <>
                        <select
                            value={report.status || 'pending'}
                            onChange={(e) => onStatusChange(report.id, e.target.value as ReportStatus)}
                            className="bg-transparent border-0 focus:ring-0 p-0 pr-6 appearance-none"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"><div className="bg-gray-100 p-4 rounded-lg text-center"><h3 className="text-sm font-medium text-slate-light uppercase">Compliance Score</h3><p className={`text-5xl font-bold ${getScoreColor(report.overallScore)}`}>{report.overallScore}</p></div><div className="md:col-span-2 bg-gray-100 p-4 rounded-lg"><h3 className="text-sm font-medium text-slate-light uppercase mb-2">AI Summary</h3><p className="text-slate-dark">{report.summary}</p></div></div>
        
        {hasCreativeBrief && (
            <div className="mb-6">
                <button onClick={() => setShowBrief(!showBrief)} className="w-full flex justify-between items-center text-left text-lg font-semibold text-slate-dark mb-3">
                    <span className="flex items-center gap-2"><DocumentTextIcon/> Creative Brief Applied</span>
                    <ChevronDownIcon className={`transform transition-transform ${showBrief ? 'rotate-180' : ''}`} />
                </button>
                {showBrief && (
                    <div className="bg-gray-100 p-4 rounded-lg border animate-fade-in">
                        <p className="whitespace-pre-wrap text-sm text-slate-light">{report.creativeBrief}</p>
                    </div>
                )}
            </div>
        )}

        {hasCustomRules && (<div className="mb-6"><h3 className="text-lg font-semibold text-slate-dark mb-3 flex items-center gap-2"><CogIcon/> Custom Rules Applied</h3><div className="bg-gray-100 p-4 rounded-lg border"><ul className="list-disc list-inside space-y-1 text-sm text-slate-light">{report.customRulesApplied?.map(rule => (<li key={rule.id}>{rule.text}</li>))}</ul></div></div>)}
        <h3 className="text-lg font-semibold text-slate-dark mb-4">Detailed Checks</h3>
        <div className="space-y-4">{report.checks.map((item, index) => (<CheckItemCard key={index} item={item} />))}</div>
      </div>
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-slate">Pro Features</h3><a href="#" className="text-xs font-semibold text-accent-dark hover:underline" title="A real app would link to a payment page here!">Upgrade</a></div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={handleGenerateRevision} disabled={isRevising || failedChecks.length === 0} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-slate hover:bg-slate-dark disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-sm" title={failedChecks.length === 0 ? "No failing checks to fix!" : "AI-powered content revision"}><SparklesIcon /> {isRevising ? 'Generating...' : 'Magic Fix'}</button>
          <button onClick={handleShareReport} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-slate-dark bg-white hover:bg-gray-100 transition-all shadow-sm"><ShareIcon /> {shareConfirmation ? shareConfirmation : 'Share Report'}</button>
        </div>
        {isRevising && <div className="mt-4"><Loader/></div>}
        {revisionError && <div className="mt-4 bg-red-100 border border-danger text-red-700 px-4 py-3 rounded-lg" role="alert">{revisionError}</div>}
        {revisedContent && (<div className="mt-6"><h4 className="font-semibold text-slate-dark">AI-Generated Compliant Revision:</h4><div className="mt-2 p-4 bg-green-50 border-l-4 border-success text-slate-dark rounded-r-lg"><p className="whitespace-pre-wrap font-mono text-sm">{revisedContent}</p></div></div>)}
      </div>
    </div>
  );
};

export default ReportCard;