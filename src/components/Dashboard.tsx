import React, { useState, useCallback, useEffect, useRef, lazy, Suspense, useMemo } from 'react';
import { analyzePostContent, analyzeVideoContent, analyzeImageContent, transcribeVideo } from '../services/geminiService';
import type { ComplianceReport, CustomRule, ReportStatus, MainView } from '../types';
import Loader from './Loader';
import Analytics from './Analytics';
import WelcomeGuide from './WelcomeGuide';
import { HistoryIcon, FilmIcon, EllipsisHorizontalIcon, TestTubeIcon, FolderIcon, ChevronDownIcon } from './icons/Icons';

const ReportCard = lazy(() => import('./ReportCard'));

type AnalysisType = 'text' | 'video' | 'image';
type LoadingStatus = 'idle' | 'transcribing' | 'analyzing';

interface DashboardProps {
  activeWorkspaceId: string;
  customRules: CustomRule[];
  onNavigate: (view: MainView) => void;
  onCreateCertificate: (report: ComplianceReport) => string;
}

const getReportHistory = (workspaceId: string): ComplianceReport[] => {
    try {
        const historyJson = localStorage.getItem(`brandGuardReportHistory_${workspaceId}`);
        if (!historyJson) return [];
        const history = JSON.parse(historyJson);
        return history.map((report: any) => ({
            ...report,
            status: report.status || 'pending'
        }));
    } catch (e) { return []; }
};

const saveReportHistory = (workspaceId: string, history: ComplianceReport[]) => {
    localStorage.setItem(`brandGuardReportHistory_${workspaceId}`, JSON.stringify(history));
}

const examplePost = `These new sneakers are a game-changer! So comfy and they look amazing. You absolutely have to try them out for your next run. #newgear #running #style`;


const Dashboard: React.FC<DashboardProps> = ({ activeWorkspaceId, customRules, onNavigate, onCreateCertificate }) => {
  const [analysisType, setAnalysisType] = useState<AnalysisType>('text');
  const [postContent, setPostContent] = useState<string>('');
  const [campaignName, setCampaignName] = useState<string>('');
  const [campaignSuggestions, setCampaignSuggestions] = useState<string[]>([]);
  const [videoTranscript, setVideoTranscript] = useState<string>('');
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>('idle');
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reportHistory, setReportHistory] = useState<ComplianceReport[]>([]);
  const [historyFilter, setHistoryFilter] = useState<ReportStatus | 'all'>('all');
  const [newReportId, setNewReportId] = useState<string | null>(null);
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  const [shareConfirmation, setShareConfirmation] = useState('');
  const [openCampaign, setOpenCampaign] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('Analyzing...');
  const reportCardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadingIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    setReportHistory(getReportHistory(activeWorkspaceId));
    setReport(null); // Clear active report when switching workspace
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (report && report.id === newReportId) {
      reportCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // When a new report is created, automatically open its campaign group
      setOpenCampaign(report.campaignName || 'General Scans');
      const timer = setTimeout(() => {
        setNewReportId(null);
      }, 2000); 
      return () => clearTimeout(timer);
    }
  }, [report, newReportId]);
  
  useEffect(() => {
    let loadingMessages: string[];

    if (analysisType === 'video') {
        loadingMessages = [
            'Analyzing video frames...',
            'Checking for visual brand representation...',
            'Analyzing audio from transcript...',
            'Scanning for spoken disclosures...',
            'Finalizing multimodal report...',
        ];
    } else if (analysisType === 'image') {
        loadingMessages = [
            'Analyzing image composition...',
            'Checking for visual brand safety...',
            'Scanning caption text...',
            'Cross-referencing custom rules...',
            'Generating image compliance report...',
        ];
    } else { // text
        loadingMessages = [
            'Warming up the Greenlight Engine...',
            'Scanning for FTC compliance...',
            'Checking brand safety protocols...',
            'Cross-referencing custom rules...',
            'Generating compliance report...',
            'Finalizing insights...',
        ];
    }

    if (loadingStatus === 'analyzing') {
        let index = 0;
        setLoadingMessage(loadingMessages[0]);
        loadingIntervalRef.current = window.setInterval(() => {
            index = (index + 1) % loadingMessages.length;
            setLoadingMessage(loadingMessages[index]);
        }, 2500);
    } else {
        if (loadingIntervalRef.current) {
            clearInterval(loadingIntervalRef.current);
            loadingIntervalRef.current = null;
        }
    }

    return () => {
        if (loadingIntervalRef.current) {
            clearInterval(loadingIntervalRef.current);
        }
    };
  }, [loadingStatus, analysisType]);

  const handleAnalysisCompletion = useCallback((newReport: Omit<ComplianceReport, 'workspaceId'>) => {
    const reportWithWorkspace = { ...newReport, workspaceId: activeWorkspaceId };
    const reportWithInitialStatus = { ...reportWithWorkspace, status: newReport.recommendedStatus || 'pending' };
    setReport(reportWithInitialStatus);
    setNewReportId(reportWithInitialStatus.id);
    const history = getReportHistory(activeWorkspaceId);
    const newHistory = [reportWithInitialStatus, ...history];
    saveReportHistory(activeWorkspaceId, newHistory);
    setReportHistory(newHistory);
  }, [activeWorkspaceId]);

  const handleInsightReceived = useCallback((insight: string) => {
      setReport(currentReport => {
        if (!currentReport) return null;
        const updatedReport = { ...currentReport, strategicInsight: insight };
        
        // Also update the history
        setReportHistory(currentHistory => {
            const newHistory = currentHistory.map(r => r.id === updatedReport.id ? updatedReport : r);
            saveReportHistory(activeWorkspaceId, newHistory);
            return newHistory;
        });

        return updatedReport;
      });
  }, [activeWorkspaceId]);

  const handleVideoUpload = useCallback(async (file: File | null) => {
    if (file) {
        setSelectedVideoFile(file);
        setLoadingStatus('transcribing');
        setError(null);
        setReport(null);
        setVideoTranscript('');
        try {
            const transcript = await transcribeVideo(file);
            setVideoTranscript(transcript);

            setLoadingStatus('analyzing');
            const result = await analyzeVideoContent(transcript, campaignName, file, customRules, handleInsightReceived);
            handleAnalysisCompletion(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred during video processing.");
        } finally {
            setLoadingStatus('idle');
        }
    }
  }, [customRules, handleAnalysisCompletion, handleInsightReceived, campaignName]);

  const showWelcomeGuide = !report && !postContent.trim() && !selectedImageFile && !selectedVideoFile && loadingStatus === 'idle';
  
  const handleStartExample = () => {
    setAnalysisType('text');
    setPostContent(examplePost);
  };

  const handleScan = useCallback(async (contentOverride?: string, isRescan = false) => {
    setLoadingStatus('analyzing');
    setReport(null);
    setError(null);
    try {
      let result;
      const contentToScan = contentOverride !== undefined ? contentOverride : postContent;
      
      if (analysisType === 'text') {
        if (!contentToScan.trim()) throw new Error("Please enter post content to analyze.");
        result = await analyzePostContent(contentToScan, campaignName, customRules, isRescan, handleInsightReceived);
      } else if (analysisType === 'video') {
         if (fileInputRef.current) {
            fileInputRef.current.click();
         }
         return;
      } else if (analysisType === 'image') {
        if (!contentToScan.trim() || !selectedImageFile) throw new Error("Please provide an image and a caption.");
        result = await analyzeImageContent(contentToScan, campaignName, selectedImageFile, customRules, handleInsightReceived);
      }
      if(result) {
        handleAnalysisCompletion(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
       if (analysisType !== 'video') {
        setLoadingStatus('idle');
      }
    }
  }, [analysisType, postContent, campaignName, selectedImageFile, customRules, handleAnalysisCompletion, handleInsightReceived]);
  
  const handleStatusChange = (reportId: string, newStatus: ReportStatus) => {
    const updatedHistory = reportHistory.map(r => r.id === reportId ? { ...r, status: newStatus } : r);
    setReportHistory(updatedHistory);
    saveReportHistory(activeWorkspaceId, updatedHistory);

    if (report?.id === reportId) {
        setReport(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };
  
  const handleAcceptRevision = (revisedContent: string) => {
      setPostContent(revisedContent);
      setReport(null);
      handleScan(revisedContent, true);
  };

  const resetState = (clearInputs = true) => {
    setReport(null);
    setError(null);
    if (clearInputs) {
      setPostContent('');
      setCampaignName('');
      setVideoTranscript('');
      setSelectedVideoFile(null);
      setSelectedImageFile(null);
    }
  };
  const switchTab = (type: AnalysisType) => {
    setAnalysisType(type);
    resetState();
  };
  const viewHistoricReport = (historicReport: ComplianceReport) => {
    setActiveActionMenu(null);
    resetState(false);
    setReport(historicReport);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const deleteReport = (reportId: string) => {
    setActiveActionMenu(null);
    const newHistory = reportHistory.filter(r => r.id !== reportId);
    saveReportHistory(activeWorkspaceId, newHistory);
    setReportHistory(newHistory);
    if (report?.id === reportId) {
      setReport(null);
    }
  };
  
  const handleShareReport = (reportToShare: ComplianceReport) => {
    setActiveActionMenu(null);
    const confirmation = onCreateCertificate(reportToShare);
    setShareConfirmation(confirmation);
    setTimeout(() => setShareConfirmation(''), 2000);
  };

  const isLoading = loadingStatus !== 'idle';
  const getButtonText = () => {
    if (report?.suggestedRevision && postContent === report.suggestedRevision) return 'Verifying the fix...';
    if (loadingStatus === 'analyzing') return loadingMessage;
    if (loadingStatus === 'transcribing') return 'Transcribing video...';
    if (analysisType === 'video') return 'Select & Analyze Video';
    if (analysisType === 'image') return 'Scan Image & Caption';
    return 'Scan Post';
  }
  
  const isScanDisabled = () => {
      if (isLoading) return true;
      if (analysisType === 'text' && !postContent.trim()) return true;
      if (analysisType === 'image' && (!postContent.trim() || !selectedImageFile)) return true;
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
        if (!groups[key]) {
            groups[key] = [];
        }
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

  return (
    <>
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-gray-300">

      <Analytics reportHistory={reportHistory} />
      
      <div className="flex justify-between items-center mt-8 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Compliance Dashboard
          </h1>
          <p className="text-gray-400">
            Analyze content against FTC guidelines, brand safety, and your own custom rules.
          </p>
        </div>
        <button 
          onClick={() => onNavigate('sandbox')}
          className="flex items-center gap-2 px-4 py-2 bg-secondary-dark border border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-300 hover:bg-gray-700"
        >
          <TestTubeIcon/>
          Run QA Tests
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div ref={reportCardRef} className="lg:col-span-2 space-y-6">
              
              {report && !isLoading ? (
                <Suspense fallback={<div className="w-full min-h-[400px] flex items-center justify-center"><Loader /></div>}>
                  <ReportCard report={report} onStatusChange={handleStatusChange} onAcceptRevision={handleAcceptRevision} />
                </Suspense>
              ) : (
                <>
                  {showWelcomeGuide && <WelcomeGuide onStartExample={handleStartExample} />}

                  <div className="bg-secondary-dark p-6 rounded-lg border border-gray-700 shadow-lg">
                    <div className="mb-4 border-b border-gray-700">
                        <nav className="-mb-px flex space-x-6">
                            <button onClick={() => switchTab('text')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${analysisType === 'text' ? 'border-primary text-primary-light' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500'}`}>Text Post</button>
                            <button onClick={() => switchTab('image')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${analysisType === 'image' ? 'border-primary text-primary-light' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500'}`}>Image Post</button>
                            <button onClick={() => switchTab('video')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${analysisType === 'video' ? 'border-primary text-primary-light' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500'}`}>Video Post</button>
                        </nav>
                    </div>

                     <div className="space-y-4">
                         {analysisType !== 'video' && <textarea value={postContent} onChange={(e) => setPostContent(e.target.value)} placeholder={analysisType === 'image' ? 'Paste caption for image post here...' : 'Paste influencer post caption here...'} rows={8} className="w-full p-3 border border-gray-600 rounded-md bg-dark text-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition disabled:opacity-50" disabled={isLoading} />}
                         {analysisType === 'image' && (
                             <div>
                                <label htmlFor="image-upload" className="block text-sm font-medium text-gray-400 mb-2">Upload Image</label>
                                <input id="image-upload" type="file" accept="image/png, image/jpeg, image/webp" onChange={(e) => setSelectedImageFile(e.target.files ? e.target.files[0] : null)} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary-light hover:file:bg-primary/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}/>
                                 {selectedImageFile && <p className="text-xs text-gray-500 mt-2">Selected: {selectedImageFile.name}</p>}
                             </div>
                         )}
                         {analysisType === 'video' && (
                             <div className="space-y-4">
                                <div className="text-center p-4 border-2 border-dashed border-gray-600 rounded-lg">
                                  <FilmIcon />
                                  <p className="mt-2 text-sm text-gray-400">The "Select & Analyze Video" button below will open a file dialog.</p>
                                  <p className="text-xs text-gray-500">The video will be automatically transcribed and analyzed in one step.</p>
                                  {selectedVideoFile && <p className="text-xs text-gray-400 mt-2 font-semibold">Selected: {selectedVideoFile.name}</p>}
                                </div>
                                 <input ref={fileInputRef} id="video-upload" type="file" accept="video/mp4, video/quicktime, video/webm" onChange={(e) => handleVideoUpload(e.target.files ? e.target.files[0] : null)} className="hidden" disabled={isLoading}/>

                                <div className="bg-dark p-3 rounded-md border border-gray-600 min-h-[100px]">
                                    <p className="text-sm font-medium text-gray-400">Generated Transcript:</p>
                                    {loadingStatus === 'transcribing' 
                                        ? <Loader text="Transcribing video..." />
                                        : <p className="text-gray-300 whitespace-pre-wrap text-sm mt-2">{videoTranscript || "Transcript will appear here after video processing."}</p>}
                                </div>
                             </div>
                         )}
                         
                         <div className="relative">
                            <label htmlFor="campaign-name" className="block text-sm font-medium text-gray-400 mb-1">Campaign Name (Optional)</label>
                            <input 
                                id="campaign-name" 
                                type="text" 
                                value={campaignName}
                                onChange={handleCampaignNameChange}
                                placeholder="e.g., Q3 Sneaker Launch"
                                className="w-full p-2 border border-gray-600 rounded-md bg-dark text-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition disabled:opacity-50"
                                disabled={isLoading}
                                autoComplete="off"
                            />
                             {campaignSuggestions.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-dark border border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                    {campaignSuggestions.map(suggestion => (
                                        <button key={suggestion} onClick={() => selectCampaign(suggestion)} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700">
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            )}
                         </div>

                         <button onClick={() => handleScan()} disabled={isScanDisabled()} className="w-full px-6 py-4 bg-primary text-white font-bold rounded-md hover:bg-primary-dark disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-3">
                             {isLoading && loadingStatus !== 'transcribing' && <Loader size="sm" />}
                             <span key={loadingStatus === 'analyzing' ? loadingMessage : 'static'} className="inline-block animate-fade-in">
                                {getButtonText()}
                             </span>
                         </button>
                     </div>
                  </div>
                </>
              )}
               {error && <div className="mt-4 bg-red-900/50 border border-danger text-red-300 px-4 py-3 rounded-lg" role="alert"><p className="font-bold">Error</p><p>{error}</p></div>}
          </div>
          
          <div className="bg-secondary-dark p-6 rounded-lg border border-gray-700 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><HistoryIcon /> Greenlight Log</h2>
              <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-400">Filter by status:</span>
                  <div className="flex space-x-1 p-1 bg-dark rounded-md">
                       <button onClick={() => setHistoryFilter('all')} className={`px-2 py-1 text-xs rounded ${historyFilter === 'all' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                           All ({getStatusCount('all')})
                      </button>
                      {(Object.keys(statusDisplayConfig) as ReportStatus[]).map(status => {
                          const count = getStatusCount(status);
                          if (count === 0) return null;
                          return (
                              <button key={status} onClick={() => setHistoryFilter(status)} className={`px-2 py-1 text-xs rounded ${historyFilter === status ? `${statusDisplayConfig[status].color} !text-white` : statusDisplayConfig[status].filterColor}`}>
                                  {statusDisplayConfig[status].tag} ({count})
                              </button>
                          )
                      })}
                  </div>
              </div>
              <div className="space-y-3">
                  {campaignGroups.length > 0 ? (
                    campaignGroups.map(([campaign, reports]) => (
                        <div key={campaign} className="bg-dark rounded-md border border-gray-800">
                            <button 
                                onClick={() => setOpenCampaign(openCampaign === campaign ? null : campaign)}
                                className="w-full flex justify-between items-center p-3 text-left hover:bg-gray-800 rounded-md transition-colors"
                            >
                                <span className="font-semibold text-white flex items-center gap-2 truncate">
                                    <FolderIcon /> 
                                    <span className="truncate">{campaign}</span>
                                </span>
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
                                                        <button onClick={() => setActiveActionMenu(activeActionMenu === r.id ? null : r.id)} className="text-gray-500 hover:text-white transition-colors">
                                                            <EllipsisHorizontalIcon />
                                                        </button>
                                                        {activeActionMenu === r.id && (
                                                            <div className="absolute right-0 mt-2 w-48 bg-dark border border-gray-700 rounded-md shadow-lg z-10 animate-fade-in">
                                                                <button onClick={() => viewHistoricReport(r)} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">View Report</button>
                                                                <button onClick={() => handleShareReport(r)} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">{shareConfirmation && activeActionMenu === r.id ? shareConfirmation : 'Share Certificate'}</button>
                                                                <button onClick={() => deleteReport(r.id)} className="block w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger/20">Delete Report</button>
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
    </>
  );
};

export default Dashboard;