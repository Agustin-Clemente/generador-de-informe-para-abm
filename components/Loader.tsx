
import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 border-4 border-brand-secondary border-t-transparent rounded-full animate-spin"></div>
        <h3 className="mt-4 text-lg font-semibold text-gray-700">Analizando archivo...</h3>
        <p className="text-gray-500">Analizando FTW.</p>
    </div>
  );
};

export default Loader;
