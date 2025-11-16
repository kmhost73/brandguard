import React, { useState } from 'react';
import * as db from '../services/dbService';
import type { FeedbackType } from '../types';
import { FeedbackIcon, XIcon, CheckIcon } from './icons/Icons';
import Loader from './Loader';

interface FeedbackWidgetProps {
    activeWorkspaceId: string;
}

const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({ activeWorkspaceId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [feedbackType, setFeedbackType] = useState<FeedbackType>('suggestion');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setIsSubmitting(true);
        try {
            await db.addFeedback({
                workspaceId: activeWorkspaceId,
                type: feedbackType,
                message,
                timestamp: new Date().toISOString()
            });
            setIsSubmitted(true);
            setMessage('');
            setFeedbackType('suggestion');
            setTimeout(() => {
                setIsOpen(false);
                setIsSubmitted(false);
            }, 2000);
        } catch (error) {
            console.error("Failed to submit feedback:", error);
            // Optionally, show an error message to the user
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (isSubmitting) return;
        setIsOpen(false);
        // Reset state after the modal transition ends
        setTimeout(() => {
            if (!isOpen) {
               setMessage('');
               setFeedbackType('suggestion');
               setIsSubmitted(false);
            }
        }, 300);
    };

    const types: { id: FeedbackType, label: string }[] = [
        { id: 'suggestion', label: 'Suggestion' },
        { id: 'bug', label: 'Bug Report' },
        { id: 'comment', label: 'Comment' },
    ];

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-40 bg-primary text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-primary-dark transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark focus:ring-primary"
                aria-label="Open feedback form"
            >
                <FeedbackIcon />
            </button>

            {isOpen && (
                <div 
                    className="fixed inset-0 bg-dark/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
                    onClick={handleClose}
                >
                    <div 
                        className="bg-secondary-dark rounded-lg shadow-2xl border border-gray-700 w-full max-w-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {isSubmitted ? (
                            <div className="p-8 text-center animate-fade-in">
                                <CheckIcon className="mx-auto w-16 h-16 text-success" />
                                <h2 className="text-2xl font-bold text-white mt-4">Thank You!</h2>
                                <p className="text-gray-400 mt-2">Your feedback has been submitted.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-white">Share Your Feedback</h2>
                                    <button type="button" onClick={handleClose} className="text-gray-500 hover:text-white">
                                        <XIcon />
                                    </button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Feedback Type</label>
                                        <div className="flex space-x-2 p-1 bg-dark rounded-md">
                                            {types.map(type => (
                                                <button
                                                    key={type.id}
                                                    type="button"
                                                    onClick={() => setFeedbackType(type.id)}
                                                    className={`w-full px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${feedbackType === type.id ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                                                >
                                                    {type.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="feedback-message" className="block text-sm font-medium text-gray-400 mb-1">
                                            {feedbackType === 'bug' ? 'Describe the bug...' : feedbackType === 'suggestion' ? 'What would you like to see?' : 'Your comments...'}
                                        </label>
                                        <textarea
                                            id="feedback-message"
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            rows={6}
                                            className="w-full p-3 border border-gray-600 rounded-md bg-dark text-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition"
                                            placeholder="Please be as detailed as possible."
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="p-6 bg-dark/50 rounded-b-lg flex justify-end">
                                    <button 
                                        type="submit"
                                        disabled={isSubmitting || !message.trim()}
                                        className="px-6 py-2 bg-primary text-white font-bold rounded-md hover:bg-primary-dark disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? <><Loader size="sm" /> <span>Submitting...</span></> : 'Submit Feedback'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default FeedbackWidget;