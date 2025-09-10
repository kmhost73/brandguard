import React from 'react';
import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/clerk-react";
import { BrandGuardLogoIcon } from './icons/Icons';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-dark/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex-shrink-0 flex items-center gap-3 cursor-pointer">
            <BrandGuardLogoIcon />
            <span className="text-2xl font-bold text-white">BrandGuard</span>
          </a>
          <nav className="flex items-center gap-4">
            <SignedIn>
              <a href="/" className="font-medium transition-colors text-gray-300 hover:text-white">
                Dashboard
              </a>
            </SignedIn>
            <SignedOut>
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