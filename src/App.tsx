import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import Dashboard from './components/Dashboard';
import PublicReportView from './components/PublicReportView';
import type { ComplianceReport } from './types';

type View = 'landing' | 'dashboard';

const App: React.FC = () => {
  const [view, setView] = useState<View>('landing');
  const [sharedReport, setSharedReport] = useState<ComplianceReport | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reportData = params.get('report');
    if (reportData) {
      try {
        const decodedReport = JSON.parse(atob(reportData));
        setSharedReport(decodedReport);
      } catch (e) {
        console.error("Failed to parse shared report data from URL", e);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);


  const navigateTo = useCallback((newView: View) => {
    if (window.location.search) {
        window.history.pushState({}, document.title, window.location.pathname);
    }
    setSharedReport(null);
    setView(newView);
  }, []);

  if (sharedReport) {
    return <PublicReportView report={sharedReport} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header navigateTo={navigateTo} />
      <main>
        {view === 'landing' ? (
          <>
            <Hero navigateToDashboard={() => navigateTo('dashboard')} />
            <Features />
          </>
        ) : (
          <Dashboard />
        )}
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>&copy; 2024 BrandGuard AI. All rights reserved. An AI-founded company.</p>
      </footer>
    </div>
  );
};

export default App;
