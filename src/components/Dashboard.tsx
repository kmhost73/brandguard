import React, { useState, useCallback, useEffect } from 'react';
import { analyzePostContent, analyzeVideoContent, analyzeImageContent, transcribeVideo } from '../services/geminiService';
import type { ComplianceReport, CustomRule, ReportStatus } from '../types';
import Loader from './Loader';
import ReportCard from './ReportCard';
import Analytics from './Analytics';
import WelcomeGuide from './WelcomeGuide';
import TestingSandbox from './TestingSandbox'; // Import the new component
import { HistoryIcon, TrashIcon, PlusIcon, ChevronDownIcon, CogIcon, SparklesIcon, TestTubeIcon, DocumentTextIcon } from './icons/Icons';

const examplePost = `Loving my new eco-friendly sneakers! They are so comfy and stylish. Best part? They are made with 100% organic materials. You all have to check them out! #fashion #style`;

type AnalysisType = 'text' | 'video' | 'image';
type DashboardView = 'dashboard' | 'sandbox'; // New view type

const getReportHistory = (): ComplianceReport[] => {
    try {
        const historyJson = localStorage.getItem('brandGuardReportHistory');
        const history = historyJson ? JSON.parse(historyJson) : [];
        // Ensure all reports have a status for backward compatibility
        return history.map((report: any) => ({
            ...report,
            status: report.status || 'pending'
        }));
    } catch (e) { return []; }
};

const getCustomRules = (): CustomRule[] => {
    try {
        const rulesJson = localStorage.getItem('brandGuardCustomRules');
        return rulesJson ? JSON.parse(rulesJson) : [];
    } catch (e) { return []; }
}

const saveCustomRules = (rules: CustomRule[]) => {
    localStorage.setItem('brandGuardCustomRules', JSON.stringify(rules));
}

const getCreativeBrief = (): string => {
    try {
        return localStorage.getItem('brandGuardCreativeBrief') || '';
    } catch (e) { return ''; }
}

const saveCreativeBrief = (brief: string) => {
    localStorage.setItem('brandGuardCreativeBrief', brief);
}


const Dashboard: React.FC = () => {
  const [analysisType, setAnalysisType] = useState<AnalysisType>('text');
  const [postContent, setPostContent] = useState<string>('');
  const [videoTranscript, setVideoTranscript] = useState<string>('');
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reportHistory, setReportHistory] = useState<ComplianceReport[]>([]);
  const [historyFilter, setHistoryFilter] = useState<ReportStatus | 'all'>('all');
  const [customRules, setCustomRules] = useState<CustomRule[]>([]);
  const [newRuleText, setNewRuleText] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [currentView, setCurrentView] = useState<DashboardView>('dashboard'); // State for the view
  const [creativeBrief, setCreativeBrief] = useState<string>('');
  const [showCreativeBrief, setShowCreativeBrief] = useState(false);

  useEffect(() => {
    setReportHistory(getReportHistory());
    setCustomRules(getCustomRules());
    setCreativeBrief(getCreativeBrief());
  }, []);

  const showWelcomeGuide = currentView === 'dashboard' && analysisType === 'text' && !report && !postContent.trim();
  
  const handleStartExample = () => {
    setPostContent(examplePost);
  };

  const handleAnalysisCompletion = (newReport: ComplianceReport) => {
    setReport(newReport);
    const history = getReportHistory();
    const newHistory = [newReport, ...history].slice(0, 10);
    localStorage.setItem('brandGuardReportHistory', JSON.stringify(newHistory));
    setReportHistory(newHistory);
  }

  const handleScan = useCallback(async () => {
    setIsLoading(true);
    setReport(null);
    setError(null);
    try {
      let result;
      if (analysisType === 'text') {
        if (!postContent.trim()) throw new Error("Please enter post content to analyze.");
        result = await analyzePostContent(postContent, customRules, creativeBrief);
      } else if (analysisType === 'video') {
        if (!videoTranscript.trim() || !selectedVideoFile) throw new Error("Please provide a video file and its transcript.");
        result = await analyzeVideoContent(videoTranscript, selectedVideoFile, customRules, creativeBrief);
      } else if (analysisType === 'image') {
        if (!postContent.trim() || !selectedImageFile) throw new Error("Please provide an image and a caption.");
        result = await analyzeImageContent(postContent, selectedImageFile, customRules, creativeBrief);
      }
      if(result) {
        const reportWithStatus: ComplianceReport = { ...result, status: 'pending' };
        handleAnalysisCompletion(reportWithStatus);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [analysisType, postContent, videoTranscript, selectedVideoFile, selectedImageFile, customRules, creativeBrief]);
  
  const handleGenerateTranscript = async () => {
    if (!selectedVideoFile) {
        setError("Please select a video file first.");
        return;
    }
    setIsTranscribing(true);
    setError(null);
    setVideoTranscript('');
    try {
        const transcript = await transcribeVideo(selectedVideoFile);
        setVideoTranscript(transcript);
    } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred during transcription.");
    } finally {
        setIsTranscribing(false);
    }
  };

  const handleStatusChange = (reportId: string, newStatus: ReportStatus) => {
    const updatedHistory = reportHistory.map(r => r.id === reportId ? { ...r, status: newStatus } : r);
    setReportHistory(updatedHistory);
    localStorage.setItem('brandGuardReportHistory', JSON.stringify(updatedHistory));

    if (report?.id === reportId) {
        setReport(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const resetState = (clearInputs = true) => { setReport(null); setError(null); if(clearInputs){ setPostContent(''); setVideoTranscript(''); setSelectedVideoFile(null); setSelectedImageFile(null); } };
  const switchTab = (type: AnalysisType) => { setAnalysisType(type); resetState(); };
  const viewHistoricReport = (historicReport: ComplianceReport) => { setCurrentView('dashboard'); resetState(false); setReport(historicReport); setCreativeBrief(historicReport.creativeBrief || ''); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const deleteReport = (reportId: string) => { const newHistory = reportHistory.filter(r => r.id !== reportId); localStorage.setItem('brandGuardReportHistory', JSON.stringify(newHistory)); setReportHistory(newHistory); if (report?.id === reportId) { setReport(null); } };
  const addRule = () => { if(newRuleText.trim()) { const newRule = { id: crypto.randomUUID(), text: newRuleText.trim() }; const updatedRules = [...customRules, newRule]; setCustomRules(updatedRules); saveCustomRules(updatedRules); setNewRuleText(''); } };
  const deleteRule = (ruleId: string) => { const updatedRules = customRules.filter(r => r.id !== ruleId); setCustomRules(updatedRules); saveCustomRules(updatedRules); };

  const getHistoryTagColor = (type: AnalysisType) => {
    switch(type) {
        case 'text': return 'text-blue-500';
        case 'video': return 'text-purple-500';
        case 'image': return 'text-green-500';
        default: return 'text-gray-500';
    }
  }

  const statusDisplayConfig: Record<ReportStatus, { tag: string, color: string, filterColor: string }> = {
    pending: { tag: 'Pending', color: 'bg-yellow-100 text-yellow-800', filterColor: 'hover:bg-yellow-100 text-yellow-700' },
    approved: { tag: 'Approved', color: 'bg-green-100 text-green-800', filterColor: 'hover:bg-green-100 text-green-700' },
    revision: { tag: 'Needs Revision', color: 'bg-red-100 text-red-800', filterColor: 'hover:bg-red-100 text-red-700' },
  };

  const filteredHistory = reportHistory.filter(r => historyFilter === 'all' || r.status === historyFilter);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">

      {currentView === 'dashboard' && <Analytics reportHistory={reportHistory} />}
      
      <div className="flex justify-between items-center mt-8 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-dark mb-2">
            {currentView === 'dashboard' ? 'Compliance Dashboard' : 'Internal QA Sandbox'}
          </h1>
          <p className="text-slate-light">
            {currentView === 'dashboard' 
              ? 'Analyze content against FTC guidelines, brand safety, and your own custom rules.'
              : 'Execute pre-defined test cases to validate AI performance and accuracy.'}
          </p>
        </div>
        <button 
          onClick={() => setCurrentView(currentView === 'dashboard' ? 'sandbox' : 'dashboard')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-slate hover:bg-gray-50"
        >
          <TestTubeIcon/>
          {currentView === 'dashboard' ? 'Run QA Tests' : 'Return to Dashboard'}
        </button>
      </div>
      
      {currentView === 'sandbox' ? (
        <TestingSandbox />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                
                {showWelcomeGuide && <WelcomeGuide onStartExample={handleStartExample} />}

                <div className="mb-4 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6">
                        <button onClick={() => switchTab('text')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${analysisType === 'text' ? 'border-accent text-accent-dark' : 'border-transparent text-slate hover:text-slate-dark hover:border-gray-300'}`}>Text Post</button>
                        <button onClick={() => switchTab('image')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${analysisType === 'image' ? 'border-accent text-accent-dark' : 'border-transparent text-slate hover:text-slate-dark hover:border-gray-300'}`}>Image Post</button>
                        <button onClick={() => switchTab('video')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${analysisType === 'video' ? 'border-accent text-accent-dark' : 'border-transparent text-slate hover:text-slate-dark hover:border-gray-300'}`}>Video Post</button>
                    </nav>
                </div>

                 <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <button onClick={() => setShowCreativeBrief(!showCreativeBrief)} className="w-full flex justify-between items-center text-left text-lg font-semibold text-slate-dark">
                            <span className="flex items-center gap-2"><DocumentTextIcon/> Creative Brief Analysis</span>
                            <ChevronDownIcon className={`transform transition-transform ${showCreativeBrief ? 'rotate-180' : ''}`} />
                        </button>
                        {showCreativeBrief && (
                            <div className="mt-4">
                                <textarea
                                    value={creativeBrief}
                                    onChange={(e) => {
                                        setCreativeBrief(e.target.value);
                                        saveCreativeBrief(e.target.value);
                                    }}
                                    placeholder="Paste your campaign's creative brief here. The AI will check for adherence to tone, key messages, and CTAs."
                                    className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent"
                                />
                                <p className="text-xs text-slate-light mt-1">This brief persists across sessions and will be applied to all subsequent analyses.</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <button onClick={() => setShowRules(!showRules)} className="w-full flex justify-between items-center text-left text-lg font-semibold text-slate-dark">
                            <span className="flex items-center gap-2"><CogIcon/> Custom Rules Engine</span>
                            <ChevronDownIcon className={`transform transition-transform ${showRules ? 'rotate-180' : ''}`} />
                        </button>
                        {showRules && (
                            <div className="mt-4 space-y-4">
                                <div className="flex gap-2">
                                    <input type="text" value={newRuleText} onChange={(e) => setNewRuleText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addRule()} placeholder="e.g., Must include #BrandPartner" className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent" />
                                    <button onClick={addRule} className="px-4 py-2 bg-slate text-white rounded-md hover:bg-slate-dark flex items-center gap-1"><PlusIcon/> Add</button>
                                </div>
                                {customRules.length > 0 ? (
                                    <ul className="space-y-2">{customRules.map(rule => (<li key={rule.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-md border"><p className="text-sm text-slate-dark">{rule.text}</p><button onClick={() => deleteRule(rule.id)} className="p-1 text-gray-400 hover:text-danger"><TrashIcon/></button></li>))}</ul>
                                ) : (<p className="text-sm text-slate-light text-center py-2">No custom rules defined.</p>)}
                            </div>
                        )}
                    </div>
                </div>

                {analysisType === 'text' && (
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <textarea value={postContent} onChange={(e) => setPostContent(e.target.value)} placeholder="Paste influencer post caption here..." className="w-full h-40 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent" disabled={isLoading} />
                        <div className="mt-4 flex flex-col sm:flex-row items-center justify-end gap-4">
                            <button onClick={handleScan} disabled={isLoading} className="w-full sm:w-auto px-6 py-3 bg-accent text-white font-semibold rounded-md shadow-sm hover:bg-accent-dark disabled:bg-gray-400">{isLoading ? 'Analyzing...' : 'Scan Post'}</button>
                        </div>
                    </div>
                )}
                
                {analysisType === 'image' && (
                    <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
                        <div>
                            <label htmlFor="image-upload" className="block text-sm font-medium text-slate-dark mb-1">Step 1: Choose Image File</label>
                            <input id="image-upload" type="file" accept="image/png, image/jpeg, image/webp" onChange={(e) => setSelectedImageFile(e.target.files ? e.target.files[0] : null)} className="block w-full text-sm text-slate-light file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-accent-dark hover:file:bg-accent/20" disabled={isLoading}/>
                            {selectedImageFile && <p className="text-xs text-slate-light mt-1">Selected: {selectedImageFile.name}</p>}
                        </div>
                        <div>
                            <label htmlFor="image-caption" className="block text-sm font-medium text-slate-dark mb-1">Step 2: Add Caption</label>
                            <textarea id="image-caption" value={postContent} onChange={(e) => setPostContent(e.target.value)} placeholder="Paste the caption for the image here..." className="w-full h-28 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent" disabled={isLoading} />
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button onClick={handleScan} disabled={isLoading || !selectedImageFile || !postContent.trim()} className="w-full sm:w-auto px-6 py-3 bg-accent text-white font-semibold rounded-md shadow-sm hover:bg-accent-dark disabled:bg-gray-400 disabled:cursor-not-allowed">
                                {isLoading ? 'Analyzing...' : 'Scan Image & Caption'}
                            </button>
                        </div>
                    </div>
                )}
                
                {analysisType === 'video' && (
                    <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
                        <div>
                            <label htmlFor="video-upload" className="block text-sm font-medium text-slate-dark mb-1">Step 1: Choose Video File</label>
                            <input id="video-upload" type="file" accept="video/mp4, video/quicktime, video/webm" onChange={(e) => { setSelectedVideoFile(e.target.files ? e.target.files[0] : null); setVideoTranscript(''); }} className="block w-full text-sm text-slate-light file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-accent-dark hover:file:bg-accent/20" disabled={isLoading || isTranscribing} />
                            {selectedVideoFile && <p className="text-xs text-slate-light mt-1">Selected: {selectedVideoFile.name}</p>}
                        </div>
                        <div>
                            <label htmlFor="video-transcript" className="block text-sm font-medium text-slate-dark mb-1">Step 2: Generate or Provide Transcript</label>
                            <button onClick={handleGenerateTranscript} disabled={!selectedVideoFile || isTranscribing || isLoading} className="w-full mb-2 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-slate text-slate hover:bg-slate-dark/5 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"><SparklesIcon/>{isTranscribing ? 'Generating...' : 'Generate Transcript with AI'}</button>
                            <textarea id="video-transcript" value={videoTranscript} onChange={(e) => setVideoTranscript(e.target.value)} placeholder={isTranscribing ? "AI is working..." : "Video transcript will appear here..."} className="w-full h-28 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent" disabled={isLoading || isTranscribing} />
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button onClick={handleScan} disabled={isLoading || !selectedVideoFile || !videoTranscript.trim()} className="w-full sm:w-auto px-6 py-3 bg-accent text-white font-semibold rounded-md shadow-sm hover:bg-accent-dark disabled:bg-gray-400 disabled:cursor-not-allowed">{isLoading ? 'Analyzing...' : 'Scan Video & Transcript'}</button>
                        </div>
                    </div>
                )}
                
                <div className="mt-8">
                    {isLoading && <Loader />}
                    {error && <div className="bg-red-100 border-l-4 border-danger text-red-700 p-4 rounded-md" role="alert"><p className="font-bold">Error</p><p>{error}</p></div>}
                    {report && <ReportCard report={report} onStatusChange={handleStatusChange} />}
                </div>
            </div>
            
            <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm border sticky top-24">
                <h2 className="text-xl font-bold text-slate-dark mb-4 flex items-center gap-2"><HistoryIcon /> Analysis History</h2>
                <div className="flex items-center gap-2 mb-4 border-b pb-3">
                    <button onClick={() => setHistoryFilter('all')} className={`px-2.5 py-1 text-sm font-medium rounded-full transition-colors ${historyFilter === 'all' ? 'bg-slate text-white' : 'text-slate-light hover:bg-gray-100'}`}>All</button>
                    {(Object.keys(statusDisplayConfig) as ReportStatus[]).map(status => (
                        <button key={status} onClick={() => setHistoryFilter(status)} className={`px-2.5 py-1 text-sm font-medium rounded-full transition-colors ${historyFilter === status ? statusDisplayConfig[status].color : `text-slate-light ${statusDisplayConfig[status].filterColor}`}`}>{statusDisplayConfig[status].tag}</button>
                    ))}
                </div>
                {filteredHistory.length > 0 ? (
                <ul className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {filteredHistory.map((r) => (
                    <li key={r.id} className="p-3 rounded-md border border-gray-200 hover:bg-gray-50 group">
                        <div className="flex justify-between items-start">
                        <div>
                            <button onClick={() => viewHistoricReport(r)} className="text-left">
                            <div className="flex items-center gap-2 flex-wrap">
                                    <p className={`text-xs font-bold uppercase ${getHistoryTagColor(r.analysisType)}`}>{r.analysisType} Analysis</p>
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusDisplayConfig[r.status || 'pending'].color}`}>{statusDisplayConfig[r.status || 'pending'].tag}</span>
                            </div>
                            <p className="text-sm text-slate-light group-hover:text-accent-dark mt-1">{new Date(r.timestamp).toLocaleString()}</p>
                            <p className="text-xs text-slate-light mt-1 truncate max-w-48">{r.summary}</p>
                            </button>
                        </div>
                        <button onClick={() => deleteReport(r.id)} className="p-1 text-gray-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity">
                            <TrashIcon />
                        </button>
                        </div>
                    </li>
                    ))}
                </ul>
                ) : (
                <p className="text-sm text-slate-light text-center py-4">No reports match the current filter.</p>
                )}
            </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;