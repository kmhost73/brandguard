import React, { useState, useCallback, useRef, lazy, Suspense } from 'react';
import { analyzePostContent } from '../services/geminiService';
import type { ComplianceReport } from '../types';
import Loader from './Loader';
import { SparklesIcon } from './icons/Icons';
import { SignUpButton } from '@clerk/clerk-react';

const PublicReportCard = lazy(() => import('./PublicReportCard'));

interface PublicAuditToolProps {
    ctaButtonText: string;
    riskReversal: string;
}

const PublicAuditTool: React.FC<PublicAuditToolProps> = ({ ctaButtonText, riskReversal }) => {
    const [postContent, setPostContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState<ComplianceReport | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [scanCount, setScanCount] = useState(() => {
        const count = sessionStorage.getItem('brandGuardFreeScans');
        return count ? parseInt(count, 10) : 0;
    });

    const reportRef = useRef<HTMLDivElement>(null);
    const scansRemaining = 3 - scanCount;

    const handleScan = useCallback(async () => {
        if (scansRemaining <= 0) {
            setError("You've used all your free scans for this session.");
            return;
        }

        setIsLoading(true);
        setReport(null);
        setError(null);

        try {
            if (!postContent.trim()) throw new Error("Please enter post content to analyze.");
            
            const result = await analyzePostContent(postContent, 'Public Audit', [], true);
            
            const fullReport: ComplianceReport = {
                ...result,
                workspaceId: 'public',
                id: `pub_${crypto.randomUUID()}`
            };

            setReport(fullReport);
            const newCount = scanCount + 1;
            setScanCount(newCount);
            sessionStorage.setItem('brandGuardFreeScans', newCount.toString());
            
            setTimeout(() => {
                reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);

        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    }, [postContent, scanCount, scansRemaining]);

    const isScanDisabled = isLoading || !postContent.trim() || scansRemaining <= 0;

    return (
        <div className="bg-secondary-dark p-6 rounded-lg border border-primary/20 shadow-lg text-left">
            <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                rows={5}
                className="w-full p-3 border border-gray-600 rounded-md bg-dark text-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition"
                placeholder="Paste influencer post caption here to run a free compliance check..."
            />
            <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
                <button
                    onClick={handleScan}
                    disabled={isScanDisabled}
                    className="w-full sm:w-auto flex-grow px-6 py-3 flex items-center justify-center gap-3 bg-primary text-white font-bold rounded-md hover:bg-primary-dark disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-lg shadow-lg shadow-primary/20"
                >
                    {isLoading ? <><Loader size="sm" /><span>Scanning...</span></> : <><SparklesIcon /> {ctaButtonText}</>}
                </button>
                <div className="text-center sm:text-left">
                    <p className="font-semibold text-lg text-white">{scansRemaining} Free Scans Remaining</p>
                    <p className="text-sm text-gray-500">{riskReversal}</p>
                </div>
            </div>
            
            {error && <div className="mt-4 bg-red-900/50 border border-danger text-red-300 px-4 py-3 rounded-lg" role="alert"><p className="font-bold">Error</p><p>{error}</p></div>}
            
            <div ref={reportRef} className="mt-6">
                 {report && (
                    <Suspense fallback={<div className="w-full h-96 flex items-center justify-center"><Loader /></div>}>
                        <PublicReportCard report={report} />
                    </Suspense>
                 )}
                 {scansRemaining <= 0 && !report && (
                    <div className="text-center p-8 bg-dark rounded-lg border border-gray-700">
                        <h3 className="text-2xl font-bold text-white">You're Out of Free Scans!</h3>
                        <p className="text-gray-400 mt-2">Sign up now to get unlimited scans, save your history, create custom rules, and more.</p>
                         <SignUpButton mode="modal">
                            <button className="mt-6 inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark transition-transform transform hover:scale-105 shadow-lg shadow-primary/30">
                                Sign Up for Unlimited Scans
                            </button>
                        </SignUpButton>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default PublicAuditTool;