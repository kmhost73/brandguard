
import React from 'react';
import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/clerk-react";
import { BrandGuardLogoIcon } from './icons/Icons';
import type { Workspace, MainView } from '../types';
import WorkspaceSwitcher from './WorkspaceSwitcher';

interface HeaderProps {
  workspaces?: Workspace[];
  activeWorkspaceId?: string;
  onCreateWorkspace?: (name: string) => void;
  onChangeWorkspace?: (id: string) => void;
  onNavigate?: (view: MainView, path: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  workspaces,
  activeWorkspaceId,
  onCreateWorkspace,
  onChangeWorkspace,
  onNavigate,
}) => {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, view: MainView, path: string) => {
    e.preventDefault();
    onNavigate?.(view, path);
  };

  return (
    <header className="sticky top-0 z-50 bg-dark/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <a href="/" onClick={(e) => handleNavClick(e, 'dashboard', '/')} className="flex-shrink-0 flex items-center gap-3 cursor-pointer">
              <BrandGuardLogoIcon />
              <span className="text-2xl font-bold text-white hidden sm:inline">BrandGuard</span>
            </a>
            <SignedIn>
              {workspaces && activeWorkspaceId && onCreateWorkspace && onChangeWorkspace && onNavigate && (
                <WorkspaceSwitcher 
                  workspaces={workspaces}
                  activeWorkspaceId={activeWorkspaceId}
                  onCreateWorkspace={onCreateWorkspace}
                  onChangeWorkspace={onChangeWorkspace}
                  onNavigate={(view) => onNavigate(view, `/${view}`.replace('/dashboard', ''))}
                />
              )}
            </SignedIn>
          </div>
          <nav className="flex items-center gap-6">
            <SignedIn>
               <a href="/" onClick={(e) => handleNavClick(e, 'dashboard', '/')} className="font-medium transition-colors text-gray-300 hover:text-white hidden sm:inline">
                Dashboard
              </a>
              <a href="/brief-studio" onClick={(e) => handleNavClick(e, 'brief-studio', '/brief-studio')} className="font-medium transition-colors text-gray-300 hover:text-white hidden sm:inline">
                Brief Studio
              </a>
              <a href="/image-studio" onClick={(e) => handleNavClick(e, 'image-studio', '/image-studio')} className="font-medium transition-colors text-gray-300 hover:text-white hidden sm:inline">
                Image Analysis
              </a>
              <a href="/video-studio" onClick={(e) => handleNavClick(e, 'video-studio', '/video-studio')} className="font-medium transition-colors text-gray-300 hover:text-white hidden sm:inline">
                Video Studio
              </a>
               <a href="/certificates" onClick={(e) => handleNavClick(e, 'certificates', '/certificates')} className="font-medium transition-colors text-gray-300 hover:text-white hidden sm:inline">
                Certificates
              </a>
              <a href="/pricing" onClick={(e) => handleNavClick(e, 'pricing', '/pricing')} className="font-medium transition-colors text-gray-300 hover:text-white hidden sm:inline">
                Pricing
              </a>
            </SignedIn>
            <SignedOut>
              <a href="/pricing" onClick={(e) => handleNavClick(e, 'pricing', '/pricing')} className="font-medium transition-colors text-gray-300 hover:text-white">
                Pricing
              </a>
              <SignInButton mode="modal">
                <button className="font-medium transition-colors text-gray-300 hover:text-white">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition-colors">
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
