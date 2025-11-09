import React, { useState, useCallback, useRef, lazy, Suspense } from 'react';
import { transcribeVideo, analyzeVideoContent } from '../services/geminiService';
import type { ComplianceReport, CustomRule, MainView, ReportStatus } from '../types';
import Loader from './Loader';
import { VideoCameraIcon, SparklesIcon } from './icons/Icons';

const ReportCard = lazy(() => import('./ReportCard'));

interface VideoStudioProps {
  activeWorkspaceId: string;
  customRules: CustomRule[];
  reportHistory: ComplianceReport[];
  onUpdateHistory: (history: ComplianceReport[]) => void;
  onNavigate: (view: MainView) => void;
}

const VideoStudio: React.FC<VideoStudioProps> = ({ activeWorkspaceId, customRules, reportHistory, onUpdateHistory, onNavigate }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [transcript, setTranscript] = useState<string | null>(null);
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setIsLoading(false);
    setLoadingText('');
    setTranscript(null);
    setReport(null);
    setError(null);
  };

  const handleFileSelect = (file: File | null) => {
    if (file) {
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
      resetState();
      setSelectedFile(file);
      setVideoSrc(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleAnalysisCompletion = useCallback((newReport: Omit<ComplianceReport, 'workspaceId'>) => {
    const reportWithWorkspace = { ...newReport, workspaceId: activeWorkspaceId };
    const reportWithInitialStatus = { ...reportWithWorkspace, status: newReport.recommendedStatus || 'pending' };
    
    const newHistory = [reportWithInitialStatus, ...reportHistory];
    onUpdateHistory(newHistory);
    return reportWithInitialStatus;
    
  }, [activeWorkspaceId, onUpdateHistory, reportHistory]);

  const handleInsightReceived = useCallback((insight: string, reportId: string) => {
      const newHistory = reportHistory.map(r => r.id === reportId ? {...r, strategicInsight: insight} : r);
      onUpdateHistory(newHistory);
      setReport(currentReport => {
        if (!currentReport || currentReport.id !== reportId) return currentReport;
        return { ...currentReport, strategicInsight: insight };
      });
  }, [onUpdateHistory, reportHistory]);

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setReport(null);
    setError(null);
    setTranscript(null);

    try {
      setLoadingText('Transcribing Video...');
      const transcriptResult = await transcribeVideo(selectedFile);
      setTranscript(transcriptResult);
      
      setLoadingText('Analyzing Video & Audio...');
      const analysisResult = await analyzeVideoContent(transcriptResult, '', selectedFile, customRules, (insight) => handleInsightReceived(insight, analysisResult.id));
      
      const finalReport = handleAnalysisCompletion(analysisResult);
      setReport(finalReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during video processing.");
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  };
  
  const handleStatusChange = (reportId: string, newStatus: ReportStatus) => {
    const updatedHistory = reportHistory.map(r => r.id === reportId ? { ...r, status: newStatus } : r);
    onUpdateHistory(updatedHistory);

    if (report?.id === reportId) {
        setReport(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-gray-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Video Studio</h1>
          <p className="text-gray-400">Perform end-to-end compliance analysis on video content.</p>
        </div>
        <button 
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 px-4 py-2 bg-secondary-dark border border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-300 hover:bg-gray-700"
        >
          Return to Dashboard
        </button>
      </div>
      
      <div className="max-w-6xl mx-auto">
        {!selectedFile ? (
          <div 
            className="bg-secondary-dark/50 border-2 border-dashed border-primary/20 p-12 rounded-lg text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <VideoCameraIcon className="mx-auto h-16 w-16 text-gray-500" />
            <h2 className="mt-4 text-xl font-bold text-white">Select a video file</h2>
            <p className="mt-2 text-gray-400">Drag & drop or click to upload a video for analysis.</p>
            <p className="mt-1 text-xs text-gray-500">(Supported formats: MP4, WebM, QuickTime)</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-secondary-dark p-4 rounded-lg border border-gray-700">
                {videoSrc && <video src={videoSrc} controls className="w-full rounded-md" />}
                <div className="mt-4 flex justify-between items-center">
                    <p className="text-sm font-medium truncate" title={selectedFile.name}>{selectedFile.name}</p>
                    <button onClick={() => fileInputRef.current?.click()} className="text-sm text-primary-light hover:underline">Change video</button>
                </div>
              </div>
              <button 
                onClick={handleAnalyze} 
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary text-white font-bold rounded-md hover:bg-primary-dark disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-lg"
              >
                {isLoading ? <><Loader size="sm" /> <span>{loadingText}</span></> : <><SparklesIcon /> Transcribe & Analyze</>}
              </button>
            </div>
            
            <div className="space-y-6">
                <div className="bg-secondary-dark p-4 rounded-lg border border-gray-700 min-h-[200px]">
                    <h3 className="text-lg font-semibold text-white mb-2">AI-Generated Transcript</h3>
                    {isLoading && loadingText.includes('Transcribing') && <Loader text="Generating transcript..." />}
                    {!isLoading && !transcript && !error && <p className="text-gray-500 text-sm">Transcript will appear here after analysis.</p>}
                    {transcript && <p className="text-gray-300 whitespace-pre-wrap text-sm max-h-48 overflow-y-auto">{transcript}</p>}
                    {error && <div className="bg-red-900/50 border border-danger text-red-300 px-4 py-3 rounded-lg" role="alert"><p className="font-bold">Error</p><p>{error}</p></div>}
                </div>
                <div className="min-h-[200px]">
                    {isLoading && loadingText.includes('Analyzing') && <div className="flex justify-center pt-8"><Loader text="Generating compliance report..." /></div>}
                    {report && (
                        <Suspense fallback={<Loader />}>
                            <ReportCard report={report} onStatusChange={handleStatusChange} />
                        </Suspense>
                    )}
                </div>
            </div>

          </div>
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="video/mp4,video/webm,video/quicktime"
          onChange={(e) => handleFileSelect(e.target.files ? e.target.files[0] : null)}
        />
      </div>
    </div>
  );
};

export default VideoStudio;
