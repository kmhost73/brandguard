import React, { useState } from 'react';
import type { Workspace, CustomRule, MainView } from '../types';
import { CogIcon, TrashIcon, PlusIcon } from './icons/Icons';

interface WorkspaceSettingsProps {
    activeWorkspace: Workspace;
    customRules: CustomRule[];
    onUpdateRules: (rules: CustomRule[]) => void;
    onRenameWorkspace: (id: string, newName: string) => void;
    onDeleteWorkspace: (id: string) => void;
    onNavigate: (view: MainView) => void;
}

const WorkspaceSettings: React.FC<WorkspaceSettingsProps> = ({
    activeWorkspace,
    customRules,
    onUpdateRules,
    onRenameWorkspace,
    onDeleteWorkspace,
    onNavigate
}) => {
    const [name, setName] = useState(activeWorkspace.name);
    const [newRuleText, setNewRuleText] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleSaveName = () => {
        if (name.trim() && name.trim() !== activeWorkspace.name) {
            onRenameWorkspace(activeWorkspace.id, name.trim());
        }
    };

    const addRule = () => {
        if (newRuleText.trim()) {
            const newRule = { id: crypto.randomUUID(), text: newRuleText.trim() };
            onUpdateRules([...customRules, newRule]);
            setNewRuleText('');
        }
    };

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

                {/* Custom Rules Engine */}
                <div className="bg-secondary-dark rounded-lg p-6 border border-gray-700">
                    <h2 className="w-full flex justify-between items-center text-left text-xl font-bold text-white mb-4">
                        <span className="flex items-center gap-2"><CogIcon/> Custom Rules Engine</span>
                    </h2>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input type="text" value={newRuleText} onChange={(e) => setNewRuleText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addRule()} placeholder="e.g., Must include #BrandPartner" className="flex-grow p-2 border border-gray-600 rounded-md bg-dark text-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition" />
                            <button onClick={addRule} className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition-colors flex items-center gap-2"><PlusIcon/> Add</button>
                        </div>
                        <ul className="space-y-2">
                            {customRules.map(rule => (
                                <li key={rule.id} className="flex justify-between items-center p-2 bg-dark rounded-md">
                                    <span className="text-sm text-gray-400">{rule.text}</span>
                                    <button onClick={() => deleteRule(rule.id)} className="text-gray-500 hover:text-danger"><TrashIcon/></button>
                                </li>
                            ))}
                             {customRules.length === 0 && <p className="text-center text-gray-500 text-sm py-2">No custom rules defined.</p>}
                        </ul>
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
