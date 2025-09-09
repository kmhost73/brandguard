import React, { useState, useEffect } from 'react';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import Dashboard from './components/Dashboard';
import PublicReportView from './components/PublicReportView';
import type { ComplianceReport } from './types';

const App: React.FC = () => {
  const [sharedReport, setSharedReport] = useState<ComplianceReport | null>(null);
  const { user, isLoaded } = useUser();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reportData = params.get('report');
    if (reportData) {
      try {
        const decodedReport = JSON.parse(atob(reportData));
        setSharedReport(decodedReport);
      } catch (e) {
        console.error("Failed to parse shared report data from URL", e);
        // Clear the bad URL param to avoid loops
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    document.body.classList.add('bg-dark');
  }, []);

  // Storing the username in localStorage when the user changes.
  // This helps persist the 'Run by' name on reports for the demo.
  useEffect(() => {
    // Wait for Clerk to be loaded and user to be available
    if (isLoaded && user) {
      const name = user.firstName || user.fullName || user.emailAddresses[0]?.emailAddress || 'Anonymous';
      if (name !== 'Anonymous') {
        localStorage.setItem('brandGuardUser', name);
      }
    }
  }, [user, isLoaded]);

  if (sharedReport) {
    return <PublicReportView report={sharedReport} />;
  }

  return (
    <div className={`min-h-screen font-sans bg-dark text-gray-300`}>
      <Header />
      <main>
        <SignedIn>
          <Dashboard />
        </SignedIn>
        <SignedOut>
          <Hero />
          <Features />
        </SignedOut>
      </main>
      <footer className="text-center p-8 mt-12 border-t border-white/10">
        <p className={`text-sm text-gray-400`}>
          &copy; 2024 BrandGuard. All rights reserved.
          <SignedIn>
            <div className="inline-block align-middle ml-4">
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </p>
      </footer>
    </div>
  );
};

export default App;
