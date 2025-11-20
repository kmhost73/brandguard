
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
const PricingPage = lazy(() => import('./components/PricingPage'));
const BlogPost2 = lazy(() => import('./components/BlogPost2'));


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

  const setViewFromPath = (path: string) => {
    // Basic normalization
    const cleanPath = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;

    // Direct map for simple routes
    const pathMap: Record<string, MainView> = {
      '/pricing': 'pricing',
      '/blog/ftc-disclosure-rules-2024': 'blog-post',
      '/blog/ai-ftc-compliance-influencer-marketing-2025': 'blog-post-2',
      '/settings': 'settings',
    };
    
    const view = pathMap[cleanPath] || 'dashboard';
    setMainView(view);
  };

  const handleNavigate = (view: MainView, path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({ view }, '', path);
    }
    setMainView(view);
  };

  useEffect(() => {
    const onPopState = () => setViewFromPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Consolidated initialization logic
  useEffect(() => {
    const initializeAppAndRouting = async () => {
      setIsInitializing(true);

      // 1. Check for shared content links first, as they are standalone views
      const params = new URLSearchParams(window.location.search);
      const certId = params.get('certId');
      if (certId) {
        const foundCert = await db.getCertificateById(certId);
        setSharedReport(foundCert ? foundCert.report : 'invalid');
        window.history.replaceState({}, document.title, '/');
        setIsInitializing(false);
        return;
      }
      const revId = params.get('revId');
      if (revId) {
        const foundReq = await db.getRevisionRequestById(revId);
        setSharedRevisionRequest(foundReq ? foundReq : 'invalid');
        window.history.replaceState({}, document.title, '/');
        setIsInitializing(false);
        return;
      }

      // 2. Initialize database and workspaces
      await db.migrateFromLocalStorage();
      let workspaces = await db.getWorkspaces();
      if (workspaces.length === 0) {
        const defaultWorkspace = { id: crypto.randomUUID(), name: 'Personal Workspace' };
        await db.addWorkspace(defaultWorkspace);
        workspaces = [defaultWorkspace];
      }

      const lastActiveId = localStorage.getItem('brandGuardActiveWorkspaceId');
      if (lastActiveId && workspaces.some(w => w.id === lastActiveId)) {
        setActiveWorkspaceId(lastActiveId);
      } else {
        const firstWorkspaceId = workspaces[0].id;
        setActiveWorkspaceId(firstWorkspaceId);
        localStorage.setItem('brandGuardActiveWorkspaceId', firstWorkspaceId);
      }
      
      // 3. Set view based on path, now that app state is ready
      setViewFromPath(window.location.pathname);
      
      setIsInitializing(false);
    };

    initializeAppAndRouting();
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
    handleNavigate('dashboard', '/');
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
  
  if (!isLoaded || (user && (isInitializing || !activeWorkspaceId || !workspaces))) {
    return (
      <div className="min-h-screen font-sans bg-dark text-gray-300"><Header onNavigate={(v, p) => handleNavigate(v,p)} /><main><FullPageLoader /></main></div>
    );
  }

  return (
    <div className={`min-h-screen font-sans bg-dark text-gray-300`}>
      <Header 
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onCreateWorkspace={handleCreateWorkspace}
        onChangeWorkspace={handleChangeWorkspace}
        onNavigate={(v, p) => handleNavigate(v, p)}
      />
      <main>
        <Suspense fallback={<FullPageLoader />}>
          <SignedIn>
             {
              {
                'dashboard': <Dashboard key={activeWorkspaceId} activeWorkspaceId={activeWorkspaceId} customRules={customRules || []} reportHistory={reportHistory || []} onUpdateReportStatus={handleUpdateReportStatus} onUpdateReportInsight={handleUpdateReportInsight} onDeleteReport={handleDeleteReport} onCreateCertificate={handleCreateCertificate} onNavigate={(v, p) => handleNavigate(v,p)} onCreateRevisionRequest={handleCreateRevisionRequest} />,
                'settings': activeWorkspace ? <WorkspaceSettings key={activeWorkspaceId} activeWorkspace={activeWorkspace} customRules={customRules || []} onUpdateRules={handleUpdateRules} onRenameWorkspace={handleRenameWorkspace} onDeleteWorkspace={handleDeleteWorkspace} onNavigate={(v,p) => handleNavigate(v,p)} /> : <FullPageLoader />,
                'blog-post': <BlogPost onNavigate={(v,p) => handleNavigate(v,p)} />,
                'blog-post-2': <BlogPost2 onNavigate={(v,p) => handleNavigate(v,p)} />,
                'pricing': <PricingPage onNavigate={(v,p) => handleNavigate(v,p)} />,
                // Fallback for deprecated routes if they are somehow reached via history
                'brief-studio': <Dashboard key={activeWorkspaceId} activeWorkspaceId={activeWorkspaceId} customRules={customRules || []} reportHistory={reportHistory || []} onUpdateReportStatus={handleUpdateReportStatus} onUpdateReportInsight={handleUpdateReportInsight} onDeleteReport={handleDeleteReport} onCreateCertificate={handleCreateCertificate} onNavigate={(v, p) => handleNavigate(v,p)} onCreateRevisionRequest={handleCreateRevisionRequest} />,
                'image-studio': <Dashboard key={activeWorkspaceId} activeWorkspaceId={activeWorkspaceId} customRules={customRules || []} reportHistory={reportHistory || []} onUpdateReportStatus={handleUpdateReportStatus} onUpdateReportInsight={handleUpdateReportInsight} onDeleteReport={handleDeleteReport} onCreateCertificate={handleCreateCertificate} onNavigate={(v, p) => handleNavigate(v,p)} onCreateRevisionRequest={handleCreateRevisionRequest} />,
                'video-studio': <Dashboard key={activeWorkspaceId} activeWorkspaceId={activeWorkspaceId} customRules={customRules || []} reportHistory={reportHistory || []} onUpdateReportStatus={handleUpdateReportStatus} onUpdateReportInsight={handleUpdateReportInsight} onDeleteReport={handleDeleteReport} onCreateCertificate={handleCreateCertificate} onNavigate={(v, p) => handleNavigate(v,p)} onCreateRevisionRequest={handleCreateRevisionRequest} />,
                'certificates': <Dashboard key={activeWorkspaceId} activeWorkspaceId={activeWorkspaceId} customRules={customRules || []} reportHistory={reportHistory || []} onUpdateReportStatus={handleUpdateReportStatus} onUpdateReportInsight={handleUpdateReportInsight} onDeleteReport={handleDeleteReport} onCreateCertificate={handleCreateCertificate} onNavigate={(v, p) => handleNavigate(v,p)} onCreateRevisionRequest={handleCreateRevisionRequest} />,
              }[mainView]
            }
             <FeedbackWidget activeWorkspaceId={activeWorkspaceId} />
          </SignedIn>
          <SignedOut>
            {
              {
                'pricing': <PricingPage onNavigate={(v,p) => handleNavigate(v,p)} />,
                'blog-post': <BlogPost onNavigate={(v,p) => handleNavigate(v,p)} />,
                'blog-post-2': <BlogPost2 onNavigate={(v,p) => handleNavigate(v,p)} />,
              }[mainView] || (
                <>
                  <Hero />
                  <Features />
                </>
              )
            }
          </SignedOut>
        </Suspense>
      </main>
      <footer className="text-center p-8 mt-12 border-t border-white/10">
        <p className={`text-sm text-gray-400`}>
          &copy; {new Date().getFullYear()} BrandGuard. All rights reserved.
          <span className="mx-2">|</span>
          <a href="/blog/ftc-disclosure-rules-2024" onClick={(e) => { e.preventDefault(); handleNavigate('blog-post', '/blog/ftc-disclosure-rules-2024'); }} className="hover:text-white transition-colors">
            FTC Guide 2024
          </a>
          <span className="mx-2">|</span>
          <a href="/blog/ai-ftc-compliance-influencer-marketing-2025" onClick={(e) => { e.preventDefault(); handleNavigate('blog-post-2', '/blog/ai-ftc-compliance-influencer-marketing-2025'); }} className="hover:text-white transition-colors">
             AI Compliance 2025
          </a>
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
