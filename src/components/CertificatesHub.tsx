import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import * as db from '../services/dbService';
import type { MainView } from '../types';
import { CertificateIcon, LinkIcon, TrashIcon } from './icons/Icons';

interface CertificatesHubProps {
  activeWorkspaceId: string;
  onNavigate: (view: MainView) => void;
}

const CertificatesHub: React.FC<CertificatesHubProps> = ({ activeWorkspaceId, onNavigate }) => {
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const certificates = useLiveQuery(() => db.getCertificatesForWorkspace(activeWorkspaceId), [activeWorkspaceId], []);

    const handleRevoke = (certId: string) => {
        db.deleteCertificate(certId);
    };

    const handleCopy = (certId: string) => {
        const url = `${window.location.origin}${window.location.pathname}?certId=${certId}`;
        navigator.clipboard.writeText(url);
        setCopiedId(certId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
         <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-gray-300 animate-fade-in">
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Certificate Hub</h1>
                    <p className="text-gray-400">Manage all shared compliance certificates for this workspace.</p>
                </div>
                <button 
                    onClick={() => onNavigate('dashboard')}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary-dark border border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-300 hover:bg-gray-700"
                >
                    Return to Dashboard
                </button>
            </div>
            
            <div className="bg-secondary-dark rounded-lg border border-gray-700 shadow-md">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-dark/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Content</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {certificates.map(cert => (
                                <tr key={cert.id} className="hover:bg-dark/40">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-200 truncate max-w-md">{cert.report.summary}</div>
                                        <div className="text-sm text-gray-500">Run by: {cert.report.userName || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${cert.report.overallScore >= 90 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                            Score: {cert.report.overallScore}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                        {new Date(cert.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => handleCopy(cert.id)} className="text-primary-light hover:text-primary flex items-center gap-1.5">
                                                <LinkIcon />
                                                {copiedId === cert.id ? 'Copied!' : 'Copy Link'}
                                            </button>
                                            <button onClick={() => handleRevoke(cert.id)} className="text-gray-500 hover:text-danger flex items-center gap-1.5">
                                               <TrashIcon />
                                                Revoke
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {certificates.length === 0 && (
                         <div className="text-center py-12">
                            <CertificateIcon />
                            <h3 className="mt-2 text-lg font-semibold text-white">No Certificates Yet</h3>
                            <p className="mt-1 text-sm text-gray-400">Share a report from the dashboard to create your first certificate.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CertificatesHub;