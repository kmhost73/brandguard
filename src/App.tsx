import React, { useState, useEffect, lazy, Suspense } from 'react';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import Header from './components/Header';
import Loader from './components/Loader';
import type { ComplianceReport, Workspace } from './types';

const Hero = lazy(() => import('./components/Hero'));
const Features = lazy(() => import('./components/Features'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const PublicReportView = lazy(() => import('./components/PublicReportView'));

const FullPageLoader: React.FC = () => (
  <div className="flex items-center justify-center py-20">
    <Loader />
  </div>
);

const App: React.FC = () => {
  const [sharedReport, setSharedReport] = useState<ComplianceReport | null>(null);
  const { user, isLoaded } = useUser();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  // Initialize workspaces and perform one-time migration for existing users
  useEffect(() => {
    const allWorkspacesJson = localStorage.getItem('brandGuardWorkspaces');
    let allWorkspaces: Workspace[] = allWorkspacesJson ? JSON.parse(allWorkspacesJson) : [];

    if (allWorkspaces.length === 0) {
      const defaultWorkspace = { id: crypto.randomUUID(), name: 'Personal Workspace' };
      allWorkspaces = [defaultWorkspace];
      localStorage.setItem('brandGuardWorkspaces', JSON.stringify(allWorkspaces));

      // One-time migration of old data
      const oldHistoryJson = localStorage.getItem('brandGuardReportHistory');
      if (oldHistoryJson) {
        const oldHistory = JSON.parse(oldHistoryJson);
        const migratedHistory = oldHistory.map((report: Omit<ComplianceReport, 'workspaceId'>) => ({
          ...report,
          workspaceId: defaultWorkspace.id,
        }));
        localStorage.setItem(`brandGuardReportHistory_${defaultWorkspace.id}`, JSON.stringify(migratedHistory));
        localStorage.removeItem('brandGuardReportHistory'); // Clean up old key
      }
    }
    
    setWorkspaces(allWorkspaces);

    const lastActiveId = localStorage.getItem('brandGuardActiveWorkspaceId');
    if (lastActiveId && allWorkspaces.some(w => w.id === lastActiveId)) {
      setActiveWorkspaceId(lastActiveId);
    } else {
      const firstWorkspaceId = allWorkspaces[0].id;
      setActiveWorkspaceId(firstWorkspaceId);
      localStorage.setItem('brandGuardActiveWorkspaceId', firstWorkspaceId);
    }

  }, []);

  const handleCreateWorkspace = (name: string) => {
    const newWorkspace = { id: crypto.randomUUID(), name };
    const updatedWorkspaces = [...workspaces, newWorkspace];
    setWorkspaces(updatedWorkspaces);
    localStorage.setItem('brandGuardWorkspaces', JSON.stringify(updatedWorkspaces));
    handleChangeWorkspace(newWorkspace.id);
  };

  const handleChangeWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
    localStorage.setItem('brandGuardActiveWorkspaceId', id);
  };

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

  useEffect(() => {
    document.body.classList.add('bg-dark');
  }, []);

  useEffect(() => {
    if (isLoaded && user) {
      const name = user.firstName || user.fullName || user.emailAddresses[0]?.emailAddress || 'Anonymous';
      if (name !== 'Anonymous') {
        localStorage.setItem('brandGuardUser', name);
      }
    }
  }, [user, isLoaded]);

  if (sharedReport) {
    return (
      <Suspense fallback={<FullPageLoader />}>
        <PublicReportView report={sharedReport} />
      </Suspense>
    );
  }

  if (!activeWorkspaceId) {
    // Render a loading state while workspaces are being initialized
    return (
      <div className={`min-h-screen font-sans bg-dark text-gray-300`}>
        <Header />
        <main>
          <FullPageLoader />
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans bg-dark text-gray-300`}>
      <Header 
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onCreateWorkspace={handleCreateWorkspace}
        onChangeWorkspace={handleChangeWorkspace}
      />
      <main>
        <Suspense fallback={<FullPageLoader />}>
          <SignedIn>
            <Dashboard key={activeWorkspaceId} activeWorkspaceId={activeWorkspaceId} />
          </SignedIn>
          <SignedOut>
            <Hero />
            <Features />
          </SignedOut>
        </Suspense>
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
