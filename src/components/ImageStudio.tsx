
import React, { useState } from 'react';
import { editImage, analyzeImageContent } from '../services/geminiService';
import type { MainView, ComplianceReport } from '../types';
import Loader from './Loader';
import { SparklesIcon, PhotoIcon, CheckIcon, XIcon, DownloadIcon } from './icons/Icons';

interface ImageStudioProps {
  onNavigate: (view: MainView) => void;
  key: string;
}

const ImageStudio: React.FC<ImageStudioProps> = ({ onNavigate }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scanResult, setScanResult] = useState<Omit<ComplianceReport, 'workspaceId'> | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Fix Mode State
  const [isFixing, setIsFixing] = useState(false);
  const [fixPrompt, setFixPrompt] = useState('');
  const [fixedImageBase64, setFixedImageBase64] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setSelectedFile(e.target.files[0]);
          setScanResult(null);
          setFixedImageBase64(null);
          setError(null);
      }
  };

  const handleScan = async () => {
      if (!selectedFile || !caption.trim()) return;
      setIsLoading(true);
      setError(null);
      try {
          const result = await analyzeImageContent(caption, 'Image Studio Scan', selectedFile, []);
          setScanResult(result);
      } catch (err) {
          setError(err instanceof Error ? err.message : "Analysis failed.");
      } finally {
          setIsLoading(false);
      }
  };
  
  const handleMagicFix = async () => {
      if (!selectedFile || !fixPrompt.trim()) return;
      setIsFixing(true);
      try {
          // Convert file to base64 for editing
          const reader = new FileReader();
          reader.readAsDataURL(selectedFile);
          reader.onload = async () => {
              const base64 = (reader.result as string).split(',')[1];
              const newImage = await editImage(base64, selectedFile.type, fixPrompt);
              if (newImage) {
                  setFixedImageBase64(newImage);
              } else {
                  setError("Could not generate a fix.");
              }
              setIsFixing(false);
          };
      } catch (err) {
           setError(err instanceof Error ? err.message : "Fix failed.");
           setIsFixing(false);
      }
  };

  const handleSendToDashboard = () => {
    if (fixedImageBase64) {
        localStorage.setItem('brandguard_pending_image', JSON.stringify({
            data: fixedImageBase64,
            name: `fixed-${Date.now()}.png`
        }));
        onNavigate('dashboard');
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-gray-300">
         <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Image Analysis Workspace</h1>
                <p className="text-gray-400">Deep dive into influencer image assets. Scan for hidden risks and test compliance fixes.</p>
            </div>
            <button 
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2 px-4 py-2 bg-secondary-dark border border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-300 hover:bg-gray-700"
            >
                Return to Dashboard
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Column */}
            <div className="space-y-6">
                <div className="bg-secondary-dark p-6 rounded-lg border border-primary/20 shadow-lg">
                    <h2 className="text-xl font-bold text-white mb-4">1. Upload Asset</h2>
                    <div className="space-y-4">
                         <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                            {selectedFile ? (
                                <div className="relative">
                                    <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="max-h-64 mx-auto rounded-md" />
                                    <button onClick={() => setSelectedFile(null)} className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white hover:bg-red-500"><XIcon/></button>
                                </div>
                            ) : (
                                <label className="cursor-pointer block">
                                    <PhotoIcon className="w-12 h-12 mx-auto text-gray-500"/>
                                    <p className="mt-2 text-gray-400">Click to upload influencer submission</p>
                                    <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                                </label>
                            )}
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-400 mb-1">Accompanying Caption</label>
                             <textarea 
                                value={caption} 
                                onChange={(e) => setCaption(e.target.value)} 
                                className="w-full p-3 bg-dark border border-gray-600 rounded-md text-gray-300 focus:ring-2 focus:ring-primary"
                                rows={3}
                                placeholder="Paste the caption here..."
                            />
                         </div>
                         <button 
                            onClick={handleScan} 
                            disabled={!selectedFile || !caption || isLoading}
                            className="w-full py-3 bg-primary text-white font-bold rounded-md hover:bg-primary-dark disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            {isLoading ? <Loader size="sm"/> : <SparklesIcon/>} Analyze Compliance
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Column */}
            <div className="space-y-6">
                {error && <div className="bg-red-900/50 border border-danger text-red-300 p-4 rounded-lg">{error}</div>}
                
                {scanResult && (
                    <div className="bg-secondary-dark p-6 rounded-lg border border-gray-700 animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">Compliance Result</h2>
                            <span className={`px-3 py-1 rounded-full font-bold ${scanResult.overallScore >= 90 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                Score: {scanResult.overallScore}
                            </span>
                        </div>
                        <p className="text-gray-300 mb-4">{scanResult.summary}</p>
                        <div className="space-y-2 max-h-60 overflow-y-auto mb-6">
                            {scanResult.checks.map((check, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm p-2 bg-dark rounded">
                                    {check.status === 'pass' ? <CheckIcon className="text-success w-4 h-4 mt-0.5"/> : <XIcon className="text-danger w-4 h-4 mt-0.5"/>}
                                    <span className="text-gray-400">{check.details}</span>
                                </div>
                            ))}
                        </div>
                        
                        {scanResult.overallScore < 90 && (
                            <div className="border-t border-gray-700 pt-6">
                                <h3 className="font-bold text-white flex items-center gap-2 mb-2"><SparklesIcon/> Test Magic Fix</h3>
                                <p className="text-sm text-gray-400 mb-4">Experiment with adding visual disclosures to see if it resolves the issue.</p>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={fixPrompt} 
                                        onChange={(e) => setFixPrompt(e.target.value)} 
                                        placeholder="e.g. Add white #ad text to top right"
                                        className="flex-grow p-2 bg-dark border border-gray-600 rounded-md text-gray-300"
                                    />
                                    <button onClick={handleMagicFix} disabled={isFixing} className="px-4 bg-secondary text-white rounded-md hover:bg-secondary-light disabled:opacity-50">
                                        {isFixing ? "Fixing..." : "Apply"}
                                    </button>
                                </div>
                                
                                {fixedImageBase64 && (
                                    <div className="mt-4 animate-fade-in">
                                        <p className="text-sm text-green-400 mb-2 font-semibold">Fix Generated:</p>
                                        <img src={`data:image/png;base64,${fixedImageBase64}`} className="rounded-lg border border-green-500/50 max-h-48 mx-auto" alt="Fixed" />
                                        <button onClick={handleSendToDashboard} className="w-full mt-4 py-2 bg-success text-white font-bold rounded-md hover:bg-green-600 flex justify-center items-center gap-2">
                                            <CheckIcon/> Use This Fix
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
                
                {!scanResult && !isLoading && (
                    <div className="h-full flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
                        <p>Upload an image to start analysis</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default ImageStudio;
