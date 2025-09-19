import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import Loader from './Loader';
import { SparklesIcon, PhotoIcon, CheckIcon } from './icons/Icons';

interface ImageStudioProps {
  onImageGenerated: (base64Data: string, mimeType: string) => void;
}

const ImageStudio: React.FC<ImageStudioProps> = ({ onImageGenerated }) => {
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
        onImageGenerated(generatedImage, 'image/png');
    }
  };

  return (
    <div className="bg-secondary-dark p-6 rounded-lg border border-primary/20 shadow-lg animate-fade-in">
        <div className="mb-4 pb-4 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><PhotoIcon className="text-primary"/> Image Studio</h2>
            <p className="text-sm text-gray-400 mt-1">Generate marketing visuals from a text prompt. You can then send the result directly to the compliance engine.</p>
        </div>
        
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

            <div className="bg-dark p-4 rounded-lg border border-gray-700 min-h-[300px] flex items-center justify-center">
                {isLoading && <Loader text="Generating image..." />}
                {error && <div className="text-center"><p className="text-danger font-semibold">Error</p><p className="text-red-300 text-sm max-w-sm">{error}</p></div>}
                {generatedImage && !isLoading && (
                    <div className="animate-fade-in text-center">
                        <img 
                            src={`data:image/png;base64,${generatedImage}`} 
                            alt={prompt}
                            className="max-h-80 rounded-lg shadow-lg"
                        />
                         <button 
                            onClick={handleSendToCompliance}
                            className="mt-4 inline-flex items-center justify-center gap-2 px-6 py-2 bg-success text-white font-semibold rounded-md hover:bg-green-600 transition-colors"
                        >
                            <CheckIcon />
                            Use This Image
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
  );
};

export default ImageStudio;