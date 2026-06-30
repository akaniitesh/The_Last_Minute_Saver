import React from "react";

interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = "Calculating Route..." }) => {
  return (
    <div id="loading-overlay-container" className="absolute inset-0 bg-neutral-900/40 backdrop-blur-[2px] z-20 flex items-center justify-center animate-in fade-in duration-200">
      <div className="flex flex-col items-center bg-white px-5 py-4 rounded-2xl shadow-xl border border-neutral-100 max-w-xs text-center space-y-3">
        {/* Modern Double Ring Spinner */}
        <div className="relative flex items-center justify-center w-8 h-8">
          <div className="absolute w-full h-full rounded-full border-2 border-indigo-100"></div>
          <div className="absolute w-full h-full rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
        </div>
        
        <p className="text-xs font-semibold text-neutral-700">
          {message}
        </p>
      </div>
    </div>
  );
};
export default LoadingOverlay;
