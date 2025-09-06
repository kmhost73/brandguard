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

  // Effect to manage body class for dark/light themes
  useEffect(() => {
    const body = document.body;
    body.classList.add('bg-dark');
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
    <div className={`min-h-screen font-sans bg-dark text-gray-300`}>
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
      <footer className="text-center p-8 mt-12 border-t border-white/10">
        <p className={`text-sm text-gray-400`}>
          &copy; 2024 BrandGuard. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default App;