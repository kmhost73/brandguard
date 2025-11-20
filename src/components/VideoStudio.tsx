
import React, { useState, useCallback, useRef, lazy, Suspense } from 'react';
import { transcribeVideo, analyzeVideoContent } from '../services/geminiService';
import type { ComplianceReport, CustomRule, MainView, ReportStatus } from '../types';
import * as db from '../services/dbService';
import Loader from './Loader';
import { VideoCameraIcon, SparklesIcon, AlertTriangleIcon } from './icons/Icons';

const ReportCard = lazy(() => import('./ReportCard'));

interface VideoStudioProps {
  activeWorkspaceId: string;
  customRules: CustomRule[];
  onNavigate: (view: MainView) => void;
  onUpdateReportInsight: (reportId: string, insight: string) => void;
}

const VideoStudio: React.FC<VideoStudioProps> = ({ activeWorkspaceId, customRules, onNavigate, onUpdateReportInsight }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [transcript, setTranscript] = useState<string | null>(null);
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Agency Fields
  const [influencerHandle, setInfluencerHandle] = useState('');
  const [clientBrand, setClientBrand] = useState('');

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
      if (file.size > 50 * 1024 * 1024) { // 50MB Limit for browser demo
          setError("File too large. For this browser-based demo, please upload videos under 50MB. In production, our server-side architecture handles up to 2GB.");
          return;
      }

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

  const handleAnalysisCompletion = useCallback(async (newReport: Omit<ComplianceReport, 'workspaceId' | 'sourceMedia'>) => {
    // We don't save the large video data to the database, only the analysis results.
    const reportToSave: ComplianceReport = {
        ...newReport,
        workspaceId: activeWorkspaceId,
        status: newReport.recommendedStatus || 'pending',
    };
    await db.addReport(reportToSave);
    return reportToSave;
  }, [activeWorkspaceId]);


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
      const analysisResult = await analyzeVideoContent(transcriptResult, '', selectedFile, customRules, (insight) => onUpdateReportInsight(analysisResult.id, insight), { influencerHandle, clientBrand });
      
      const { sourceMedia, ...reportWithoutMedia } = analysisResult; // Exclude media before saving
      const finalReportInDb = await handleAnalysisCompletion(reportWithoutMedia);
      
      // The report displayed in the UI can still have the media for immediate viewing
      const displayReport = { ...finalReportInDb, sourceMedia };
      setReport(displayReport);

    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during video processing.");
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  };
  
  const handleStatusChange = (reportId: string, newStatus: ReportStatus) => {
    db.updateReport(reportId, { status: newStatus });
    if (report?.id === reportId) {
        setReport(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-gray-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Video Studio</h1>
          <p className="text-gray-400">End-to-end compliance analysis for Reels, TikToks, and Shorts.</p>
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
            <p className="mt-2 text-gray-400">Drag & drop or click to upload (MP4, WebM, MOV)</p>
            <p className="mt-2 text-xs text-yellow-500 flex items-center justify-center gap-1"><AlertTriangleIcon /> Browser Demo Limit: 50MB max</p>
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
              
              <div className="bg-secondary-dark p-4 rounded-lg border border-gray-700 space-y-4">
                  <h3 className="font-semibold text-white">Agency Metadata</h3>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Influencer Handle</label>
                          <input type="text" value={influencerHandle} onChange={(e) => setInfluencerHandle(e.target.value)} placeholder="@creator" className="w-full p-2 bg-dark border border-gray-600 rounded-md text-sm" />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Client Brand</label>
                          <input type="text" value={clientBrand} onChange={(e) => setClientBrand(e.target.value)} placeholder="Brand Name" className="w-full p-2 bg-dark border border-gray-600 rounded-md text-sm" />
                      </div>
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
