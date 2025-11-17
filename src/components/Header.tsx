import React from 'react';
import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/clerk-react";
import { BrandGuardLogoIcon } from './icons/Icons';
import type { Workspace, MainView } from '../types';
import WorkspaceSwitcher from './WorkspaceSwitcher';

interface HeaderProps {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  onCreateWorkspace: (name: string) => void;
  onChangeWorkspace: (id: string) => void;
  onNavigate: (view: MainView) => void;
}

const Header: React.FC<Partial<HeaderProps>> = ({
  workspaces,
  activeWorkspaceId,
  onCreateWorkspace,
  onChangeWorkspace,
  onNavigate,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-dark/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <a href="/" className="flex-shrink-0 flex items-center gap-3 cursor-pointer">
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
                  onNavigate={onNavigate}
                />
              )}
            </SignedIn>
          </div>
          <nav className="flex items-center gap-6">
            <SignedIn>
              <button onClick={() => onNavigate && onNavigate('dashboard')} className="font-medium transition-colors text-gray-300 hover:text-white hidden sm:inline">
                Dashboard
              </button>
              <button onClick={() => onNavigate && onNavigate('brief-studio')} className="font-medium transition-colors text-gray-300 hover:text-white hidden sm:inline">
                Brief Studio
              </button>
              <button onClick={() => onNavigate && onNavigate('image-studio')} className="font-medium transition-colors text-gray-300 hover:text-white hidden sm:inline">
                Image Studio
              </button>
              <button onClick={() => onNavigate && onNavigate('video-studio')} className="font-medium transition-colors text-gray-300 hover:text-white hidden sm:inline">
                Video Studio
              </button>
               <button onClick={() => onNavigate && onNavigate('certificates')} className="font-medium transition-colors text-gray-300 hover:text-white hidden sm:inline">
                Certificates
              </button>
              <button onClick={() => onNavigate && onNavigate('pricing')} className="font-medium transition-colors text-gray-300 hover:text-white hidden sm:inline">
                Pricing
              </button>
            </SignedIn>
            <SignedOut>
              <a href="/pricing" className="font-medium transition-colors text-gray-300 hover:text-white">
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
