import React, { useState } from 'react';
import type { MainView, CustomRule, GreenlightBrief } from '../types';
import { generateGreenlightBrief } from '../services/geminiService';
import Loader from './Loader';
import { SparklesIcon, DocumentTextIcon, CheckIcon, XIcon, LightbulbIcon } from './icons/Icons';

interface BriefStudioProps {
  activeWorkspaceId: string;
  customRules: CustomRule[];
  onNavigate: (view: MainView) => void;
}

const BriefStudio: React.FC<BriefStudioProps> = ({ customRules, onNavigate }) => {
    const [campaignProduct, setCampaignProduct] = useState('');
    const [campaignMessage, setCampaignMessage] = useState('');
    const [campaignAudience, setCampaignAudience] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [brief, setBrief] = useState<GreenlightBrief | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setBrief(null);
        try {
            const result = await generateGreenlightBrief({
                product: campaignProduct,
                message: campaignMessage,
                audience: campaignAudience,
            }, customRules);
            setBrief(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const isFormIncomplete = !campaignProduct.trim() || !campaignMessage.trim() || !campaignAudience.trim();

    const renderBrief = () => {
        if (!brief) return null;

        return (
            <div className="bg-secondary-dark p-6 rounded-lg border border-gray-700 mt-6 animate-fade-in">
                <h2 className="text-2xl font-bold text-white mb-4">Your Greenlight Brief</h2>
                
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-primary-light mb-2">Campaign Overview</h3>
                        <p className="text-gray-300 bg-dark p-3 rounded-md">{brief.campaignOverview}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-lg">
                            <h3 className="font-semibold text-green-300 flex items-center gap-2 mb-2"><CheckIcon /> Key "Do's"</h3>
                            <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm">
                                {brief.keyDos.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                        <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg">
                            <h3 className="font-semibold text-red-300 flex items-center gap-2 mb-2"><XIcon /> Key "Don'ts"</h3>
                            <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm">
                                {brief.keyDonts.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                    </div>
                    
                     <div>
                        <h3 className="font-semibold text-yellow-300 flex items-center gap-2 mb-2"><LightbulbIcon /> FTC Disclosure Guide</h3>
                        <p className="text-gray-300 bg-dark p-3 rounded-md text-sm">{brief.disclosureGuide}</p>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white flex items-center gap-2 mb-2"><SparklesIcon /> Compliant Example Post</h3>
                        <div className="p-4 bg-dark rounded-lg border-l-4 border-primary">
                            <p className="text-gray-300 whitespace-pre-wrap font-mono text-sm">{brief.compliantExample}</p>
                        </div>
                    </div>
                </div>
                 <button 
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(brief, null, 2))}
                    className="mt-6 px-4 py-2 bg-secondary text-white font-semibold rounded-md hover:bg-secondary-light transition-colors"
                >
                    Copy Brief as JSON
                </button>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-gray-300">
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Greenlight Brief Studio</h1>
                    <p className="text-gray-400">Generate a compliant creative brief to align your creators and accelerate your campaign.</p>
                </div>
                 <button 
                    onClick={() => onNavigate('dashboard')}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary-dark border border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-300 hover:bg-gray-700"
                >
                    Return to Dashboard
                </button>
            </div>

            <div className="max-w-4xl mx-auto">
                <div className="bg-secondary-dark p-6 rounded-lg border border-primary/20">
                    <div className="mb-4 pb-4 border-b border-gray-700">
                         <h2 className="text-xl font-bold text-white flex items-center gap-2"><DocumentTextIcon className="text-primary"/> Campaign Inputs</h2>
                         <p className="text-sm text-gray-400 mt-1">Provide the core details, and the engine will build the brief around them and your custom rules.</p>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="campaign-product" className="block text-sm font-medium text-gray-400 mb-1">Product or Service</label>
                            <input type="text" id="campaign-product" value={campaignProduct} onChange={(e) => setCampaignProduct(e.target.value)} placeholder="e.g., The new 'Velocity' sneaker" className="w-full p-2 border border-gray-600 rounded-md bg-dark text-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition" />
                        </div>
                        <div>
                            <label htmlFor="campaign-message" className="block text-sm font-medium text-gray-400 mb-1">Key Message</label>
                            <textarea id="campaign-message" value={campaignMessage} onChange={(e) => setCampaignMessage(e.target.value)} placeholder="e.g., The most comfortable and stylish shoe for urban explorers." rows={3} className="w-full p-2 border border-gray-600 rounded-md bg-dark text-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition" />
                        </div>
                         <div>
                            <label htmlFor="campaign-audience" className="block text-sm font-medium text-gray-400 mb-1">Target Audience</label>
                            <input type="text" id="campaign-audience" value={campaignAudience} onChange={(e) => setCampaignAudience(e.target.value)} placeholder="e.g., Tech-savvy millennials aged 25-35" className="w-full p-2 border border-gray-600 rounded-md bg-dark text-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition" />
                        </div>
                        <button 
                            onClick={handleGenerate}
                            disabled={isLoading || isFormIncomplete}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-md hover:bg-primary-dark disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-lg"
                        >
                            <SparklesIcon />
                            {isLoading ? 'Generating Brief...' : 'Generate Greenlight Brief'}
                        </button>
                    </div>
                </div>

                {isLoading && <div className="mt-6 flex justify-center"><Loader text="Brief Architect is on the job..." /></div>}
                {error && <div className="mt-6 bg-red-900/50 border border-danger text-red-300 px-4 py-3 rounded-lg" role="alert"><p className="font-bold">Error</p><p>{error}</p></div>}
                {renderBrief()}
            </div>
        </div>
    );
};

export default BriefStudio;
