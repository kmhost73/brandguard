import React, { useState } from 'react';
import { analyzePostContent, analyzeImageContent } from '../services/geminiService';
import type { ComplianceReport, TestCase } from '../types';
import { testCases } from '../testCases';
import Loader from './Loader';
import { CheckIcon, XIcon, SparklesIcon } from './icons/Icons';

const ResultDisplay: React.FC<{ label: string; value: string; pass: boolean }> = ({ label, value, pass }) => (
    <div className="flex items-start text-sm">
        <div className="w-24 font-semibold text-gray-600 shrink-0">{label}:</div>
        <div className="flex items-center gap-2">
            {pass ? <CheckIcon className="w-5 h-5 text-green-500 shrink-0" /> : <XIcon className="w-5 h-5 text-red-500 shrink-0" />}
            <span className="text-gray-800">{value}</span>
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
                 result = await analyzePostContent(testCase.content.text!);
            } else if (testCase.type === 'image') {
                if (!selectedImageFile) throw new Error("Please select a sample image file to run this test.");
                result = await analyzeImageContent(testCase.content.text!, selectedImageFile);
            } else {
                 throw new Error("This test type is not yet implemented in the sandbox.");
            }
            setReport(result);
        } catch (err) {
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
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="font-bold text-lg text-gray-800">{testCase.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{testCase.description}</p>
            
            <div className="my-4 p-3 bg-gray-50 rounded-md border">
                <p className="text-xs font-semibold text-gray-500 uppercase">Test Content</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap font-mono mt-1">{testCase.content.text}</p>
                {testCase.type === 'image' && (
                     <div className="mt-2">
                        <label htmlFor={`image-upload-${testCase.id}`} className="block text-xs font-semibold text-gray-500 uppercase">Required Action</label>
                        <input id={`image-upload-${testCase.id}`} type="file" accept="image/png, image/jpeg, image/webp" onChange={(e) => setSelectedImageFile(e.target.files ? e.target.files[0] : null)} className="mt-1 block w-full max-w-sm text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary-dark hover:file:bg-primary/20" disabled={isLoading}/>
                        {selectedImageFile && <p className="text-xs text-gray-500 mt-1">Selected: {selectedImageFile.name}</p>}
                    </div>
                )}
            </div>

            <button onClick={runTest} disabled={isLoading || (testCase.type === 'image' && !selectedImageFile)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-white font-semibold rounded-md shadow-sm hover:bg-secondary-dark disabled:bg-gray-400 disabled:cursor-not-allowed">
                <SparklesIcon /> {isLoading ? "Running..." : "Run Test"}
            </button>

            {isLoading && <div className="mt-4"><Loader /></div>}
            {error && <div className="mt-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert"><p className="font-bold">Error</p><p>{error}</p></div>}
            
            {report && (
                <div className="mt-6 space-y-4">
                    <div className="flex justify-between items-center">
                         <h4 className="font-bold text-md text-gray-800">Test Results</h4>
                         <span className={`px-3 py-1 text-sm font-bold rounded-full ${allPass ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {allPass ? 'PASS' : 'FAIL'}
                         </span>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border space-y-2">
                        <ResultDisplay label="Score" value={`Got ${report.overallScore}, Expected ${testCase.expected.scoreText}`} pass={scorePass} />
                        <ResultDisplay label="Summary" value={`Got "${report.summary}"`} pass={summaryPass} />
                        <ResultDisplay label="Checks" value={`Specific checks validated`} pass={checksPass} />
                    </div>
                </div>
            )}
        </div>
    );
};

const TestingSandbox: React.FC = () => {
    return (
        <div className="space-y-6">
            {testCases.map(tc => (
                <TestCaseCard key={tc.id} testCase={tc} />
            ))}
        </div>
    );
};

export default TestingSandbox;