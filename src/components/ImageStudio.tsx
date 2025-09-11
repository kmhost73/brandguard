import React, { useState } from 'react';
import { generateMarketingImages } from '../services/geminiService';
import Loader from './Loader';
import { PhotoIcon, SparklesIcon, CheckIcon } from './icons/Icons';

interface ImageStudioProps {
  onAnalyze: (base64Data: string, mimeType: string, prompt: string) => void;
}

interface GeneratedImage {
  base64: string;
  mimeType: string;
}

const ImageStudio: React.FC<ImageStudioProps> = ({ onAnalyze }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt.");
      return;
    }
    setIsLoading(true);
    setGeneratedImages([]);
    setError(null);
    try {
      const images = await generateMarketingImages(prompt, 1, aspectRatio as "1:1" | "16:9" | "9:16" | "4:3" | "3:4");
      setGeneratedImages(images.map(img => ({ base64: img.imageBytes, mimeType: 'image/jpeg' })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred while generating images.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeClick = (image: GeneratedImage) => {
    onAnalyze(image.base64, image.mimeType, prompt);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-gray-300 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Image Studio</h1>
          <p className="text-gray-400">Generate brand-safe, compliant marketing images in seconds.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="lg:col-span-1 bg-secondary-dark p-6 rounded-lg border border-gray-700 h-fit">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><SparklesIcon /> Generation Controls</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-400 mb-1">Image Prompt</label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A lifestyle photo of our new sneakers on a person running through a futuristic city"
                rows={6}
                className="w-full p-3 border border-gray-600 rounded-md bg-dark text-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition"
              />
            </div>
            <div>
              <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-400 mb-1">Aspect Ratio</label>
              <select
                id="aspectRatio"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full p-3 border border-gray-600 rounded-md bg-dark text-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition"
              >
                <option value="1:1">Square (1:1)</option>
                <option value="16:9">Widescreen (16:9)</option>
                <option value="9:16">Portrait (9:16)</option>
                <option value="4:3">Landscape (4:3)</option>
                <option value="3:4">Tall (3:4)</option>
              </select>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full px-6 py-4 bg-primary text-white font-bold rounded-md hover:bg-primary-dark disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-lg shadow-lg shadow-primary/20"
            >
              {isLoading ? 'Generating...' : 'Generate Image'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 bg-secondary-dark p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><PhotoIcon /> Generated Images</h2>
          {error && <div className="bg-red-900/50 border border-danger text-red-300 px-4 py-3 rounded-lg" role="alert"><p className="font-bold">Error</p><p>{error}</p></div>}
          
          {isLoading && <Loader />}

          {!isLoading && generatedImages.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <PhotoIcon className="w-16 h-16 mx-auto" />
              <p className="mt-4">Your generated images will appear here.</p>
            </div>
          )}

          {generatedImages.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generatedImages.map((image, index) => (
                <div key={index} className="group relative border border-gray-700 rounded-lg overflow-hidden">
                  <img src={`data:${image.mimeType};base64,${image.base64}`} alt={`Generated image ${index + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => handleAnalyzeClick(image)}
                      className="flex items-center gap-2 px-4 py-2 bg-success text-white font-semibold rounded-md hover:bg-green-600 transition-colors"
                    >
                      <CheckIcon /> Analyze Compliance
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ImageStudio;