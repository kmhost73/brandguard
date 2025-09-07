import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import Dashboard from './components/Dashboard';
import PublicReportView from './components/PublicReportView';
import type { ComplianceReport } from './types';

type View = 'landing' | 'dashboard';

const UserModal: React.FC<{ onSave: (name: string) => void }> = ({ onSave }) => {
    const [name, setName] = useState('');
    const handleSave = () => {
        if (name.trim()) {
            onSave(name.trim());
        }
    };
    return (
        <div className="fixed inset-0 bg-dark/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-secondary-dark p-8 rounded-lg shadow-2xl border border-gray-700 w-full max-w-sm text-center animate-fade-in">
                <h2 className="text-2xl font-bold text-white">Welcome to BrandGuard</h2>
                <p className="text-gray-400 mt-2">Please enter your name to continue. This will be used to track who runs reports.</p>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                    placeholder="Enter your name..."
                    className="w-full mt-6 p-3 border border-gray-600 rounded-md bg-dark text-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition"
                    autoFocus
                />
                <button
                    onClick={handleSave}
                    disabled={!name.trim()}
                    className="w-full mt-4 px-6 py-3 bg-primary text-white font-bold rounded-md hover:bg-primary-dark disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-lg"
                >
                    Save & Continue
                </button>
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const [view, setView] = useState<View>('landing');
  const [sharedReport, setSharedReport] = useState<ComplianceReport | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

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
    } else {
        const storedUser = localStorage.getItem('brandGuardUser');
        if (storedUser) {
            setCurrentUser(storedUser);
        } else {
            setIsUserModalOpen(true);
        }
    }
  }, []);

  useEffect(() => {
    document.body.classList.add('bg-dark');
  }, []);

  const handleSaveUser = (name: string) => {
      localStorage.setItem('brandGuardUser', name);
      setCurrentUser(name);
      setIsUserModalOpen(false);
  };
  
  const handleChangeUser = () => {
      localStorage.removeItem('brandGuardUser');
      setCurrentUser(null);
      setIsUserModalOpen(true);
  }

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
  
  if (!currentUser && isUserModalOpen) {
      return <UserModal onSave={handleSaveUser} />
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
          <Dashboard currentUser={currentUser} />
        )}
      </main>
      <footer className="text-center p-8 mt-12 border-t border-white/10">
        <p className={`text-sm text-gray-400`}>
          &copy; 2024 BrandGuard. All rights reserved. 
          {currentUser && (
              <span className="ml-2">
                  | Logged in as <strong className="font-semibold text-white">{currentUser}</strong>. 
                  <button onClick={handleChangeUser} className="ml-2 text-primary-light hover:underline">Change User</button>
              </span>
          )}
        </p>
      </footer>
    </div>
  );
};

export default App;