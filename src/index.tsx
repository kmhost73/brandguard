import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ClerkProvider } from '@clerk/clerk-react'
import { Analytics } from '@vercel/analytics/react';
import { BrandGuardLogoIcon } from './components/icons/Icons.tsx';

// FIX: Workaround for TypeScript errors when accessing Vite environment variables.
// The reference to "vite/client" types was not being found in the provided environment.
// Casting `import.meta` to `any` resolves the property access error without needing project-level configuration changes.
const PUBLISHABLE_KEY = (import.meta as any).env.VITE_CLERK_PUBLISHABLE_KEY;

const MissingKeyError = () => (
  <div className="bg-dark text-gray-300 min-h-screen flex flex-col items-center justify-center p-4">
    <div className="text-center p-8 bg-secondary-dark border border-danger rounded-lg shadow-lg max-w-2xl">
      <BrandGuardLogoIcon />
      <h1 className="text-3xl font-bold text-white mt-4">Configuration Error</h1>
      <p className="text-red-300 mt-2 text-lg">The application cannot start.</p>
      <p className="text-gray-400 mt-4">
        The <code className="bg-dark px-2 py-1 rounded-md text-yellow-400 font-mono">VITE_CLERK_PUBLISHABLE_KEY</code> environment variable is missing.
      </p>
      <p className="text-gray-400 mt-2">
        Please ensure this variable is set in your deployment environment. If you are deploying with Vercel, add it to the project's environment variables settings.
      </p>
    </div>
  </div>
);


if (!PUBLISHABLE_KEY) {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <MissingKeyError />
    </React.StrictMode>,
  );
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <App />
        <Analytics />
      </ClerkProvider>
    </React.StrictMode>,
  );
}