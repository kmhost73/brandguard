import React from 'react';
import type { ComplianceReport, CheckItem } from '../types';
import { CheckIcon, WarningIcon, XIcon } from './icons/Icons';
import { SignUpButton } from '@clerk/clerk-react';

const statusConfig = {
  pass: { icon: <CheckIcon />, color: 'text-success', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30' },
  warn: { icon: <WarningIcon />, color: 'text-warning', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30' },
  fail: { icon: <XIcon />, color: 'text-danger', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' },
};

const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-success';
  if (score >= 60) return 'text-warning';
  return 'text-danger';
};

const CheckItemCard: React.FC<{ item: CheckItem }> = ({ item }) => {
  const config = statusConfig[item.status];
  return (
    <div className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor} flex items-start space-x-4`}>
      <div className={`flex-shrink-0 w-6 h-6 ${config.color}`}>{config.icon}</div>
      <div>
        <h4 className="font-semibold text-gray-200 flex items-center">{item.name}</h4>
        <p className="text-gray-400">{item.details}</p>
      </div>
    </div>
  );
};

interface PublicReportCardProps {
  report: ComplianceReport;
}

const PublicReportCard: React.FC<PublicReportCardProps> = ({ report }) => {
  return (
    <div className="bg-secondary-dark shadow-lg rounded-lg overflow-hidden animate-fade-in border border-gray-700">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h2 className="text-2xl font-bold text-white">Public Audit Report</h2>
                <p className="text-sm text-gray-400">This is a limited report. Sign up for full features.</p>
            </div>
            <div className={`text-lg font-bold px-4 py-2 rounded-md ${getScoreColor(report.overallScore)} ${report.overallScore >= 90 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                Score: {report.overallScore}
            </div>
        </div>
        <div className="bg-dark p-4 rounded-lg border border-gray-700 mb-6">
            <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">Engine Summary</h3>
            <p className="text-gray-300">{report.summary}</p>
        </div>
        
        <h3 className="text-lg font-semibold text-white mb-4">Detailed Checks</h3>
        <div className="space-y-4">{report.checks.map((item, index) => (<CheckItemCard key={index} item={item} />))}</div>
      </div>
      
      <div className="p-6 border-t border-gray-700 bg-dark/50 text-center">
        <h4 className="text-lg font-bold text-white">Unlock Your Full Compliance Toolkit</h4>
        <p className="text-gray-400 mt-2 max-w-lg mx-auto">Sign up to access Magic Fix revisions, shareable certificates, custom rules, and unlimited scans.</p>
        <SignUpButton mode="modal">
            <button className="mt-4 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark transition-transform transform hover:scale-105">
                Create Your Free Account
            </button>
        </SignUpButton>
      </div>
    </div>
  );
};

export default PublicReportCard;
