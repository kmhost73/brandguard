import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-accent"></div>
      <p className="mt-4 text-slate-light">AI is analyzing the content...</p>
    </div>
  );
};

export default Loader;