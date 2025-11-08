import React from 'react';
import type { ComplianceReport, CheckItem } from '../types';
import { TrendingUpIcon, CalculatorIcon, ScaleIcon, AlertTriangleIcon } from './icons/Icons';

interface AnalyticsProps {
  reportHistory: ComplianceReport[];
}

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; color: string; }> = ({ icon, title, value, color }) => (
  <div className="bg-secondary-dark p-3 rounded-lg shadow-sm border border-gray-700 flex items-center space-x-3">
    <div className={`rounded-full p-2 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-400 font-medium">{title}</p>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  </div>
);

const ComplianceLineChart: React.FC<{ data: ComplianceReport[] }> = ({ data }) => {
    if (data.length < 2) {
        return <div className="h-40 flex items-center justify-center text-gray-500 text-sm">Not enough data for trend.</div>;
    }

    const chartHeight = 160; // Corresponds to h-40
    const chartWidth = 500; // An arbitrary width for path calculation, SVG will scale
    const points = data.map((report, i) => {
        const x = (i / (data.length - 1)) * chartWidth;
        const y = chartHeight - (report.overallScore / 100) * chartHeight;
        return { x, y, score: report.overallScore };
    });

    const pathD = "M" + points.map(p => `${p.x},${p.y}`).join(" L");
    
    const areaPathD = `${pathD} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;

    return (
        <div className="h-40 w-full">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38B2AC" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#38B2AC" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d={areaPathD} fill="url(#areaGradient)" />
                <path d={pathD} fill="none" stroke="#38B2AC" strokeWidth="2" />
                {points.map((p, i) => (
                    <g key={i} className="group">
                        <circle cx={p.x} cy={p.y} r="8" fill="#38B2AC" fillOpacity="0" className="cursor-pointer" />
                        <circle cx={p.x} cy={p.y} r="4" fill="#38B2AC" className="transition-transform duration-200 group-hover:scale-150" />
                        <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                           <rect x={p.x - 20} y={p.y - 35} width="40" height="25" rx="4" fill="#1A202C" stroke="#4A5568" strokeWidth="1" />
                           <text x={p.x} y={p.y - 18} textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="bold">{p.score}%</text>
                        </g>
                    </g>
                ))}
            </svg>
        </div>
    );
};

const Analytics: React.FC<AnalyticsProps> = ({ reportHistory }) => {
  if (reportHistory.length === 0) {
    return (
      <div className="bg-secondary-dark rounded-lg shadow-sm border border-gray-700 p-8 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Performance Analytics</h2>
        <p className="text-gray-400">Run your first analysis to see your compliance stats here.</p>
      </div>
    );
  }

  const totalScans = reportHistory.length;
  const averageScore = Math.round(reportHistory.reduce((acc, r) => acc + r.overallScore, 0) / totalScans);
  const passRate = Math.round((reportHistory.filter(r => r.overallScore >= 90).length / totalScans) * 100);
  
  const allFailedChecks = reportHistory.flatMap(r => r.checks.filter(c => c.status === 'fail' || c.status === 'warn'));
  // FIX: The `reduce` call was not correctly typed, causing downstream errors.
  // Casting the initial empty object `{}` to `Record<string, number>` ensures
  // the accumulator `acc` is properly typed, allowing for correct property
  // access and type inference for `failureCounts`.
  const failureCounts = allFailedChecks.reduce((acc, check) => {
    const checkName = check.name.split(':')[0].trim(); // Group custom rules together
    acc[checkName] = (acc[checkName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostCommonIssue = Object.entries(failureCounts).sort(([, a], [, b]) => b - a)[0];
  const failureAnalysis = Object.entries(failureCounts)
        .map(([name, count]) => ({ name, count, percentage: allFailedChecks.length > 0 ? Math.round((count / allFailedChecks.length) * 100) : 0 }))
        .sort((a, b) => b.count - a.count);


  const chartData = reportHistory.slice(0, 7).reverse();

  return (
    <div className="space-y-3">
       <h2 className="text-md font-bold text-white">Performance Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<ScaleIcon />} title="Total Scans" value={totalScans} color="bg-primary/10 text-primary-light" />
        <StatCard icon={<CalculatorIcon />} title="Average Score" value={`${averageScore}%`} color="bg-yellow-500/10 text-warning" />
        <StatCard icon={<TrendingUpIcon />} title="Overall Pass Rate" value={`${passRate}%`} color="bg-green-500/10 text-success" />
        <StatCard 
            icon={<AlertTriangleIcon />} 
            title="Most Common Issue" 
            value={mostCommonIssue ? mostCommonIssue[0] : 'None'} 
            color="bg-red-500/10 text-danger" 
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-secondary-dark p-3 rounded-lg shadow-sm border border-gray-700">
            <h3 className="text-sm font-semibold text-white mb-2">Compliance Over Time (Last 7 Reports)</h3>
            <ComplianceLineChart data={chartData} />
        </div>
        <div className="bg-secondary-dark p-3 rounded-lg shadow-sm border border-gray-700">
            <h3 className="text-sm font-semibold text-white mb-3">Failure Analysis</h3>
             {failureAnalysis.length > 0 ? (
                <div className="space-y-1.5">
                    {failureAnalysis.map(({ name, percentage, count }) => (
                         <div key={name}>
                            <div className="flex justify-between mb-1">
                                <span className="text-xs font-medium text-gray-300">{name} ({count})</span>
                                <span className="text-xs font-medium text-gray-400">{percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-1.5">
                                <div className="bg-danger h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-500">No failed checks recorded.</div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
