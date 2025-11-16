import React, { useState, useCallback, useEffect, useRef, lazy, Suspense, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { analyzePostContent, analyzeVideoContent, analyzeImageContent, transcribeVideo } from '../services/geminiService';
import type { ComplianceReport, CustomRule, ReportStatus, MainView, DashboardView, QueueItem } from '../types';
import * as db from '../services/dbService';
import Loader from './Loader';
import WelcomeGuide from './WelcomeGuide';
import { HistoryIcon, FilmIcon, EllipsisHorizontalIcon, FolderIcon, ChevronDownIcon, SparklesIcon, XIcon, PhotoIcon, VideoCameraIcon } from './icons/Icons';
import CertificatePDF from './CertificatePDF';
import GreenlightQueue from './GreenlightQueue';
import OnboardingTour from './OnboardingTour';
import Analytics from './Analytics';

const ReportCard = lazy(() => import('./ReportCard'));
const ImageStudio = lazy(() => import('./ImageStudio'));

interface DashboardProps {
  activeWorkspaceId: string;
  customRules: CustomRule[];
  reportHistory: ComplianceReport[];
  onNavigate: (view: MainView) => void;
  // FIX: Update prop type to accept async functions that return a Promise.
  onCreateCertificate: (report: ComplianceReport) => Promise<string>;
  onUpdateReportStatus: (reportId: string, newStatus: ReportStatus) => void;
  onUpdateReportInsight: (reportId: string, insight: string) => void;
  onDeleteReport: (reportId: string) => void;
  // FIX: Update prop type to accept async functions that return a Promise.
  onCreateRevisionRequest: (report: ComplianceReport) => Promise<string>;
}

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


const Dashboard: React.FC<DashboardProps> = ({ activeWorkspaceId, customRules, reportHistory, onNavigate, onCreateCertificate, onUpdateReportStatus, onUpdateReportInsight, onDeleteReport, onCreateRevisionRequest }) => {
  const [activeView, setActiveView] = useState<DashboardView>('text');
  const [batchMode, setBatchMode] = useState(false);
  const [imageSourceMode, setImageSourceMode] = useState<'upload' | 'generate'>('upload');
  const [postContent, setPostContent] = useState<string>('');
  const [campaignName, setCampaignName] = useState<string>('');
  const [campaignSuggestions, setCampaignSuggestions] = useState<string[]>([]);
  const [videoTranscript, setVideoTranscript] = useState<string>('');
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState('Scanning...');
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<ReportStatus | 'all'>('all');
  const [newReportId, setNewReportId] = useState<string | null>(null);
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  const [shareConfirmation, setShareConfirmation] = useState('');
  const [revisionConfirmation, setRevisionConfirmation] = useState('');
  const [openCampaign, setOpenCampaign] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const reportCardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isProcessingQueue = useRef(false);

  const handleDownloadPdf = async (reportToDownload: ComplianceReport) => {
    setActiveActionMenu(null);
    setIsGeneratingPdf(true);
    setError(null);
    
    const container = document.createElement('div');
    let root: ReactDOM.Root | null = null;

    try {
        const { default: jsPDF } = await import('jspdf');
        const { default: html2canvas } = await import('html2canvas');

        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.width = '827px'; 
        document.body.appendChild(container);

        root = ReactDOM.createRoot(container);
        
        await new Promise<void>((resolve) => {
            root!.render(<CertificatePDF report={reportToDownload} onRendered={resolve} />);
        });
        
        const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#1A202C' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: [canvas.width, canvas.height] });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`BrandGuard-Certificate-${reportToDownload.id.slice(0, 8)}.pdf`);

    } catch (err) {
        console.error("Error generating PDF:", err);
        setError("Could not generate PDF certificate.");
    } finally {
        if (root) root.unmount();
        if (container.parentNode) container.parentNode.removeChild(container);
        setIsGeneratingPdf(false);
    }
  };
  
  useEffect(() => {
    setReport(null);
    setQueue([]);
    setBatchMode(false);
    const onboardingComplete = localStorage.getItem('brandGuardOnboardingComplete');
    if (!onboardingComplete) setShowOnboarding(true);
  }, [activeWorkspaceId]);
  
  const handleOnboardingComplete = () => {
    localStorage.setItem('brandGuardOnboardingComplete', 'true');
    setShowOnboarding(false);
  };

  useEffect(() => {
    if (!report && activeView === 'text' && textareaRef.current && !batchMode) {
      textareaRef.current.focus();
    }
  }, [report, activeView, batchMode]);

  useEffect(() => {
    if (report && report.id === newReportId) {
      reportCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setOpenCampaign(report.campaignName || 'General Scans');
      const timer = setTimeout(() => setNewReportId(null), 2000); 
      return () => clearTimeout(timer);
    }
  }, [report, newReportId]);
  
  const handleAnalysisCompletion = useCallback(async (newReport: Omit<ComplianceReport, 'workspaceId'>) => {
    const reportWithWorkspace = { ...newReport, workspaceId: activeWorkspaceId };
    const reportWithInitialStatus = { ...reportWithWorkspace, status: newReport.recommendedStatus || 'pending' };
    await db.addReport(reportWithInitialStatus);
    return reportWithInitialStatus;
  }, [activeWorkspaceId]);

  const handleImageGenerated = (base64Data: string, mimeType: string) => {
    const filename = `generated-image-${Date.now()}.png`;
    const file = base64StringToFile(base64Data, filename, mimeType);
    setSelectedImageFile(file);
  };

  const handleVideoUpload = useCallback(async (file: File | null) => {
    if (file) {
        setSelectedVideoFile(file);
        setIsLoading(true);
        setLoadingText('Transcribing...');
        setError(null);
        setReport(null);
        setVideoTranscript('');
        try {
            const transcript = await transcribeVideo(file);
            setVideoTranscript(transcript);

            setLoadingText('Analyzing Video...');
            const result = await analyzeVideoContent(transcript, campaignName, file, customRules, (insight) => onUpdateReportInsight(result.id, insight));
            const finalReport = await handleAnalysisCompletion(result);
            setReport(finalReport);
            setNewReportId(finalReport.id);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred during video processing.");
        } finally {
            setIsLoading(false);
        }
    }
  }, [customRules, handleAnalysisCompletion, onUpdateReportInsight, campaignName]);
  
  const processQueue = useCallback(async () => {
    if (isProcessingQueue.current || queue.every(item => item.status !== 'Queued')) {
      return;
    }
    isProcessingQueue.current = true;

    for (const item of queue) {
        if (item.status === 'Queued') {
            setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'Running' } : q));
            try {
                let result;
                if (item.content) { 
                    result = await analyzePostContent(item.content, campaignName, customRules, false, (insight) => onUpdateReportInsight(result.id, insight));
                } else if (item.file) { 
                    result = await analyzeImageContent(postContent, campaignName, item.file, customRules, (insight) => onUpdateReportInsight(result.id, insight));
                }
                 if (result) {
                    const finalReport = await handleAnalysisCompletion(result);
                    setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'Complete', result: finalReport } : q));
                } else {
                    throw new Error("Analysis returned no result.");
                }
            } catch (err) {
                const error = err instanceof Error ? err.message : "Unknown error";
                setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'Error', error } : q));
            }
        }
    }
    isProcessingQueue.current = false;
  }, [queue, campaignName, customRules, postContent, handleAnalysisCompletion, onUpdateReportInsight]);

  useEffect(() => {
    processQueue();
  }, [queue, processQueue]);


  const showWelcomeGuide = !report && !postContent.trim() && !selectedImageFile && !selectedVideoFile && !isLoading && queue.length === 0 && !showOnboarding;
  
  const handleStartExample = () => {
    setActiveView('text');
    setPostContent(examplePost);
  };

  const handleScan = useCallback(async (options: { contentOverride?: string; isRescan?: boolean; isQuickScan?: boolean } = {}) => {
    const { contentOverride, isRescan = false, isQuickScan = false } = options;
    
    if (batchMode) {
      if (activeView === 'text') {
        const newItems: QueueItem[] = postContent.split('\n').filter(line => line.trim() !== '').map(line => ({ id: crypto.randomUUID(), status: 'Queued', content: line.trim() }));
        setQueue(prev => [...prev, ...newItems]);
        setPostContent('');
      }
      return;
    }

    setIsLoading(true);
    setLoadingText('Scanning...');
    setReport(null);
    setError(null);

    try {
      let result;
      const contentToScan = contentOverride !== undefined ? contentOverride : postContent;
      const campaignToScan = isQuickScan ? '' : campaignName;

      if (activeView === 'text') {
        if (!contentToScan.trim()) throw new Error("Please enter post content to analyze.");
        result = await analyzePostContent(contentToScan, campaignToScan, customRules, isRescan, (insight) => onUpdateReportInsight(result.id, insight));
      } else if (activeView === 'video') {
         if (fileInputRef.current) fileInputRef.current.click();
         return;
      } else if (activeView === 'image') {
        if (!contentToScan.trim() || !selectedImageFile) throw new Error("Please provide an image and a caption.");
        setLoadingText('Analyzing Image...');
        result = await analyzeImageContent(contentToScan, campaignName, selectedImageFile, customRules, (insight) => onUpdateReportInsight(result.id, insight));
      }
      
      if(result) {
        const finalReport = await handleAnalysisCompletion(result);
        setReport(finalReport);
        setNewReportId(finalReport.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
       if (activeView !== 'video') setIsLoading(false);
    }
  }, [activeView, postContent, campaignName, selectedImageFile, customRules, handleAnalysisCompletion, onUpdateReportInsight, batchMode]);
  
  const handleAcceptRevision = (revisedContent: string) => {
      setPostContent(revisedContent);
      setReport(null);
      handleScan({ contentOverride: revisedContent, isRescan: true });
  };
  
  const handleAcceptImageRevision = (newImageFile: File) => {
    setSelectedImageFile(newImageFile);
    setReport(null);
    handleScan({ isRescan: true });
  };
  
  const resetState = (clearInputs = true) => {
    setReport(null);
    setError(null);
    setQueue([]);
    setBatchMode(false);
    if (clearInputs) {
      setPostContent('');
      setCampaignName('');
      setVideoTranscript('');
      setSelectedVideoFile(null);
      setSelectedImageFile(null);
    }
  };

  const switchTab = (type: DashboardView) => {
    setActiveView(type);
    resetState();
  };
  const viewHistoricReport = (historicReport: ComplianceReport) => {
    setActiveActionMenu(null);
    resetState(false);
    setReport(historicReport);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // FIX: Make the function async to await the promise from onCreateCertificate.
  const handleShareReport = async (reportToShare: ComplianceReport) => {
    setActiveActionMenu(null);
    const confirmation = await onCreateCertificate(reportToShare);
    setShareConfirmation(confirmation);
    setTimeout(() => setShareConfirmation(''), 2000);
  };

  // FIX: Make the function async to await the promise from onCreateRevisionRequest.
  const handleCreateRevisionRequestLocal = async (reportToShare: ComplianceReport) => {
    setActiveActionMenu(null);
    const confirmation = await onCreateRevisionRequest(reportToShare);
    setRevisionConfirmation(confirmation);
    setTimeout(() => setRevisionConfirmation(''), 2000);
  };
  
  const getButtonText = () => {
    if (batchMode) return `Add ${activeView === 'text' ? 'Captions' : 'Images'} to Queue`;
    if (activeView === 'video') return 'Select & Analyze Video';
    if (activeView === 'image') return 'Scan Image & Caption';
    return 'Scan Post';
  };
  
  const isScanDisabled = () => {
      if (isLoading || isGeneratingPdf) return true;
      if (batchMode) {
        if (activeView === 'text' && !postContent.trim()) return true;
        if (activeView === 'image' && !postContent.trim()) return true; 
      } else {
        if (activeView === 'text' && !postContent.trim()) return true;
        if (activeView === 'image' && (!postContent.trim() || !selectedImageFile)) return true;
      }
      return false;
  }
  
  const allCampaigns = useMemo(() => {
    const campaigns = new Set(reportHistory.map(r => r.campaignName).filter(Boolean) as string[]);
    return Array.from(campaigns);
  }, [reportHistory]);

  const handleCampaignNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCampaignName(value);
    if (value) {
        setCampaignSuggestions(allCampaigns.filter(c => c.toLowerCase().includes(value.toLowerCase()) && c.toLowerCase() !== value.toLowerCase()));
    } else {
        setCampaignSuggestions([]);
    }
  };

  const selectCampaign = (name: string) => {
    setCampaignName(name);
    setCampaignSuggestions([]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (batchMode && activeView === 'image') {
      const files = Array.from(e.dataTransfer.files).filter((file: File) => file.type.startsWith('image/'));
      const newItems: QueueItem[] = files.map(file => ({ id: crypto.randomUUID(), status: 'Queued', file }));
      setQueue(prev => [...prev, ...newItems]);
    }
  };

  const statusDisplayConfig: Record<ReportStatus, { tag: string, color: string, filterColor: string }> = {
    pending: { tag: 'Pending', color: 'bg-yellow-500/20 text-yellow-300', filterColor: 'hover:bg-yellow-500/10 text-yellow-400' },
    approved: { tag: 'Approved', color: 'bg-green-500/20 text-green-300', filterColor: 'hover:bg-green-500/10 text-green-400' },
    revision: { tag: 'Needs Revision', color: 'bg-red-500/20 text-red-300', filterColor: 'hover:bg-red-500/10 text-red-400' },
  };

  const filteredHistory = reportHistory.filter(r => historyFilter === 'all' || r.status === historyFilter);

  const campaignGroups = useMemo(() => {
    const groups: Record<string, ComplianceReport[]> = {};
    filteredHistory.forEach(report => {
        const key = report.campaignName || 'General Scans';
        if (!groups[key]) groups[key] = [];
        groups[key].push(report);
    });
    return Object.entries(groups).sort(([, reportsA], [, reportsB]) => {
        return new Date(reportsB[0].timestamp).getTime() - new Date(reportsA[0].timestamp).getTime();
    });
  }, [filteredHistory]);

  const getStatusCount = (status: ReportStatus | 'all') => {
      if (status === 'all') return reportHistory.length;
      return reportHistory.filter(r => r.status === status).length;
  }

const examplePost = `These new sneakers are a game-changer! So comfy and they look amazing. You absolutely have to try them out for your next run. #newgear #running #style`;

  const renderActiveView = () => {
    return (
       <div className="bg-secondary-dark p-6 rounded-lg border border-gray-700 shadow-lg" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
          <div className="flex justify-between items-center mb-4 border-b border-gray-700">
              <nav className="-mb-px flex space-x-6">
                  <button onClick={() => switchTab('text')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeView === 'text' ? 'border-primary text-primary-light' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500'}`}>Text Post</button>
                  <button onClick={() => switchTab('image')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeView === 'image' ? 'border-primary text-primary-light' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500'}`}>Image Post</button>
                  <button onClick={() => switchTab('video')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeView === 'video' ? 'border-primary text-primary-light' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500'}`}>Video Post</button>
              </nav>
              {(activeView === 'text' || activeView === 'image') && (
                <div className="flex items-center">
                    <span className="text-sm text-gray-400 mr-2">Batch Mode</span>
                    <button onClick={() => setBatchMode(!batchMode)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${batchMode ? 'bg-primary' : 'bg-gray-600'}`}>
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${batchMode ? 'translate-x-6' : 'translate-x-1'}`}/>
                    </button>
                </div>
              )}
          </div>
          {batchMode ? (
             <div className="space-y-4">
               {activeView === 'text' && <textarea ref={textareaRef} value={postContent} onChange={(e) => setPostContent(e.target.value)} placeholder={'Paste multiple captions, one per line...'} rows={8} className="w-full p-3 border border-gray-600 rounded-md bg-dark text-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition disabled:opacity-50" disabled={isLoading} />}
               
               {activeView === 'image' && 
                  <div className="space-y-2">
                    <textarea value={postContent} onChange={(e) => setPostContent(e.target.value)} placeholder={'Enter one caption to be used for all images...'} rows={3} className="w-full p-3 border border-gray-600 rounded-md bg-dark text-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition disabled:opacity-50" />
                    <div className="p-4 text-center border-2 border-dashed border-gray-600 rounded-lg">
                      <PhotoIcon className="mx-auto h-12 w-12 text-gray-500" />
                      <p className="mt-2 text-sm text-gray-400">Drag & drop image files here</p>
                    </div>
                  </div>
               }

               <div className="relative">
                  <label htmlFor="campaign-name-batch" className="block text-sm font-medium text-gray-400 mb-1">Campaign Name (Required for Batch)</label>
                  <input id="campaign-name-batch" type="text" value={campaignName} onChange={handleCampaignNameChange} placeholder="e.g., Q4 Influencer Push" className="w-full p-2 border border-gray-600 rounded-md bg-dark text-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition disabled:opacity-50" disabled={isLoading} autoComplete="off" />
               </div>
               
               <button onClick={() => handleScan()} disabled={isScanDisabled() || !campaignName} className="w-full flex-grow px-6 py-3 flex items-center justify-center gap-3 bg-primary text-white font-bold rounded-md hover:bg-primary-dark disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-lg shadow-lg shadow-primary/20">
                   {getButtonText()}
               </button>

               {queue.length > 0 && <GreenlightQueue queue={queue} setQueue={setQueue} onClear={() => setQueue([])} onViewReport={viewHistoricReport} />}
             </div>
          ) : (
            <div className="space-y-4">
               {activeView !== 'video' && <textarea data-tour="content-input" ref={textareaRef} value={postContent} onChange={(e) => setPostContent(e.target.value)} onKeyDown={(e) => { if (activeView === 'text' && (e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); if (!isScanDisabled()) { handleScan({ isQuickScan: true }); } } }} placeholder={activeView === 'image' ? 'Paste caption for image post here...' : 'Paste influencer post caption here...'} rows={8} className="w-full p-3 border border-gray-600 rounded-md bg-dark text-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition disabled:opacity-50" disabled={isLoading} />}
               
               {activeView === 'image' && (
                  <div>
                    {selectedImageFile ? (
                      <div className="bg-dark p-3 rounded-lg border border-gray-600 flex items-center justify-between animate-fade-in">
                        <div className="flex items-center gap-3">
                            <img src={URL.createObjectURL(selectedImageFile)} alt="Selected preview" className="w-16 h-16 rounded-md object-cover" />
                            <div>
                                <p className="text-sm font-medium text-white truncate">{selectedImageFile.name}</p>
                                <p className="text-xs text-gray-400">{(selectedImageFile.size / 1024).toFixed(1)} KB</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedImageFile(null)} disabled={isLoading} className="text-gray-500 hover:text-white disabled:opacity-50">
                            <XIcon />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                            <button onClick={() => setImageSourceMode('upload')} className={`p-3 rounded-md border-2 ${imageSourceMode === 'upload' ? 'border-primary bg-primary/10' : 'border-gray-600 bg-dark hover:bg-gray-800'}`}>Upload an Image</button>
                            <button onClick={() => setImageSourceMode('generate')} className={`p-3 rounded-md border-2 ${imageSourceMode === 'generate' ? 'border-primary bg-primary/10' : 'border-gray-600 bg-dark hover:bg-gray-800'}`}>Generate an Image</button>
                        </div>
                        {imageSourceMode === 'upload' ? (
                           <div>
                              <label htmlFor="image-upload" className="block text-sm font-medium text-gray-400 mb-2">Upload Image</label>
                              <input id="image-upload" type="file" accept="image/png, image/jpeg, image/webp" onChange={(e) => setSelectedImageFile(e.target.files ? e.target.files[0] : null)} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary-light hover:file:bg-primary/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}/>
                           </div>
                        ) : (
                          <Suspense fallback={<Loader />}><ImageStudio onImageGenerated={handleImageGenerated} /></Suspense>
                        )}
                      </div>
                    )}
                  </div>
                )}
               
               {activeView === 'video' && (
                   <div className="space-y-4">
                      <div className="text-center p-4 border-2 border-dashed border-gray-600 rounded-lg">
                        <VideoCameraIcon className="mx-auto h-12 w-12 text-gray-500" />
                        <p className="mt-2 text-sm text-gray-400">The "Select & Analyze Video" button below will open a file dialog.</p>
                        <p className="text-xs text-gray-500">The video will be automatically transcribed and analyzed in one step.</p>
                        {selectedVideoFile && <p className="text-xs text-gray-400 mt-2 font-semibold">Selected: {selectedVideoFile.name}</p>}
                      </div>
                       <input ref={fileInputRef} id="video-upload" type="file" accept="video/mp4, video/quicktime, video/webm" onChange={(e) => handleVideoUpload(e.target.files ? e.target.files[0] : null)} className="hidden" disabled={isLoading}/>

                      <div className="bg-dark p-3 rounded-md border border-gray-600 min-h-[100px]">
                          <p className="text-sm font-medium text-gray-400">Generated Transcript:</p>
                          {loadingText === 'Transcribing...' ? <Loader text="Transcribing video..." /> : <p className="text-gray-300 whitespace-pre-wrap text-sm mt-2">{videoTranscript || "Transcript will appear here after video processing."}</p>}
                      </div>
                   </div>
               )}
               
               <div className="relative">
                  <label htmlFor="campaign-name" className="block text-sm font-medium text-gray-400 mb-1">Campaign Name (Optional)</label>
                  <input id="campaign-name" type="text" value={campaignName} onChange={handleCampaignNameChange} placeholder="e.g., Q3 Sneaker Launch" className="w-full p-2 border border-gray-600 rounded-md bg-dark text-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition disabled:opacity-50" disabled={isLoading} autoComplete="off" />
                   {campaignSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-dark border border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto">
                          {campaignSuggestions.map(suggestion => (
                              <button key={suggestion} onClick={() => selectCampaign(suggestion)} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700">{suggestion}</button>
                          ))}
                      </div>
                  )}
               </div>

              <div className="flex items-stretch gap-2">
                  <button data-tour="scan-button" onClick={() => handleScan()} disabled={isScanDisabled()} className="flex-grow px-6 py-3 flex items-center justify-center gap-3 bg-primary text-white font-bold rounded-md hover:bg-primary-dark disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-lg shadow-lg shadow-primary/20">
                      {isLoading ? (<><Loader size="sm" /><span>{loadingText}</span></>) : (<span>{getButtonText()}</span>)}
                  </button>
                  {activeView === 'text' && (
                      <button onClick={(e) => { e.stopPropagation(); if (isScanDisabled()) return; handleScan({ isQuickScan: true }); }} disabled={isScanDisabled()} className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-secondary text-white font-semibold rounded-md hover:bg-secondary-light disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors" title="Quick Scan (without campaign name) (Cmd/Ctrl+Enter)">
                          <SparklesIcon /><span>Quick Scan</span>
                      </button>
                  )}
              </div>
           </div>
          )}
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-gray-300">
      {showOnboarding && <OnboardingTour onComplete={handleOnboardingComplete} />}
      <div className="flex flex-col gap-6">
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">Compliance Dashboard</h1>
            <p className="text-gray-400">Analyze content against FTC guidelines, brand safety, and your own custom rules.</p>
        </div>
        
        <Suspense fallback={<div className="w-full h-48 bg-secondary-dark rounded-lg flex items-center justify-center"><Loader /></div>}>
            <Analytics reportHistory={reportHistory} />
        </Suspense>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          <div ref={reportCardRef} className="lg:col-span-2 space-y-6" data-tour="report-card-area">
              {report && !isLoading ? (
                <Suspense fallback={<div className="w-full min-h-[400px] flex items-center justify-center"><Loader /></div>}>
                  <ReportCard report={report} onStatusChange={onUpdateReportStatus} onAcceptRevision={handleAcceptRevision} onDownloadPdf={handleDownloadPdf} isGeneratingPdf={isGeneratingPdf} onAcceptImageRevision={handleAcceptImageRevision} />
                </Suspense>
              ) : (<>{showWelcomeGuide && <WelcomeGuide onStartExample={handleStartExample} />}{renderActiveView()}</>)}
               {error && <div className="mt-4 bg-red-900/50 border border-danger text-red-300 px-4 py-3 rounded-lg" role="alert"><p className="font-bold">Error</p><p>{error}</p></div>}
          </div>
          
          <div className="bg-secondary-dark p-6 rounded-lg border border-gray-700 shadow-lg" data-tour="greenlight-log">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><HistoryIcon /> Greenlight Log</h2>
              <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-400">Filter by status:</span>
                  <div className="flex space-x-1 p-1 bg-dark rounded-md">
                       <button onClick={() => setHistoryFilter('all')} className={`px-2 py-1 text-xs rounded ${historyFilter === 'all' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-700'}`}>All ({getStatusCount('all')})</button>
                      {(Object.keys(statusDisplayConfig) as ReportStatus[]).map(status => {
                          const count = getStatusCount(status);
                          if (count === 0) return null;
                          return (<button key={status} onClick={() => setHistoryFilter(status)} className={`px-2 py-1 text-xs rounded ${historyFilter === status ? `${statusDisplayConfig[status].color} !text-white` : statusDisplayConfig[status].filterColor}`}>{statusDisplayConfig[status].tag} ({count})</button>)
                      })}
                  </div>
              </div>
              <div className="space-y-3">
                  {campaignGroups.length > 0 ? (
                    campaignGroups.map(([campaign, reports]) => (
                        <div key={campaign} className="bg-dark rounded-md border border-gray-800">
                            <button onClick={() => setOpenCampaign(openCampaign === campaign ? null : campaign)} className="w-full flex justify-between items-center p-3 text-left hover:bg-gray-800 rounded-md transition-colors">
                                <span className="font-semibold text-white flex items-center gap-2 truncate"><FolderIcon /> <span className="truncate">{campaign}</span></span>
                                <span className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-xs text-gray-400 bg-secondary-dark px-2 py-0.5 rounded-full">{reports.length} {reports.length === 1 ? 'scan' : 'scans'}</span>
                                    <ChevronDownIcon className={`transform transition-transform ${openCampaign === campaign ? 'rotate-180' : ''} w-5 h-5`} />
                                </span>
                            </button>
                            {openCampaign === campaign && (
                                <div className="p-3 border-t border-gray-700 space-y-3 animate-fade-in">
                                    {reports.map(r => (
                                        <div key={r.id} className={`p-3 bg-secondary-dark rounded-md hover:bg-gray-800 transition-colors group ${r.id === newReportId ? 'highlight-new' : ''}`}>
                                            <div className="flex justify-between items-start">
                                                <button onClick={() => viewHistoricReport(r)} className="text-left flex-grow truncate pr-2">
                                                    <p className="text-sm font-medium text-white truncate">{r.analysisType.charAt(0).toUpperCase() + r.analysisType.slice(1)} Post - {new Date(r.timestamp).toLocaleTimeString()}</p>
                                                    <p className="text-xs text-gray-400 truncate">{new Date(r.timestamp).toLocaleDateString()}</p>
                                                    {r.userName && <p className="text-xs text-gray-500 truncate mt-1">Run by: {r.userName}</p>}
                                                </button>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusDisplayConfig[r.status || 'pending'].color}`}>{statusDisplayConfig[r.status || 'pending'].tag}</span>
                                                    <div className="relative">
                                                        <button onClick={() => setActiveActionMenu(activeActionMenu === r.id ? null : r.id)} className="text-gray-500 hover:text-white transition-colors"><EllipsisHorizontalIcon /></button>
                                                        {activeActionMenu === r.id && (
                                                            <div className="absolute right-0 mt-2 w-48 bg-dark border border-gray-700 rounded-md shadow-lg z-10 animate-fade-in">
                                                                <button onClick={() => viewHistoricReport(r)} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">View Report</button>
                                                                <button onClick={() => handleDownloadPdf(r)} disabled={isGeneratingPdf} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50">{isGeneratingPdf && activeActionMenu === r.id ? 'Generating...' : 'Download Certificate'}</button>
                                                                <button onClick={() => handleShareReport(r)} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">{shareConfirmation && activeActionMenu === r.id ? shareConfirmation : 'Share Certificate'}</button>
                                                                <button onClick={() => handleCreateRevisionRequestLocal(r)} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50">{revisionConfirmation && activeActionMenu === r.id ? revisionConfirmation : 'Request Revision'}</button>
                                                                <button onClick={() => onDeleteReport(r.id)} className="block w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger/20">Delete Report</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                  ) : <p className="text-center text-gray-500 text-sm py-4">No reports match the current filter.</p>}
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;