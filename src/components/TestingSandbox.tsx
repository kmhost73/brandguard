import React, { useState } from 'react';
import { analyzePostContent, analyzeImageContent, generateTestScenario } from '../services/geminiService';
import type { ComplianceReport, TestCase, MainView, TestProfile, DynamicTestResult } from '../types';
import { testCases } from '../testCases';
import Loader from './Loader';
import { CheckIcon, XIcon, SparklesIcon, TestTubeIcon } from './icons/Icons';

interface TestingSandboxProps {
    onNavigate: (view: MainView) => void;
}

const testProfiles: TestProfile[] = [
    {
        id: 'p1',
        name: 'The Careless Influencer',
        description: 'Generates posts that might forget, misplace, or bury disclosures.',
        prompt: 'You are a popular but slightly careless influencer. Your goal is to create a post that subtly downplays the sponsored nature of the content. You might forget the #ad, bury it deep in hashtags, or use ambiguous language. Create a post that is likely to fail or receive a warning for its FTC disclosure.'
    },
    {
        id: 'p2',
        name: 'The Over-Hyped Marketer',
        description: 'Generates posts with exaggerated claims that may border on non-compliant.',
        prompt: 'You are an aggressive marketer. Your goal is to create a post that makes bold, exciting claims about a product, potentially omitting a required detail like "made with 100% organic materials" to make it sound more punchy. Create a post that is likely to fail a claim accuracy check.'
    },
    {
        id: 'p3',
        name: 'The Compliant Pro',
        description: 'Generates perfectly compliant posts to check for false positives.',
        prompt: 'You are a highly professional and compliant influencer. Your goal is to create a sponsored post that is a textbook example of perfect compliance. It should have a clear #ad at the beginning, mention all required claims accurately, and be completely brand safe. Create a post that should easily pass all checks.'
    }
];

const ResultDisplay: React.FC<{ label: string; value: string; pass: boolean }> = ({ label, value, pass }) => (
    <div className="flex items-start text-sm">
        <div className="w-24 font-semibold text-gray-400 shrink-0">{label}:</div>
        <div className="flex items-center gap-2">
            {pass ? <CheckIcon className="w-5 h-5 text-success shrink-0" /> : <XIcon className="w-5 h-5 text-danger shrink-0" />}
            <span className="text-gray-300">{value}</span>
        </div>
    </div>
);


const TestCaseCard: React.FC<{ testCase: TestCase }> = ({ testCase }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [report, setReport] = useState<ComplianceReport | null>(null);
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

    const runTest = async () => {
        setIsLoading(true);
        setError(null);
        setReport(null);
        try {
            let result;
            if (testCase.type === 'text') {
                 // FIX: Added an empty string for the 'campaignName' argument to satisfy the function signature.
                 result = await analyzePostContent(testCase.content.text!, '');
            } else if (testCase.type === 'image') {
                if (!selectedImageFile) throw new Error("Please select a sample image file to run this test.");
                // FIX: Added an empty string for the 'campaignName' argument to satisfy the function signature.
                result = await analyzeImageContent(testCase.content.text!, '', selectedImageFile);
            } else {
                 throw new Error("This test type is not yet implemented in the sandbox.");
            }
            // FIX: Add a dummy workspaceId to satisfy the ComplianceReport type.
            setReport({ ...result, workspaceId: 'sandbox' });
        } catch (err)
 {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const scorePass = report ? testCase.expected.score(report.overallScore) : false;
    const summaryPass = report ? testCase.expected.summary(report.summary) : false;
    const checksPass = report ? testCase.expected.checks(report.checks) : false;
    const allPass = scorePass && summaryPass && checksPass;

    return (
        <div className="bg-secondary-dark p-6 rounded-lg shadow-md border border-gray-700">
            <h3 className="font-bold text-lg text-white">{testCase.title}</h3>
            <p className="text-sm text-gray-400 mt-1">{testCase.description}</p>
            
            <div className="my-4 p-3 bg-dark rounded-md border border-gray-600">
                <p className="text-xs font-semibold text-gray-500 uppercase">Test Content</p>
                <p className="text-sm text-gray-300 whitespace-pre-wrap font-mono mt-1">{testCase.content.text}</p>
                {testCase.type === 'image' && (
                     <div className="mt-2">
                        <label htmlFor={`image-upload-${testCase.id}`} className="block text-xs font-semibold text-gray-500 uppercase">Required Action</label>
                        <input id={`image-upload-${testCase.id}`} type="file" accept="image/png, image/jpeg, image/webp" onChange={(e) => setSelectedImageFile(e.target.files ? e.target.files[0] : null)} className="mt-1 block w-full max-w-sm text-sm text-gray-400 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary-light hover:file:bg-primary/20" disabled={isLoading}/>
                        {selectedImageFile && <p className="text-xs text-gray-500 mt-1">Selected: {selectedImageFile.name}</p>}
                    </div>
                )}
            </div>

            <button onClick={runTest} disabled={isLoading || (testCase.type === 'image' && !selectedImageFile)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-md shadow-sm hover:bg-primary-dark disabled:bg-gray-600 disabled:cursor-not-allowed">
                <SparklesIcon /> {isLoading ? "Running..." : "Run Test"}
            </button>

            {isLoading && <div className="mt-4"><Loader /></div>}
            {error && <div className="mt-4 bg-red-900/50 border-l-4 border-danger text-red-300 p-4 rounded-md" role="alert"><p className="font-bold">Error</p><p>{error}</p></div>}
            
            {report && (
                <div className="mt-6 space-y-4">
                    <div className="flex justify-between items-center">
                         <h4 className="font-bold text-md text-white">Test Results</h4>
                         <span className={`px-3 py-1 text-sm font-bold rounded-full ${allPass ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                            {allPass ? 'PASS' : 'FAIL'}
                         </span>
                    </div>
                    <div className="p-4 bg-dark rounded-lg border border-gray-700 space-y-2">
                        <ResultDisplay label="Score" value={`Got ${report.overallScore}, Expected ${testCase.expected.scoreText}`} pass={scorePass} />
                        <ResultDisplay label="Summary" value={`Got "${report.summary}"`} pass={summaryPass} />
                        <ResultDisplay label="Checks" value={`Specific checks validated`} pass={checksPass} />
                    </div>
                </div>
            )}
        </div>
    );
};

const RedTeamAgent: React.FC = () => {
    const [selectedProfileId, setSelectedProfileId] = useState<string>(testProfiles[0].id);
    const [isDynamicTestLoading, setIsDynamicTestLoading] = useState(false);
    const [dynamicTestError, setDynamicTestError] = useState<string | null>(null);
    const [dynamicTestResult, setDynamicTestResult] = useState<DynamicTestResult | null>(null);

    const handleRunDynamicTest = async () => {
        setIsDynamicTestLoading(true);
        setDynamicTestError(null);
        setDynamicTestResult(null);
        try {
            const profile = testProfiles.find(p => p.id === selectedProfileId);
            if (!profile) throw new Error("Selected test profile not found.");

            // 1. Generate the scenario from the Red Team Agent
            const scenario = await generateTestScenario(profile.prompt);

            // 2. Run the generated content through the actual analysis engine
            // FIX: Added an empty string for the 'campaignName' argument to satisfy the function signature.
            const partialReport = await analyzePostContent(scenario.postContent, '');
            // FIX: Add a dummy workspaceId to satisfy the ComplianceReport type, which is required by DynamicTestResult.
            const actualReport: ComplianceReport = { ...partialReport, workspaceId: 'sandbox' };
            
            // FIX: Map `scenario.postContent` to `generatedContent` to match the `DynamicTestResult` type.
            setDynamicTestResult({
                generatedContent: scenario.postContent,
                expectedSummary: scenario.expectedSummary,
                expectedScoreText: scenario.expectedScoreText,
                expectedToPass: scenario.expectedToPass,
                actualReport,
            });

        } catch (err) {
            setDynamicTestError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsDynamicTestLoading(false);
        }
    };
    
    const selectedProfile = testProfiles.find(p => p.id === selectedProfileId);
    let testPass: boolean | null = null;
    if (dynamicTestResult) {
        const actualPass = dynamicTestResult.actualReport.overallScore >= 90;
        testPass = actualPass === dynamicTestResult.expectedToPass;
    }

    return (
        <div className="bg-secondary-dark p-6 rounded-lg shadow-md border border-primary/20 mb-6">
            <h2 className="font-bold text-xl text-white flex items-center gap-2"><TestTubeIcon className="text-primary"/> Red Team Agent</h2>
            <p className="text-sm text-gray-400 mt-1">Challenge the Greenlight Engine with novel, generated test scenarios.</p>
            
            <div className="my-4 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:w-auto flex-grow">
                    <label htmlFor="red-team-profile" className="text-xs font-semibold text-gray-500 uppercase">Select Persona</label>
                    <select 
                        id="red-team-profile"
                        value={selectedProfileId}
                        onChange={(e) => setSelectedProfileId(e.target.value)}
                        className="mt-1 block w-full p-2 border border-gray-600 rounded-md bg-dark text-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition"
                        disabled={isDynamicTestLoading}
                    >
                       {testProfiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div className="w-full sm:w-auto pt-5">
                    <button 
                        onClick={handleRunDynamicTest} 
                        disabled={isDynamicTestLoading} 
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-md shadow-sm hover:bg-primary-dark disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        <SparklesIcon /> {isDynamicTestLoading ? 'Generating...' : 'Generate & Run Scenario'}
                    </button>
                </div>
            </div>
             {selectedProfile && <p className="text-xs text-center sm:text-left text-gray-500 italic">Goal: {selectedProfile.description}</p>}

            {isDynamicTestLoading && <div className="mt-4"><Loader /></div>}
            {dynamicTestError && <div className="mt-4 bg-red-900/50 border-l-4 border-danger text-red-300 p-4 rounded-md" role="alert"><p className="font-bold">Error</p><p>{dynamicTestError}</p></div>}

            {dynamicTestResult && (
                 <div className="mt-6 space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center">
                         <h4 className="font-bold text-md text-white">Dynamic Test Result</h4>
                         <span className={`px-3 py-1 text-sm font-bold rounded-full ${testPass ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                            {testPass ? 'MATCH (PASS)' : 'MISMATCH (FAIL)'}
                         </span>
                    </div>
                    <div className="p-4 bg-dark rounded-lg border border-gray-700 space-y-4">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Generated Content</p>
                            <p className="text-sm text-gray-300 whitespace-pre-wrap font-mono mt-1 p-2 bg-secondary-dark rounded">{dynamicTestResult.generatedContent}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3 bg-secondary-dark rounded">
                                <p className="text-sm font-bold text-gray-400">Red Team's Expectation</p>
                                <p className="text-xs text-gray-300 mt-1"><strong>Expected Score:</strong> {dynamicTestResult.expectedScoreText}</p>
                                <p className="text-xs text-gray-300 mt-1"><strong>Reasoning:</strong> {dynamicTestResult.expectedSummary}</p>
                            </div>
                            <div className="p-3 bg-secondary-dark rounded">
                                <p className="text-sm font-bold text-gray-400">BrandGuard's Actual Result</p>
                                <p className="text-xs text-gray-300 mt-1"><strong>Actual Score:</strong> {dynamicTestResult.actualReport.overallScore}</p>
                                 <p className="text-xs text-gray-300 mt-1"><strong>Engine Summary:</strong> {dynamicTestResult.actualReport.summary}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const TestingSandbox: React.FC<TestingSandboxProps> = ({ onNavigate }) => {
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-gray-300">
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Internal QA Sandbox</h1>
                    <p className="text-gray-400">Validate performance with static test cases or challenge it with the Red Team Agent.</p>
                </div>
                <button 
                    onClick={() => onNavigate('dashboard')}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary-dark border border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-300 hover:bg-gray-700"
                >
                    Return to Dashboard
                </button>
            </div>

            <RedTeamAgent />

            <div className="space-y-6">
                 <h2 className="font-bold text-xl text-white mt-8 border-t border-gray-700 pt-6">Static Test Cases</h2>
                {testCases.map(tc => (
                    <TestCaseCard key={tc.id} testCase={tc} />
                ))}
            </div>
        </div>
    );
};

export default TestingSandbox;