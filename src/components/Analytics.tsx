import React from 'react';
import type { ComplianceReport } from '../types';
import { TrendingUpIcon, CalculatorIcon, ScaleIcon } from './icons/Icons';

interface AnalyticsProps {
  reportHistory: ComplianceReport[];
}

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; color: string; }> = ({ icon, title, value, color }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
    <div className={`rounded-full p-3 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const Analytics: React.FC<AnalyticsProps> = ({ reportHistory }) => {
  if (reportHistory.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Performance Analytics</h2>
        <p className="text-gray-500">Run your first analysis to see your compliance stats here.</p>
      </div>
    );
  }

  const totalScans = reportHistory.length;
  const averageScore = Math.round(reportHistory.reduce((acc, r) => acc + r.overallScore, 0) / totalScans);
  const passRate = Math.round((reportHistory.filter(r => r.overallScore >= 90).length / totalScans) * 100);

  const chartData = reportHistory.slice(0, 7).reverse();

  return (
    <div className="space-y-6">
       <h2 className="text-2xl font-bold text-gray-800">Performance Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard icon={<ScaleIcon />} title="Total Scans" value={totalScans} color="bg-blue-100 text-blue-600" />
        <StatCard icon={<CalculatorIcon />} title="Average Score" value={`${averageScore}%`} color="bg-yellow-100 text-yellow-600" />
        <StatCard icon={<TrendingUpIcon />} title="Overall Pass Rate" value={`${passRate}%`} color="bg-green-100 text-green-600" />
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Compliance Over Time (Last 7 Reports)</h3>
        <div className="h-64 flex items-end justify-around space-x-2 pt-4 border-t border-gray-200">
            {chartData.map(report => {
                const barColor = report.overallScore >= 90 ? 'bg-success' : report.overallScore >= 60 ? 'bg-warning' : 'bg-danger';
                return (
                    <div key={report.id} className="flex-1 flex flex-col items-center group">
                         <div className="relative w-full h-full flex items-end">
                            <div
                                className={`w-full rounded-t-md transition-all duration-300 ${barColor}`}
                                style={{ height: `${report.overallScore}%` }}
                            >
                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {report.overallScore}%
                                </span>
                            </div>
                        </div>
                        <p className={`mt-2 text-xs text-gray-500 font-medium`}>{report.analysisType.charAt(0).toUpperCase()}</p>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default Analytics;