import React from 'react';

interface LoaderProps {
  text?: string;
}

const Loader: React.FC<LoaderProps> = ({ text = "Analyzing..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative h-16 w-16">
        {/* Outer static ring */}
        <div className="absolute inset-0 border-2 border-primary/20 rounded-full"></div>
        {/* Main spinning arc */}
        <div className="absolute inset-0 border-t-2 border-t-primary rounded-full animate-spin"></div>
        {/* Inner reverse-spinning arc */}
        <div className="absolute inset-2 border-b-2 border-b-primary-light rounded-full animate-spin-reverse"></div>
      </div>
      <p className="text-gray-400">{text}</p>
    </div>
  );
};

export default Loader;