import React, { useState, useEffect, lazy, Suspense } from 'react';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import Header from './components/Header';
import Loader from './components/Loader';
import type { ComplianceReport, Workspace, CustomRule, MainView, Certificate, RevisionRequest } from './types';

const Hero = lazy(() => import('./components/Hero'));
const Features = lazy(() => import('./components/Features'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const PublicReportView = lazy(() => import('./components/PublicReportView'));
const RevisionRequestView = lazy(() => import('./components/RevisionRequestView'));
const WorkspaceSettings = lazy(() => import('./components/WorkspaceSettings'));
const CertificatesHub = lazy(() => import('./components/CertificatesHub'));
const TestingSandbox = lazy(() => import('./components/TestingSandbox'));
const BriefStudio = lazy(() => import('./components/BriefStudio'));
const Analytics = lazy(() => import('./components/Analytics'));
const VideoStudio = lazy(() => import('./components/VideoStudio'));


const FullPageLoader: React.FC = () => (
  <div className="flex items-center justify-center py-20">
    <Loader />
  </div>
);

const getReportHistory = (workspaceId: string): ComplianceReport[] => {
    try {
        const historyJson = localStorage.getItem(`brandGuardReportHistory_${workspaceId}`);
        if (!historyJson) return [];
        const history = JSON.parse(historyJson);
        return history.map((report: any) => ({
            ...report,
            status: report.status || 'pending'
        }));
    } catch (e) { return []; }
};

const saveReportHistory = (workspaceId: string, history: ComplianceReport[]) => {
    localStorage.setItem(`brandGuardReportHistory_${workspaceId}`, JSON.stringify(history));
}

const App: React.FC = () => {
  const [sharedReport, setSharedReport] = useState<ComplianceReport | null | 'invalid'>(null);
  const [sharedRevisionRequest, setSharedRevisionRequest] = useState<ComplianceReport | null | 'invalid'>(null);
  const { user, isLoaded } = useUser();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [mainView, setMainView] = useState<MainView>('dashboard');
  const [customRules, setCustomRules] = useState<CustomRule[]>([]);
  const [reportHistory, setReportHistory] = useState<ComplianceReport[]>([]);


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

  // Effect to load custom rules and report history when active workspace changes
  useEffect(() => {
    if (activeWorkspaceId) {
      try {
        const rulesJson = localStorage.getItem(`brandGuardCustomRules_${activeWorkspaceId}`);
        setCustomRules(rulesJson ? JSON.parse(rulesJson) : []);
      } catch (e) { 
        setCustomRules([]);
      }
      setReportHistory(getReportHistory(activeWorkspaceId));
    }
  }, [activeWorkspaceId]);

  const handleUpdateRules = (rules: CustomRule[]) => {
    setCustomRules(rules);
    if(activeWorkspaceId) {
        localStorage.setItem(`brandGuardCustomRules_${activeWorkspaceId}`, JSON.stringify(rules));
    }
  };

  const handleUpdateHistory = (history: ComplianceReport[]) => {
      setReportHistory(history);
      if (activeWorkspaceId) {
          saveReportHistory(activeWorkspaceId, history);
      }
  }

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
    setMainView('dashboard'); // Always return to dashboard on workspace switch
  };

  const handleRenameWorkspace = (id: string, newName: string) => {
    const updatedWorkspaces = workspaces.map(w => w.id === id ? { ...w, name: newName } : w);
    setWorkspaces(updatedWorkspaces);
    localStorage.setItem('brandGuardWorkspaces', JSON.stringify(updatedWorkspaces));
  };
  
  const handleDeleteWorkspace = (id: string) => {
    const remainingWorkspaces = workspaces.filter(w => w.id !== id);
    
    // Clean up associated data
    localStorage.removeItem(`brandGuardReportHistory_${id}`);
    localStorage.removeItem(`brandGuardCustomRules_${id}`);
    localStorage.removeItem(`brandGuardCertificates_${id}`);
    localStorage.removeItem(`brandGuardRevisionRequests_${id}`);

    if (remainingWorkspaces.length > 0) {
        setWorkspaces(remainingWorkspaces);
        localStorage.setItem('brandGuardWorkspaces', JSON.stringify(remainingWorkspaces));
        // If the deleted workspace was active, switch to the first remaining one
        if (activeWorkspaceId === id) {
            handleChangeWorkspace(remainingWorkspaces[0].id);
        }
    } else {
        // If no workspaces are left, create a new default one
        const newDefaultWorkspace = { id: crypto.randomUUID(), name: 'Personal Workspace' };
        setWorkspaces([newDefaultWorkspace]);
        localStorage.setItem('brandGuardWorkspaces', JSON.stringify([newDefaultWorkspace]));
        handleChangeWorkspace(newDefaultWorkspace.id);
    }
  };

  const handleCreateCertificate = (report: ComplianceReport) => {
    const newCertificate: Certificate = {
      id: `cert_${crypto.randomUUID()}`,
      report: report,
      createdAt: new Date().toISOString()
    };
    
    const certsJson = localStorage.getItem(`brandGuardCertificates_${report.workspaceId}`);
    const certificates: Certificate[] = certsJson ? JSON.parse(certsJson) : [];
    certificates.unshift(newCertificate);
    localStorage.setItem(`brandGuardCertificates_${report.workspaceId}`, JSON.stringify(certificates));

    const url = `${window.location.origin}${window.location.pathname}?certId=${newCertificate.id}`;
    navigator.clipboard.writeText(url);
    
    return "Certificate Link Copied!";
  };

  const handleRevokeCertificate = (workspaceId: string, certId: string) => {
      const certsJson = localStorage.getItem(`brandGuardCertificates_${workspaceId}`);
      if (!certsJson) return;
      let certificates: Certificate[] = JSON.parse(certsJson);
      certificates = certificates.filter(c => c.id !== certId);
      localStorage.setItem(`brandGuardCertificates_${workspaceId}`, JSON.stringify(certificates));
  };

  const handleCreateRevisionRequest = (report: ComplianceReport) => {
    const newRequest: RevisionRequest = {
      id: `rev_${crypto.randomUUID()}`,
      report: report,
      createdAt: new Date().toISOString()
    };
    
    const requestsJson = localStorage.getItem(`brandGuardRevisionRequests_${report.workspaceId}`);
    const requests: RevisionRequest[] = requestsJson ? JSON.parse(requestsJson) : [];
    requests.unshift(newRequest);
    localStorage.setItem(`brandGuardRevisionRequests_${report.workspaceId}`, JSON.stringify(requests));

    const url = `${window.location.origin}${window.location.pathname}?revId=${newRequest.id}`;
    navigator.clipboard.writeText(url);
    
    return "Revision Request Link Copied!";
  };
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const certId = params.get('certId');
    const revId = params.get('revId');

    if (certId) {
      let found = false;
      const allWorkspacesJson = localStorage.getItem('brandGuardWorkspaces');
      if (allWorkspacesJson) {
        const allWorkspaces: Workspace[] = JSON.parse(allWorkspacesJson);
        for (const workspace of allWorkspaces) {
          const certsJson = localStorage.getItem(`brandGuardCertificates_${workspace.id}`);
          if (certsJson) {
            const certificates: Certificate[] = JSON.parse(certsJson);
            const foundCert = certificates.find(c => c.id === certId);
            if (foundCert) {
              setSharedReport(foundCert.report);
              found = true;
              break;
            }
          }
        }
      }
      if (!found) setSharedReport('invalid');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (revId) {
      let found = false;
      const allWorkspacesJson = localStorage.getItem('brandGuardWorkspaces');
      if (allWorkspacesJson) {
        const allWorkspaces: Workspace[] = JSON.parse(allWorkspacesJson);
        for (const workspace of allWorkspaces) {
          const requestsJson = localStorage.getItem(`brandGuardRevisionRequests_${workspace.id}`);
          if (requestsJson) {
            const requests: RevisionRequest[] = JSON.parse(requestsJson);
            const foundReq = requests.find(r => r.id === revId);
            if (foundReq) {
              setSharedRevisionRequest(foundReq.report);
              found = true;
              break;
            }
          }
        }
      }
      if (!found) setSharedRevisionRequest('invalid');
      window.history.replaceState({}, document.title, window.location.pathname);
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

  if (sharedRevisionRequest) {
    return (
      <Suspense fallback={<FullPageLoader />}>
        <RevisionRequestView report={sharedRevisionRequest} />
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
  
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  return (
    <div className={`min-h-screen font-sans bg-dark text-gray-300`}>
      <Header 
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onCreateWorkspace={handleCreateWorkspace}
        onChangeWorkspace={handleChangeWorkspace}
        onNavigate={setMainView}
      />
      <main>
        <Suspense fallback={<FullPageLoader />}>
          <SignedIn>
             {
              {
                'dashboard': <Dashboard key={activeWorkspaceId} activeWorkspaceId={activeWorkspaceId} customRules={customRules} reportHistory={reportHistory} onUpdateHistory={handleUpdateHistory} onCreateCertificate={handleCreateCertificate} onNavigate={setMainView} revisionRequests={[]} onCreateRevisionRequest={handleCreateRevisionRequest} />,
                'video-studio': activeWorkspaceId ? <VideoStudio key={activeWorkspaceId} activeWorkspaceId={activeWorkspaceId} customRules={customRules} onNavigate={setMainView} reportHistory={reportHistory} onUpdateHistory={handleUpdateHistory} /> : <FullPageLoader />,
                'settings': activeWorkspace ? <WorkspaceSettings key={activeWorkspaceId} activeWorkspace={activeWorkspace} customRules={customRules} onUpdateRules={handleUpdateRules} onRenameWorkspace={handleRenameWorkspace} onDeleteWorkspace={handleDeleteWorkspace} onNavigate={setMainView} /> : <FullPageLoader />,
                'certificates': activeWorkspaceId ? <CertificatesHub key={activeWorkspaceId} activeWorkspaceId={activeWorkspaceId} onRevokeCertificate={handleRevokeCertificate} onNavigate={setMainView} /> : <FullPageLoader />,
                'sandbox': <TestingSandbox onNavigate={setMainView} />,
                'brief-studio': activeWorkspaceId ? <BriefStudio key={activeWorkspaceId} activeWorkspaceId={activeWorkspaceId} customRules={customRules} onNavigate={setMainView} /> : <FullPageLoader />,
                'analytics': activeWorkspaceId ? <Analytics reportHistory={reportHistory} /> : <FullPageLoader />,
              }[mainView]
            }
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