import React, { useState, useCallback, useMemo } from 'react';
import { analyzePostContent, analyzeImageContent, generateTestScenario } from '../services/geminiService';
import type { ComplianceReport, TestCase, MainView, TestProfile, DynamicTestResult, TestResultStatus, StaticTestRunResult } from '../types';
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


const TestCaseCard: React.FC<{
    testCase: TestCase;
    runTest: (testCase: TestCase, imageFile?: File | null) => void;
    result?: StaticTestRunResult;
    isRunning: boolean;
}> = ({ testCase, runTest, result, isRunning }) => {
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

    const onRunTest = () => {
        runTest(testCase, selectedImageFile);
    };

    let scorePass = false, summaryPass = false, checksPass = false, allPass = false;
    if (result?.report) {
        scorePass = testCase.expected.score(result.report.overallScore);
        summaryPass = testCase.expected.summary(result.report.summary);
        checksPass = testCase.expected.checks(result.report.checks);
        allPass = scorePass && summaryPass && checksPass;
    }

    const getStatusBadge = () => {
        if (!result || result.status === 'pending') return null;
        if (result.status === 'running') return <span className="px-3 py-1 text-sm font-bold rounded-full bg-yellow-500/20 text-yellow-300">RUNNING...</span>;
        if (result.status === 'fail') return <span className="px-3 py-1 text-sm font-bold rounded-full bg-red-500/20 text-red-300">ERROR</span>;
        if (result.isMismatch) return <span className="px-3 py-1 text-sm font-bold rounded-full bg-red-500/20 text-red-300">FAIL</span>;
        return <span className="px-3 py-1 text-sm font-bold rounded-full bg-green-500/20 text-green-300">PASS</span>;
    };

    return (
        <div className="bg-secondary-dark p-6 rounded-lg shadow-md border border-gray-700">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-lg text-white">{testCase.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{testCase.description}</p>
                </div>
                {getStatusBadge()}
            </div>
            
            <div className="my-4 p-3 bg-dark rounded-md border border-gray-600">
                <p className="text-xs font-semibold text-gray-500 uppercase">Test Content</p>
                <p className="text-sm text-gray-300 whitespace-pre-wrap font-mono mt-1">{testCase.content.text}</p>
                {testCase.type === 'image' && (
                     <div className="mt-2">
                        <label htmlFor={`image-upload-${testCase.id}`} className="block text-xs font-semibold text-gray-500 uppercase">Required Action</label>
                        <input id={`image-upload-${testCase.id}`} type="file" accept="image/png, image/jpeg, image/webp" onChange={(e) => setSelectedImageFile(e.target.files ? e.target.files[0] : null)} className="mt-1 block w-full max-w-sm text-sm text-gray-400 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary-light hover:file:bg-primary/20" disabled={isRunning}/>
                        {selectedImageFile && <p className="text-xs text-gray-500 mt-1">Selected: {selectedImageFile.name}</p>}
                    </div>
                )}
            </div>

            <button onClick={onRunTest} disabled={isRunning || (testCase.type === 'image' && !selectedImageFile)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-md shadow-sm hover:bg-primary-dark disabled:bg-gray-600 disabled:cursor-not-allowed">
                <SparklesIcon /> {isRunning && result?.status === 'running' ? "Running..." : "Run Test"}
            </button>
            
            {result?.status === 'fail' && <div className="mt-4 bg-red-900/50 border-l-4 border-danger text-red-300 p-4 rounded-md" role="alert"><p className="font-bold">Error</p><p>{result.error}</p></div>}
            
            {result?.report && (
                <div className="mt-6 space-y-4">
                    <h4 className="font-bold text-md text-white">Test Results</h4>
                    <div className="p-4 bg-dark rounded-lg border border-gray-700 space-y-2">
                        <ResultDisplay label="Score" value={`Got ${result.report.overallScore}, Expected ${testCase.expected.scoreText}`} pass={scorePass} />
                        <ResultDisplay label="Summary" value={`Got "${result.report.summary}"`} pass={summaryPass} />
                        <ResultDisplay label="Checks" value={`Specific checks validated`} pass={checksPass} />
                    </div>
                </div>
            )}
        </div>
    );
};

const RedTeamAgent: React.FC<{ onTestComplete: (result: boolean) => void }> = ({ onTestComplete }) => {
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

            const scenario = await generateTestScenario(profile.prompt);
            const partialReport = await analyzePostContent(scenario.postContent, '', [], false, () => {});
            const actualReport: ComplianceReport = { ...partialReport, workspaceId: 'sandbox' };
            
            const result = {
                generatedContent: scenario.postContent,
                expectedSummary: scenario.expectedSummary,
                expectedScoreText: scenario.expectedScoreText,
                expectedToPass: scenario.expectedToPass,
                actualReport,
            };
            setDynamicTestResult(result);
            const actualPass = result.actualReport.overallScore >= 90;
            onTestComplete(actualPass === result.expectedToPass);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setDynamicTestError(errorMessage);
            onTestComplete(false); // An error is a failed test
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

const TestSummary: React.FC<{ results: StaticTestRunResult[], onRunAll: () => void, onReset: () => void, isRunning: boolean }> = ({ results, onRunAll, onReset, isRunning }) => {
    const summary = useMemo(() => {
        return results.reduce((acc, result) => {
            if (result.status === 'pass' && !result.isMismatch) acc.pass++;
            else if (result.isMismatch || result.status === 'fail') acc.fail++;
            else if (result.status !== 'pending') acc.run++;
            return acc;
        }, { pass: 0, fail: 0, run: 0 });
    }, [results]);

    const progress = results.length > 0 ? (summary.run / results.length) * 100 : 0;

    return (
         <div className="bg-secondary-dark p-6 rounded-lg shadow-md border border-gray-700 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h2 className="font-bold text-xl text-white">Test Session Summary</h2>
                    <p className="text-sm text-gray-400 mt-1">Run tests to validate engine performance.</p>
                </div>
                <div className="flex gap-2 mt-4 sm:mt-0">
                    <button onClick={onReset} disabled={isRunning} className="px-4 py-2 text-sm font-semibold text-gray-300 bg-dark border border-gray-600 rounded-md hover:bg-gray-800 disabled:opacity-50">Reset</button>
                    <button onClick={onRunAll} disabled={isRunning} className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-md hover:bg-primary-dark disabled:bg-gray-600">
                        {isRunning ? 'Running...' : 'Run All Static Tests'}
                    </button>
                </div>
            </div>
            <div className="mt-4">
                <div className="flex justify-between mb-1 text-sm">
                    <span className="font-semibold text-gray-300">{summary.run} / {results.length} Run</span>
                    <div className="space-x-4">
                        <span className="text-green-400 font-semibold">{summary.pass} Passed</span>
                        <span className="text-red-400 font-semibold">{summary.fail} Failed</span>
                    </div>
                </div>
                <div className="w-full bg-dark rounded-full h-2.5 border border-gray-600">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
         </div>
    );
};


const TestingSandbox: React.FC<TestingSandboxProps> = ({ onNavigate }) => {
    const [staticTestResults, setStaticTestResults] = useState<StaticTestRunResult[]>(() => testCases.map(tc => ({ testCaseId: tc.id, status: 'pending' })));
    const [redTeamResults, setRedTeamResults] = useState<{ pass: number, fail: number }>({ pass: 0, fail: 0 });
    const [isRunning, setIsRunning] = useState(false);
    
    const runSingleTest = useCallback(async (testCase: TestCase, imageFile?: File | null) => {
        setStaticTestResults(prev => prev.map(r => r.testCaseId === testCase.id ? { ...r, status: 'running', report: null, error: undefined, isMismatch: false } : r));

        try {
            let result;
            if (testCase.type === 'text') {
                 result = await analyzePostContent(testCase.content.text!, '', [], false, () => {});
            } else if (testCase.type === 'image') {
                if (!imageFile) throw new Error("Please select a sample image file to run this test.");
                result = await analyzeImageContent(testCase.content.text!, '', imageFile, [], () => {});
            } else {
                 throw new Error("This test type is not yet implemented in the sandbox.");
            }
            
            const report = { ...result, workspaceId: 'sandbox' };
            const scorePass = testCase.expected.score(report.overallScore);
            const summaryPass = testCase.expected.summary(report.summary);
            const checksPass = testCase.expected.checks(report.checks);
            const allPass = scorePass && summaryPass && checksPass;

            setStaticTestResults(prev => prev.map(r => r.testCaseId === testCase.id ? { ...r, status: 'pass', report, isMismatch: !allPass } : r));

        } catch (err) {
            const error = err instanceof Error ? err.message : "An unknown error occurred.";
            setStaticTestResults(prev => prev.map(r => r.testCaseId === testCase.id ? { ...r, status: 'fail', error } : r));
        }
    }, []);

    const handleRunAllStaticTests = useCallback(async () => {
        setIsRunning(true);
        for (const testCase of testCases) {
            // Cannot run image tests in batch mode for now as they require user input
            if (testCase.type === 'image') {
                setStaticTestResults(prev => prev.map(r => r.testCaseId === testCase.id ? { ...r, status: 'pending', error: "Skipped: Image required" } : r));
                continue;
            }
            await runSingleTest(testCase);
        }
        setIsRunning(false);
    }, [runSingleTest]);

    const resetSession = () => {
        setStaticTestResults(testCases.map(tc => ({ testCaseId: tc.id, status: 'pending' })));
        setRedTeamResults({ pass: 0, fail: 0 });
    };

    const handleRedTeamTestComplete = (result: boolean) => {
        setRedTeamResults(prev => result ? { ...prev, pass: prev.pass + 1 } : { ...prev, fail: prev.fail + 1 });
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-gray-300">
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Internal QA Sandbox</h1>
                    <p className="text-gray-400">Validate engine performance with static test cases and the Red Team Agent.</p>
                </div>
                <button 
                    onClick={() => onNavigate('dashboard')}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary-dark border border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-300 hover:bg-gray-700"
                >
                    Return to Dashboard
                </button>
            </div>

            <TestSummary results={staticTestResults} onRunAll={handleRunAllStaticTests} onReset={resetSession} isRunning={isRunning} />

            <RedTeamAgent onTestComplete={handleRedTeamTestComplete} />

            <div className="space-y-6">
                 <h2 className="font-bold text-xl text-white mt-8 border-t border-gray-700 pt-6">Static Test Cases</h2>
                {testCases.map(tc => (
                    <TestCaseCard 
                        key={tc.id} 
                        testCase={tc} 
                        runTest={runSingleTest}
                        result={staticTestResults.find(r => r.testCaseId === tc.id)}
                        isRunning={isRunning || staticTestResults.find(r => r.testCaseId === tc.id)?.status === 'running'}
                    />
                ))}
            </div>
        </div>
    );
};

export default TestingSandbox;