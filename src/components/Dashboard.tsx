import React, { useState, useCallback, useEffect } from 'react';
import { analyzePostContent, analyzeVideoContent, analyzeImageContent, transcribeVideo } from '../services/geminiService';
import type { ComplianceReport, CustomRule } from '../types';
import Loader from './Loader';
import ReportCard from './ReportCard';
import { HistoryIcon, TrashIcon, PlusIcon, ChevronDownIcon, CogIcon, SparklesIcon } from './icons/Icons';

const examplePost = `Loving my new eco-friendly sneakers! They are so comfy and stylish. Best part? They are made with 100% organic materials. You all have to check them out! #fashion #style`;

type AnalysisType = 'text' | 'video' | 'image';

const saveReportToHistory = (report: ComplianceReport) => {
  const history = getReportHistory();
  const newHistory = [report, ...history].slice(0, 10);
  // For privacy and storage efficiency, don't save large media files in history
  const historyToStore = newHistory.map(({ sourceMedia, ...rest }) => rest);
  localStorage.setItem('brandGuardReportHistory', JSON.stringify(historyToStore));
};

const getReportHistory = (): ComplianceReport[] => {
    try {
        const historyJson = localStorage.getItem('brandGuardReportHistory');
        return historyJson ? JSON.parse(historyJson) : [];
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
  const [customRules, setCustomRules] = useState<CustomRule[]>([]);
  const [newRuleText, setNewRuleText] = useState('');
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    setReportHistory(getReportHistory());
    setCustomRules(getCustomRules());
  }, []);

  const handleAnalysisCompletion = (newReport: ComplianceReport) => {
    setReport(newReport);
    saveReportToHistory(newReport);
    setReportHistory(getReportHistory());
  }

  const handleScan = useCallback(async () => {
    setIsLoading(true);
    setReport(null);
    setError(null);
    try {
      let result;
      if (analysisType === 'text') {
        if (!postContent.trim()) throw new Error("Please enter post content to analyze.");
        result = await analyzePostContent(postContent, customRules);
      } else if (analysisType === 'video') {
        if (!videoTranscript.trim() || !selectedVideoFile) throw new Error("Please provide a video file and its transcript.");
        result = await analyzeVideoContent(videoTranscript, selectedVideoFile, customRules);
      } else if (analysisType === 'image') {
        if (!postContent.trim() || !selectedImageFile) throw new Error("Please provide an image and a caption.");
        result = await analyzeImageContent(postContent, selectedImageFile, customRules);
      }
      if(result) handleAnalysisCompletion(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [analysisType, postContent, videoTranscript, selectedVideoFile, selectedImageFile, customRules]);
  
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

  const resetState = (clearInputs = true) => { setReport(null); setError(null); if(clearInputs){ setPostContent(''); setVideoTranscript(''); setSelectedVideoFile(null); setSelectedImageFile(null); } };
  const switchTab = (type: AnalysisType) => { setAnalysisType(type); resetState(); };
  const viewHistoricReport = (historicReport: ComplianceReport) => { resetState(false); setReport(historicReport); window.scrollTo({ top: 0, behavior: 'smooth' }); };
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

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Compliance Dashboard</h1>
              <p className="text-gray-600">Analyze content against FTC guidelines, brand safety, and your own custom rules.</p>
            </div>
            
            <div className="mb-4 border-b border-gray-200">
                <nav className="-mb-px flex space-x-6">
                    <button onClick={() => switchTab('text')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${analysisType === 'text' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Text Post</button>
                    <button onClick={() => switchTab('image')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${analysisType === 'image' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Image Post</button>
                    <button onClick={() => switchTab('video')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${analysisType === 'video' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Video Post</button>
                </nav>
            </div>
            
            <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
                <button onClick={() => setShowRules(!showRules)} className="w-full flex justify-between items-center text-left text-lg font-semibold text-gray-700">
                    <span className="flex items-center gap-2"><CogIcon/> Custom Rules Engine</span>
                    <ChevronDownIcon className={`transform transition-transform ${showRules ? 'rotate-180' : ''}`} />
                </button>
                {showRules && (
                    <div className="mt-4 space-y-4">
                        <div className="flex gap-2">
                            <input type="text" value={newRuleText} onChange={(e) => setNewRuleText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addRule()} placeholder="e.g., Must include #BrandPartner" className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary" />
                            <button onClick={addRule} className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-primary flex items-center gap-1"><PlusIcon/> Add</button>
                        </div>
                        {customRules.length > 0 ? (
                            <ul className="space-y-2">{customRules.map(rule => (<li key={rule.id} className="flex justify-between items-center bg-white p-2 rounded-md border"><p className="text-sm text-gray-800">{rule.text}</p><button onClick={() => deleteRule(rule.id)} className="p-1 text-gray-400 hover:text-red-500"><TrashIcon/></button></li>))}</ul>
                        ) : (<p className="text-sm text-gray-500 text-center py-2">No custom rules defined.</p>)}
                    </div>
                )}
            </div>

            {analysisType === 'text' && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <textarea value={postContent} onChange={(e) => setPostContent(e.target.value)} placeholder="Paste influencer post caption here..." className="w-full h-40 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary" disabled={isLoading} />
                    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <button onClick={() => setPostContent(examplePost)} disabled={isLoading} className="text-sm text-primary hover:underline disabled:text-gray-400">Load Example</button>
                        <button onClick={handleScan} disabled={isLoading} className="w-full sm:w-auto px-6 py-3 bg-primary text-white font-semibold rounded-md shadow-sm hover:bg-secondary disabled:bg-gray-400">{isLoading ? 'Analyzing...' : 'Scan Post'}</button>
                    </div>
                </div>
            )}
            
            {analysisType === 'image' && (
                <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                    <div>
                        <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700 mb-1">Step 1: Choose Image File</label>
                        <input id="image-upload" type="file" accept="image/png, image/jpeg, image/webp" onChange={(e) => setSelectedImageFile(e.target.files ? e.target.files[0] : null)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" disabled={isLoading}/>
                        {selectedImageFile && <p className="text-xs text-gray-500 mt-1">Selected: {selectedImageFile.name}</p>}
                    </div>
                    <div>
                        <label htmlFor="image-caption" className="block text-sm font-medium text-gray-700 mb-1">Step 2: Add Caption</label>
                        <textarea id="image-caption" value={postContent} onChange={(e) => setPostContent(e.target.value)} placeholder="Paste the caption for the image here..." className="w-full h-28 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary" disabled={isLoading} />
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button onClick={handleScan} disabled={isLoading || !selectedImageFile || !postContent.trim()} className="w-full sm:w-auto px-6 py-3 bg-primary text-white font-semibold rounded-md shadow-sm hover:bg-secondary disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {isLoading ? 'Analyzing...' : 'Scan Image & Caption'}
                        </button>
                    </div>
                </div>
            )}
            
            {analysisType === 'video' && (
                 <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                    <div>
                        <label htmlFor="video-upload" className="block text-sm font-medium text-gray-700 mb-1">Step 1: Choose Video File</label>
                        <input id="video-upload" type="file" accept="video/mp4, video/quicktime, video/webm" onChange={(e) => { setSelectedVideoFile(e.target.files ? e.target.files[0] : null); setVideoTranscript(''); }} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" disabled={isLoading || isTranscribing} />
                         {selectedVideoFile && <p className="text-xs text-gray-500 mt-1">Selected: {selectedVideoFile.name}</p>}
                    </div>
                    <div>
                         <label htmlFor="video-transcript" className="block text-sm font-medium text-gray-700 mb-1">Step 2: Generate or Provide Transcript</label>
                         <button onClick={handleGenerateTranscript} disabled={!selectedVideoFile || isTranscribing || isLoading} className="w-full mb-2 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-secondary text-secondary hover:bg-secondary/10 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"><SparklesIcon/>{isTranscribing ? 'Generating...' : 'Generate Transcript with AI'}</button>
                         <textarea id="video-transcript" value={videoTranscript} onChange={(e) => setVideoTranscript(e.target.value)} placeholder={isTranscribing ? "AI is working..." : "Video transcript will appear here..."} className="w-full h-28 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary" disabled={isLoading || isTranscribing} />
                    </div>
                     <div className="mt-4 flex justify-end">
                        <button onClick={handleScan} disabled={isLoading || !selectedVideoFile || !videoTranscript.trim()} className="w-full sm:w-auto px-6 py-3 bg-primary text-white font-semibold rounded-md shadow-sm hover:bg-secondary disabled:bg-gray-400 disabled:cursor-not-allowed">{isLoading ? 'Analyzing...' : 'Scan Video & Transcript'}</button>
                    </div>
                 </div>
            )}
            
            <div className="mt-8">
                {isLoading && <Loader />}
                {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert"><p className="font-bold">Error</p><p>{error}</p></div>}
                {report && <ReportCard report={report} />}
            </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md sticky top-24">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><HistoryIcon /> Analysis History</h2>
            {reportHistory.length > 0 ? (
              <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {reportHistory.map((r) => (
                  <li key={r.id} className="p-3 rounded-md border border-gray-200 hover:bg-gray-50 group">
                    <div className="flex justify-between items-start">
                      <div>
                        <button onClick={() => viewHistoricReport(r)} className="text-left">
                          <p className={`text-xs font-bold uppercase ${getHistoryTagColor(r.analysisType)}`}>{r.analysisType} Analysis</p>
                          <p className="text-sm text-gray-600 group-hover:text-primary">{new Date(r.timestamp).toLocaleString()}</p>
                          <p className="text-xs text-gray-500 mt-1 truncate max-w-48">{r.summary}</p>
                        </button>
                      </div>
                      <button onClick={() => deleteReport(r.id)} className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <TrashIcon />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No reports in history.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
