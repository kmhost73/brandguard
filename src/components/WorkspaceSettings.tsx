import React, { useState } from 'react';
import type { Workspace, CustomRule, MainView } from '../types';
import { CogIcon, TrashIcon, SparklesIcon, CheckIcon, XIcon } from './icons/Icons';
import { architectRule } from '../services/geminiService';
import Loader from './Loader';

interface WorkspaceSettingsProps {
    activeWorkspace: Workspace;
    customRules: CustomRule[];
    onUpdateRules: (rules: CustomRule[]) => void;
    onRenameWorkspace: (id: string, newName: string) => void;
    onDeleteWorkspace: (id: string) => void;
    onNavigate: (view: MainView) => void;
}

type ArchitectedRule = Omit<CustomRule, 'id'> | null;

const WorkspaceSettings: React.FC<WorkspaceSettingsProps> = ({
    activeWorkspace,
    customRules,
    onUpdateRules,
    onRenameWorkspace,
    onDeleteWorkspace,
    onNavigate
}) => {
    const [name, setName] = useState(activeWorkspace.name);
    const [newRuleIntent, setNewRuleIntent] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isArchitecting, setIsArchitecting] = useState(false);
    const [architectError, setArchitectError] = useState<string | null>(null);
    const [architectedRule, setArchitectedRule] = useState<ArchitectedRule>(null);

    const handleSaveName = () => {
        if (name.trim() && name.trim() !== activeWorkspace.name) {
            onRenameWorkspace(activeWorkspace.id, name.trim());
        }
    };

    const handleArchitectRule = async () => {
        if (!newRuleIntent.trim()) return;
        setIsArchitecting(true);
        setArchitectError(null);
        setArchitectedRule(null);
        try {
            const result = await architectRule(newRuleIntent);
            setArchitectedRule({ ...result, intent: newRuleIntent });
        } catch (err) {
            setArchitectError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsArchitecting(false);
        }
    };

    const saveArchitectedRule = () => {
        if (architectedRule) {
            const newRule = { ...architectedRule, id: crypto.randomUUID() };
            onUpdateRules([...customRules, newRule]);
            resetArchitectState();
        }
    };
    
    const resetArchitectState = () => {
        setNewRuleIntent('');
        setArchitectedRule(null);
        setArchitectError(null);
        setIsArchitecting(false);
    }

    const deleteRule = (ruleId: string) => {
        onUpdateRules(customRules.filter(r => r.id !== ruleId));
    };
    
    const handleDelete = () => {
        onDeleteWorkspace(activeWorkspace.id);
        // Navigation will be handled by the App component after deletion
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-gray-300 animate-fade-in">
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Workspace Settings</h1>
                    <p className="text-gray-400">Manage settings for the "{activeWorkspace.name}" workspace.</p>
                </div>
                <button 
                    onClick={() => onNavigate('dashboard')}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary-dark border border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-300 hover:bg-gray-700"
                >
                    Return to Dashboard
                </button>
            </div>

            <div className="max-w-4xl mx-auto space-y-8">
                {/* General Settings */}
                <div className="bg-secondary-dark p-6 rounded-lg border border-gray-700">
                    <h2 className="text-xl font-bold text-white mb-4">General</h2>
                    <div>
                        <label htmlFor="workspaceName" className="block text-sm font-medium text-gray-400 mb-1">Workspace Name</label>
                        <div className="flex gap-2">
                            <input
                                id="workspaceName"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onBlur={handleSaveName}
                                className="flex-grow p-2 border border-gray-600 rounded-md bg-dark text-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition"
                            />
                            <button onClick={handleSaveName} className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition-colors">Save</button>
                        </div>
                    </div>
                </div>

                {/* Rules Studio */}
                <div className="bg-secondary-dark rounded-lg p-6 border border-primary/20">
                    <h2 className="w-full flex justify-between items-center text-left text-xl font-bold text-white mb-1">
                        <span className="flex items-center gap-2"><SparklesIcon/> Rules Studio</span>
                    </h2>
                     <p className="text-sm text-gray-400 mb-4">Define a rule's intent in natural language, and let the engine architect a structured, example-driven rule to teach the Greenlight Engine.</p>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="ruleIntent" className="block text-sm font-medium text-gray-400 mb-1">Rule Intent</label>
                            <div className="flex gap-2">
                                <input type="text" id="ruleIntent" value={newRuleIntent} onChange={(e) => setNewRuleIntent(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleArchitectRule()} placeholder="e.g., Must have a positive, upbeat tone" className="flex-grow p-2 border border-gray-600 rounded-md bg-dark text-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition disabled:opacity-50" disabled={isArchitecting}/>
                                <button onClick={handleArchitectRule} className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:bg-gray-600" disabled={isArchitecting || !newRuleIntent.trim()}>
                                    {isArchitecting ? <Loader size="sm" /> : <SparklesIcon />}
                                    {isArchitecting ? 'Architecting...' : 'Architect Rule'}
                                </button>
                            </div>
                        </div>

                        {isArchitecting && <Loader text="The Rules Architect is thinking..." />}
                        {architectError && <div className="bg-red-900/50 border border-danger text-red-300 px-4 py-3 rounded-lg" role="alert"><p className="font-bold">Error</p><p>{architectError}</p></div>}
                        
                        {architectedRule && (
                            <div className="bg-dark p-4 rounded-lg border border-gray-700 animate-fade-in space-y-4">
                                <h3 className="text-lg font-semibold text-white">Review Architected Rule</h3>
                                <div>
                                    <label className="text-xs font-bold uppercase text-gray-500">User Intent</label>
                                    <p className="p-2 bg-secondary-dark rounded text-gray-300 italic">"{architectedRule.intent}"</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-gray-500">Engine-Generated Description</label>
                                    <p className="p-2 bg-secondary-dark rounded text-gray-300">{architectedRule.description}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-green-500">Positive Example (Passes)</label>
                                    <p className="p-2 bg-green-900/20 rounded text-gray-300 font-mono text-sm">"{architectedRule.positiveExample}"</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-red-500">Negative Example (Fails)</label>
                                    <p className="p-2 bg-red-900/20 rounded text-gray-300 font-mono text-sm">"{architectedRule.negativeExample}"</p>
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button onClick={resetArchitectState} className="flex items-center gap-2 px-4 py-2 bg-secondary-dark text-white font-semibold rounded-md hover:bg-gray-700 transition-colors"><XIcon/> Discard</button>
                                    <button onClick={saveArchitectedRule} className="flex items-center gap-2 px-4 py-2 bg-success text-white font-semibold rounded-md hover:bg-green-600 transition-colors"><CheckIcon/> Save Rule</button>
                                </div>
                            </div>
                        )}

                        <div className="pt-4">
                             <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2"><CogIcon/> Current Custom Rules</h3>
                            <ul className="space-y-3">
                                {customRules.map(rule => (
                                    <li key={rule.id} className="p-3 bg-dark rounded-md border border-gray-800">
                                        <details>
                                            <summary className="flex justify-between items-center cursor-pointer group">
                                                <span className="text-sm text-gray-300 font-medium group-hover:text-primary-light">{rule.intent}</span>
                                                <div className="flex items-center">
                                                    <span className="text-xs text-gray-500 mr-4 group-hover:hidden">Click to expand</span>
                                                    <button onClick={(e) => { e.preventDefault(); deleteRule(rule.id); }} className="text-gray-500 hover:text-danger p-1 rounded-full hover:bg-danger/10"><TrashIcon/></button>
                                                </div>
                                            </summary>
                                            <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400 space-y-2">
                                                <p><strong className="text-gray-300 font-semibold uppercase text-xs">Engine Instruction:</strong> {rule.description}</p>
                                                <p><strong className="text-green-400 font-semibold uppercase text-xs">Good Example:</strong> "{rule.positiveExample}"</p>
                                                <p><strong className="text-red-400 font-semibold uppercase text-xs">Bad Example:</strong> "{rule.negativeExample}"</p>
                                            </div>
                                        </details>
                                    </li>
                                ))}
                                {customRules.length === 0 && <p className="text-center text-gray-500 text-sm py-2">No custom rules defined.</p>}
                            </ul>
                        </div>
                    </div>
                </div>
                
                {/* Danger Zone */}
                <div className="bg-secondary-dark p-6 rounded-lg border border-danger/50">
                    <h2 className="text-xl font-bold text-red-400 mb-4">Danger Zone</h2>
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-gray-200">Delete this workspace</p>
                            <p className="text-sm text-gray-400">Once deleted, it's gone forever. All associated reports will be lost.</p>
                        </div>
                         <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2 bg-danger text-white font-semibold rounded-md hover:bg-red-700 transition-colors">Delete Workspace</button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-secondary-dark p-8 rounded-lg shadow-2xl border border-gray-700 max-w-md w-full">
                        <h3 className="text-2xl font-bold text-white">Are you sure?</h3>
                        <p className="text-gray-400 mt-2">This will permanently delete the <strong className="text-white">"{activeWorkspace.name}"</strong> workspace and all its data. This action cannot be undone.</p>
                        <div className="mt-6 flex justify-end gap-4">
                             <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-500 transition-colors">Cancel</button>
                             <button onClick={handleDelete} className="px-4 py-2 bg-danger text-white font-semibold rounded-md hover:bg-red-700 transition-colors">Confirm Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkspaceSettings;