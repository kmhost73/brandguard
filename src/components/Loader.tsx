import React from 'react';

interface LoaderProps {
  text?: string;
  size?: 'sm' | 'md';
}

const Loader: React.FC<LoaderProps> = ({ text, size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-5 w-5 border-2',
    md: 'h-16 w-16 border-2',
  };

  const insetClasses = {
    sm: 'inset-1',
    md: 'inset-2',
  };

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div className={`relative ${size === 'md' ? 'h-16 w-16' : 'h-6 w-6'}`}>
        {/* Outer static ring */}
        <div className={`absolute inset-0 border-primary/20 rounded-full ${sizeClasses[size]}`}></div>
        {/* Main spinning arc */}
        <div className={`absolute inset-0 border-t-primary rounded-full animate-spin ${sizeClasses[size]} border-t-2`}></div>
        {/* Inner reverse-spinning arc */}
        <div className={`absolute border-b-primary-light rounded-full animate-spin-reverse ${sizeClasses[size]} ${insetClasses[size]} border-b-2`}></div>
      </div>
      {text && size === 'md' && <p className="text-gray-400 mt-4">{text}</p>}
    </div>
  );
};

export default Loader;