import React, { useState } from 'react';
import type { ComplianceReport, CheckItem, ReportStatus } from '../types';
import { CheckIcon, WarningIcon, XIcon, CogIcon, SparklesIcon, FilmIcon, TagIcon, ChevronDownIcon, UserIcon, LightbulbIcon, DownloadIcon, ClipboardIcon } from './icons/Icons';
import Loader from './Loader';
import { editImage } from '../services/geminiService';

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

// Helper to convert a base64 string to a File object
const base64StringToFile = (base64String: string, filename: string, mimeType: string): File => {
    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return new File([blob], filename, { type: mimeType });
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
  onAcceptRevision?: (revisedContent: string) => void;
  onDownloadPdf?: (report: ComplianceReport) => void;
  isGeneratingPdf?: boolean;
  onAcceptImageRevision?: (newImageFile: File) => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ report, onStatusChange, onAcceptRevision, onDownloadPdf, isGeneratingPdf, onAcceptImageRevision }) => {
  const hasCustomRules = report.customRulesApplied && report.customRulesApplied.length > 0;
  
  // State for image magic fix
  const [imageFixPrompt, setImageFixPrompt] = useState('');
  const [isFixingImage, setIsFixingImage] = useState(false);
  const [fixedImageBase64, setFixedImageBase64] = useState<string | null>(null);
  const [imageFixError, setImageFixError] = useState<string | null>(null);
  const [copyRevisionConfirmation, setCopyRevisionConfirmation] = useState('');

  const handleCopyRevision = () => {
    if (report.suggestedRevision) {
        navigator.clipboard.writeText(report.suggestedRevision);
        setCopyRevisionConfirmation('Copied!');
        setTimeout(() => setCopyRevisionConfirmation(''), 2000);
    }
  };

  const handleImageFix = async () => {
    if (!imageFixPrompt.trim() || !report.sourceMedia) return;
    setIsFixingImage(true);
    setFixedImageBase64(null);
    setImageFixError(null);
    try {
        const newImage = await editImage(report.sourceMedia.data, report.sourceMedia.mimeType, imageFixPrompt);
        if (newImage) {
            setFixedImageBase64(newImage);
        } else {
            throw new Error("The AI did not return an image. Please try a different prompt.");
        }
    } catch(err) {
        setImageFixError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
        setIsFixingImage(false);
    }
  };

  const handleUseFixedImage = () => {
    if (fixedImageBase64 && report.sourceMedia && onAcceptImageRevision) {
        const newImageFile = base64StringToFile(
            fixedImageBase64,
            `fixed-${report.id}.png`,
            'image/png' // The edit model returns PNG
        );
        onAcceptImageRevision(newImageFile);
    }
  };

  const handleDownloadFixedImage = () => {
    if (fixedImageBase64) {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${fixedImageBase64}`;
      link.download = `brandguard-fixed-image-${report.id.slice(0, 8)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const hasSuggestedRevision = report.suggestedRevision && report.suggestedRevision.trim() !== '';
  const showImageFix = report.analysisType === 'image' && report.overallScore < 90 && onAcceptImageRevision && report.sourceMedia;


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
            <div>
                <h2 className="text-2xl font-bold text-white">Greenlight Report</h2>
                {report.userName && (
                    <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                        <UserIcon />
                        Report run by: <span className="font-semibold text-gray-300">{report.userName}</span>
                    </p>
                )}
            </div>
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
                <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">Engine Summary</h3>
                <p className="text-gray-300">{report.summary}</p>
            </div>
        </div>

        {report.strategicInsight && (
            <div className="mb-6 animate-fade-in">
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 flex items-start gap-4">
                    <div className="text-blue-400 mt-0.5 shrink-0">
                        <LightbulbIcon />
                    </div>
                    <div>
                        <h4 className="font-semibold text-blue-300">Strategic Insight</h4>
                        <p className="text-gray-300 text-sm">{report.strategicInsight}</p>
                    </div>
                </div>
            </div>
        )}
        
        {hasCustomRules && (<div className="mb-6"><h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><CogIcon/> Custom Rules Applied</h3><div className="bg-dark p-4 rounded-lg border border-gray-700"><ul className="list-disc list-inside space-y-1 text-sm text-gray-400">{report.customRulesApplied?.map(rule => (<li key={rule.id}>{rule.intent}</li>))}</ul></div></div>)}
        <h3 className="text-lg font-semibold text-white mb-4">Detailed Checks</h3>
        <div className="space-y-4">{report.checks.map((item, index) => (<CheckItemCard key={index} item={item} />))}</div>
      </div>
      
       {onDownloadPdf && (
        <div className="p-6 border-t border-gray-700 bg-dark/50 flex flex-wrap items-center gap-4">
           <button
                onClick={() => onDownloadPdf(report)}
                disabled={isGeneratingPdf}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-white font-semibold rounded-md hover:bg-secondary-light transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
                {isGeneratingPdf ? <Loader size="sm"/> : <DownloadIcon />}
                {isGeneratingPdf ? 'Generating PDF...' : 'Download Certificate'}
            </button>
        </div>
      )}

      {(onAcceptRevision && hasSuggestedRevision) || showImageFix ? (
          <div className="p-6 border-t border-gray-700 bg-dark animate-fade-in">
              <h4 className="font-semibold text-gray-200 flex items-center gap-2 mb-2"><SparklesIcon /> Magic Fix</h4>
              
              {onAcceptRevision && hasSuggestedRevision && (
                  <div>
                      <p className="text-sm text-gray-400 mb-2">The engine has suggested a compliant revision for your caption.</p>
                      <div className="mt-2 p-4 bg-green-900/30 border-l-4 border-success text-gray-200 rounded-r-lg">
                          <p className="whitespace-pre-wrap font-mono text-sm">{report.suggestedRevision}</p>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                          <button
                              onClick={() => onAcceptRevision(report.suggestedRevision!)}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-success text-white font-semibold rounded-md hover:bg-green-600 transition-colors">
                              <CheckIcon /> Accept Revision & Re-Scan
                          </button>
                          <button
                              onClick={handleCopyRevision}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-white font-semibold rounded-md hover:bg-secondary-light transition-colors"
                          >
                            <ClipboardIcon /> {copyRevisionConfirmation || 'Copy Revision'}
                          </button>
                      </div>
                  </div>
              )}

              {showImageFix && (
                  <div className={`${hasSuggestedRevision ? 'mt-6 pt-6 border-t border-gray-700' : ''}`}>
                      <p className="text-sm text-gray-400 mb-2">Describe a change to fix the compliance issues in your image.</p>
                      <div className="flex gap-2">
                           <input type="text" value={imageFixPrompt} onChange={(e) => setImageFixPrompt(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleImageFix()} placeholder="e.g., Add a bright #ad logo to the top right" className="flex-grow p-2 border border-gray-600 rounded-md bg-dark text-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition disabled:opacity-50" disabled={isFixingImage}/>
                           <button onClick={handleImageFix} className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:bg-gray-600" disabled={isFixingImage || !imageFixPrompt.trim()}>
                                {isFixingImage ? <Loader size="sm" /> : <SparklesIcon />}
                                {isFixingImage ? 'Fixing...' : 'Generate Fix'}
                           </button>
                      </div>

                      {isFixingImage && <div className="mt-4 flex justify-center"><Loader text="Applying Magic Fix to image..." /></div>}
                      {imageFixError && <div className="mt-4 bg-red-900/50 border border-danger text-red-300 px-4 py-3 rounded-lg" role="alert"><p className="font-bold">Error</p><p>{imageFixError}</p></div>}
                      
                      {fixedImageBase64 && (
                          <div className="mt-4 animate-fade-in">
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-center text-sm font-semibold mb-2">Original</p>
                                        <img src={`data:${report.sourceMedia?.mimeType};base64,${report.sourceMedia?.data}`} alt="Original" className="rounded-lg shadow-md w-full" />
                                    </div>
                                    <div>
                                        <p className="text-center text-sm font-semibold mb-2">Suggested Fix</p>
                                        <img src={`data:image/png;base64,${fixedImageBase64}`} alt="Fixed" className="rounded-lg shadow-md w-full" />
                                    </div>
                               </div>
                               <div className="mt-4 flex flex-wrap items-center gap-3">
                                   <button
                                      onClick={handleUseFixedImage}
                                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-success text-white font-semibold rounded-md hover:bg-green-600 transition-colors">
                                      <CheckIcon /> Use This Image & Re-Scan
                                  </button>
                                  <button
                                    onClick={handleDownloadFixedImage}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-white font-semibold rounded-md hover:bg-secondary-light transition-colors">
                                    <DownloadIcon /> Download Fix
                                  </button>
                               </div>
                          </div>
                      )}
                  </div>
              )}
          </div>
      ) : null}
    </div>
  );
};

export default ReportCard;
