import React, { useState, useEffect, lazy, Suspense } from 'react';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import { useLiveQuery } from 'dexie-react-hooks';
import Header from './components/Header';
import Loader from './components/Loader';
import type { ComplianceReport, Workspace, CustomRule, MainView, Certificate, RevisionRequest } from './types';
import * as db from './services/dbService';

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
const ImageStudio = lazy(() => import('./components/ImageStudio'));
const FeedbackWidget = lazy(() => import('./components/FeedbackWidget'));
const BlogPost = lazy(() => import('./components/BlogPost'));


const FullPageLoader: React.FC = () => (
  <div className="flex items-center justify-center py-20">
    <Loader />
  </div>
);

const App: React.FC = () => {
  const [sharedReport, setSharedReport] = useState<ComplianceReport | null | 'invalid'>(null);
  const [sharedRevisionRequest, setSharedRevisionRequest] = useState<RevisionRequest | null | 'invalid'>(null);
  const { user, isLoaded } = useUser();
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [mainView, setMainView] = useState<MainView>('dashboard');
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize workspaces and perform one-time migration for existing users
  useEffect(() => {
    const initializeApp = async () => {
        await db.migrateFromLocalStorage();
        let workspaces = await db.getWorkspaces();
        if (workspaces.length === 0) {
            const defaultWorkspace = { id: crypto.randomUUID(), name: 'Personal Workspace' };
            await db.addWorkspace(defaultWorkspace);
            workspaces = [defaultWorkspace];
        }

        const lastActiveId = localStorage.getItem('brandGuardActiveWorkspaceId'); // Still use LS for non-critical session state
        if (lastActiveId && workspaces.some(w => w.id === lastActiveId)) {
            setActiveWorkspaceId(lastActiveId);
        } else {
            const firstWorkspaceId = workspaces[0].id;
            setActiveWorkspaceId(firstWorkspaceId);
            localStorage.setItem('brandGuardActiveWorkspaceId', firstWorkspaceId);
        }
        setIsInitializing(false);
    };
    initializeApp();
  }, []);

  const workspaces = useLiveQuery(() => db.getWorkspaces(), []);
  const customRules = useLiveQuery(() => activeWorkspaceId ? db.getRulesForWorkspace(activeWorkspaceId) : [], [activeWorkspaceId]);
  const reportHistory = useLiveQuery(() => activeWorkspaceId ? db.getReportsForWorkspace(activeWorkspaceId) : [], [activeWorkspaceId]);

  const handleUpdateRules = (rules: CustomRule[]) => {
    if(activeWorkspaceId) {
        db.updateRules(rules, activeWorkspaceId);
    }
  };

  const handleUpdateReportStatus = (reportId: string, status: ComplianceReport['status']) => {
    db.updateReport(reportId, { status });
  };
  
  const handleUpdateReportInsight = (reportId: string, insight: string) => {
    db.updateReport(reportId, { strategicInsight: insight });
  };

  const handleDeleteReport = (reportId: string) => {
    db.deleteReport(reportId);
  }

  const handleCreateWorkspace = async (name: string) => {
    const newWorkspace = { id: crypto.randomUUID(), name };
    await db.addWorkspace(newWorkspace);
    handleChangeWorkspace(newWorkspace.id);
  };

  const handleChangeWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
    localStorage.setItem('brandGuardActiveWorkspaceId', id);
    setMainView('dashboard');
  };

  const handleRenameWorkspace = (id: string, newName: string) => {
    db.updateWorkspace(id, { name: newName });
  };
  
  const handleDeleteWorkspace = async (id: string) => {
    await db.deleteWorkspaceAndData(id);
    const remaining = await db.getWorkspaces();
    if (remaining.length > 0) {
        if (activeWorkspaceId === id) {
            handleChangeWorkspace(remaining[0].id);
        }
    } else {
        const newDefaultWorkspace = { id: crypto.randomUUID(), name: 'Personal Workspace' };
        await db.addWorkspace(newDefaultWorkspace);
        handleChangeWorkspace(newDefaultWorkspace.id);
    }
  };

  const handleCreateCertificate = async (report: ComplianceReport) => {
    const newCertificate: Certificate = {
      id: `cert_${crypto.randomUUID()}`,
      workspaceId: report.workspaceId,
      report: report,
      createdAt: new Date().toISOString()
    };
    await db.addCertificate(newCertificate);
    const url = `${window.location.origin}${window.location.pathname}?certId=${newCertificate.id}`;
    navigator.clipboard.writeText(url);
    return "Certificate Link Copied!";
  };

  const handleCreateRevisionRequest = async (report: ComplianceReport) => {
    const newRequest: RevisionRequest = {
      id: `rev_${crypto.randomUUID()}`,
      workspaceId: report.workspaceId,
      report: report,
      createdAt: new Date().toISOString(),
      status: 'pending',
      revisedContent: ''
    };
    await db.addRevisionRequest(newRequest);
    const url = `${window.location.origin}${window.location.pathname}?revId=${newRequest.id}`;
    navigator.clipboard.writeText(url);
    return "Revision Request Link Copied!";
  };
  
  useEffect(() => {
    const checkSharedLinks = async () => {
        const params = new URLSearchParams(window.location.search);
        const certId = params.get('certId');
        const revId = params.get('revId');
        const view = params.get('view');


        if (view === 'blog') {
            setMainView('blog-post');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        else if (certId) {
            const foundCert = await db.getCertificateById(certId);
            setSharedReport(foundCert ? foundCert.report : 'invalid');
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (revId) {
            const foundReq = await db.getRevisionRequestById(revId);
            setSharedRevisionRequest(foundReq ? foundReq : 'invalid');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    };
    checkSharedLinks();
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
    return <Suspense fallback={<FullPageLoader />}><PublicReportView report={sharedReport} /></Suspense>;
  }

  if (sharedRevisionRequest) {
    return <Suspense fallback={<FullPageLoader />}><RevisionRequestView revisionRequest={sharedRevisionRequest} /></Suspense>;
  }
  
  const activeWorkspace = workspaces ? workspaces.find(w => w.id === activeWorkspaceId) : null;
  const isSignedOutAndOnBlog = !user && mainView === 'blog-post';

  // For SignedOut users, we need a header on the blog page.
  if (isSignedOutAndOnBlog) {
    return (
      <div className={`min-h-screen font-sans bg-dark text-gray-300`}>
        <Header />
        <main>
          <Suspense fallback={<FullPageLoader />}>
            <BlogPost onNavigate={setMainView} />
          </Suspense>
        </main>
      </div>
    );
  }

  if (isInitializing || !activeWorkspaceId || !workspaces) {
    return (
      <div className="min-h-screen font-sans bg-dark text-gray-300"><Header /><main><FullPageLoader /></main></div>
    );
  }

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
                'dashboard': <Dashboard key={activeWorkspaceId} activeWorkspaceId={activeWorkspaceId} customRules={customRules || []} reportHistory={reportHistory || []} onUpdateReportStatus={handleUpdateReportStatus} onUpdateReportInsight={handleUpdateReportInsight} onDeleteReport={handleDeleteReport} onCreateCertificate={handleCreateCertificate} onNavigate={setMainView} onCreateRevisionRequest={handleCreateRevisionRequest} />,
                'brief-studio': activeWorkspaceId ? <BriefStudio key={activeWorkspaceId} activeWorkspaceId={activeWorkspaceId} customRules={customRules || []} onNavigate={setMainView} /> : <FullPageLoader />,
                'video-studio': activeWorkspaceId ? <VideoStudio key={activeWorkspaceId} activeWorkspaceId={activeWorkspaceId} customRules={customRules || []} onNavigate={setMainView} onUpdateReportInsight={handleUpdateReportInsight} /> : <FullPageLoader />,
                'image-studio': activeWorkspaceId ? <ImageStudio key={activeWorkspaceId} onNavigate={setMainView} /> : <FullPageLoader />,
                'settings': activeWorkspace ? <WorkspaceSettings key={activeWorkspaceId} activeWorkspace={activeWorkspace} customRules={customRules || []} onUpdateRules={handleUpdateRules} onRenameWorkspace={handleRenameWorkspace} onDeleteWorkspace={handleDeleteWorkspace} onNavigate={setMainView} /> : <FullPageLoader />,
                'certificates': activeWorkspaceId ? <CertificatesHub key={activeWorkspaceId} activeWorkspaceId={activeWorkspaceId} onNavigate={setMainView} /> : <FullPageLoader />,
                'blog-post': <BlogPost onNavigate={setMainView} />,
              }[mainView]
            }
             <FeedbackWidget activeWorkspaceId={activeWorkspaceId} />
          </SignedIn>
          <SignedOut>
            <Hero />
            <Features />
          </SignedOut>
        </Suspense>
      </main>
      <footer className="text-center p-8 mt-12 border-t border-white/10">
        <p className={`text-sm text-gray-400`}>
          &copy; {new Date().getFullYear()} BrandGuard. All rights reserved.
          <span className="mx-2">|</span>
          <button onClick={() => setMainView('blog-post')} className="hover:text-white transition-colors">
            Blog
          </button>
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