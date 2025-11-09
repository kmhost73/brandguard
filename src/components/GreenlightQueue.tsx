import React from 'react';
import type { QueueItem, ComplianceReport } from '../types';
import { CheckIcon, XIcon, SparklesIcon, TrashIcon, PhotoIcon } from './icons/Icons';
import Loader from './Loader';

interface GreenlightQueueProps {
    queue: QueueItem[];
    setQueue: React.Dispatch<React.SetStateAction<QueueItem[]>>;
    onClear: () => void;
    onViewReport: (report: ComplianceReport) => void;
}

const GreenlightQueue: React.FC<GreenlightQueueProps> = ({ queue, setQueue, onClear, onViewReport }) => {
    const completedCount = queue.filter(item => item.status === 'Complete' || item.status === 'Error').length;
    const progress = queue.length > 0 ? (completedCount / queue.length) * 100 : 0;
    
    const removeItem = (id: string) => {
        setQueue(prev => prev.filter(item => item.id !== id));
    };

    const renderItemContent = (item: QueueItem) => {
        if (item.file) { // Image item
            return (
                <div className="flex items-center gap-2">
                    <img src={URL.createObjectURL(item.file)} alt={item.file.name} className="w-8 h-8 rounded object-cover" />
                    <span className="text-sm font-mono truncate">{item.file.name}</span>
                </div>
            )
        }
        // Text item
        return <p className="text-sm font-mono truncate">"{item.content}"</p>;
    }

    const renderStatus = (item: QueueItem) => {
        switch (item.status) {
            case 'Queued': return <span className="text-xs text-gray-400">Queued</span>;
            case 'Running': return <div className="flex items-center gap-1"><Loader size="sm" /><span className="text-xs text-yellow-400">Running...</span></div>;
            case 'Complete': return <button onClick={() => item.result && onViewReport(item.result)} className="text-xs text-green-400 hover:underline">View Report</button>;
            case 'Error': return <span className="text-xs text-red-400 truncate" title={item.error}>Error</span>;
        }
    };

    return (
        <div className="bg-dark p-4 rounded-lg border border-gray-700 mt-4 animate-fade-in">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-white">Greenlight Queue</h3>
                <button onClick={onClear} className="text-xs text-gray-500 hover:text-white flex items-center gap-1"><TrashIcon /> Clear All</button>
            </div>
            
            <div className="mb-3">
                <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-gray-300">{completedCount} / {queue.length} Complete</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {queue.map(item => (
                    <div key={item.id} className="p-2 bg-secondary-dark rounded-md flex justify-between items-center">
                        <div className="flex-grow truncate pr-2">
                          {renderItemContent(item)}
                        </div>
                        <div className="flex-shrink-0 w-28 text-right flex items-center justify-end gap-2">
                            {renderStatus(item)}
                             <button onClick={() => removeItem(item.id)} className="text-gray-600 hover:text-white">
                                <XIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GreenlightQueue;
