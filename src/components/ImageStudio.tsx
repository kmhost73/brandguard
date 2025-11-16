import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import type { MainView } from '../types';
import Loader from './Loader';
import { SparklesIcon, PhotoIcon, CheckIcon } from './icons/Icons';

interface ImageStudioProps {
  onNavigate: (view: MainView) => void;
  key: string;
}

const ImageStudio: React.FC<ImageStudioProps> = ({ onNavigate }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    try {
      const images = await generateImage(prompt);
      if (images.length > 0) {
        setGeneratedImage(images[0]);
      } else {
        throw new Error("The AI did not return an image. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during image generation.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSendToCompliance = () => {
    if (generatedImage) {
        localStorage.setItem('brandguard_pending_image', JSON.stringify({
            data: generatedImage,
            name: `generated-${Date.now()}.png`
        }));
        onNavigate('dashboard');
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-gray-300">
         <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Image Studio</h1>
                <p className="text-gray-400">Generate high-quality marketing visuals from a text prompt.</p>
            </div>
            <button 
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2 px-4 py-2 bg-secondary-dark border border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-300 hover:bg-gray-700"
            >
                Return to Dashboard
            </button>
        </div>
        <div className="max-w-4xl mx-auto">
            <div className="bg-secondary-dark p-6 rounded-lg border border-primary/20 shadow-lg">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="image-prompt" className="block text-sm font-medium text-gray-400 mb-1">Generation Prompt</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                id="image-prompt" 
                                value={prompt} 
                                onChange={(e) => setPrompt(e.target.value)} 
                                onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
                                placeholder="e.g., A photorealistic image of a futuristic sneaker" 
                                className="flex-grow p-2 border border-gray-600 rounded-md bg-dark text-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition disabled:opacity-50" 
                                disabled={isLoading}
                            />
                            <button 
                                onClick={handleGenerate} 
                                className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:bg-gray-600" 
                                disabled={isLoading || !prompt.trim()}
                            >
                                <SparklesIcon />
                                {isLoading ? 'Generating...' : 'Generate'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-dark p-4 rounded-lg border border-gray-700 min-h-[400px] flex items-center justify-center">
                        {isLoading && <Loader text="Generating image..." />}
                        {error && <div className="text-center"><p className="text-danger font-semibold">Error</p><p className="text-red-300 text-sm max-w-sm">{error}</p></div>}
                        {generatedImage && !isLoading && (
                            <div className="animate-fade-in text-center">
                                <img 
                                    src={`data:image/png;base64,${generatedImage}`} 
                                    alt={prompt}
                                    className="max-h-96 rounded-lg shadow-lg"
                                />
                                <button 
                                    onClick={handleSendToCompliance}
                                    className="mt-4 inline-flex items-center justify-center gap-2 px-6 py-2 bg-success text-white font-semibold rounded-md hover:bg-green-600 transition-colors"
                                >
                                    <CheckIcon />
                                    Send to Compliance Dashboard
                                </button>
                            </div>
                        )}
                        {!isLoading && !generatedImage && !error && (
                            <div className="text-center text-gray-500">
                                <PhotoIcon className="mx-auto h-12 w-12" />
                                <p className="mt-2 text-sm">Your generated image will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ImageStudio;