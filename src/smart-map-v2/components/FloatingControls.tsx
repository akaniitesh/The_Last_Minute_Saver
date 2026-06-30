import React from "react";
import { useLocation } from "../hooks/useLocation";
import { useMap } from "../hooks/useMap";
import { Compass, Moon, Sun, Plus, Minus } from "lucide-react";

export const FloatingControls: React.FC = () => {
  const { isLocating, refreshLocation } = useLocation();
  const { config, setZoom, toggleDarkMode } = useMap();

  const handleZoomIn = () => {
    setZoom(Math.min(19, config.zoom + 1));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(3, config.zoom - 1));
  };

  return (
    <div className="absolute bottom-6 right-6 flex flex-col space-y-2 z-30 shrink-0">
      {/* Locate Me */}
      <button
        onClick={refreshLocation}
        disabled={isLocating}
        title="Locate Me / Centering"
        className="flex items-center justify-center w-10 h-10 rounded-full bg-white hover:bg-neutral-50 active:bg-neutral-100 shadow-lg border border-neutral-100 text-indigo-600 transition-all disabled:opacity-50"
      >
        <Compass className={`w-5 h-5 ${isLocating ? "animate-spin" : ""}`} />
      </button>

      {/* Dark Mode toggle */}
      <button
        onClick={toggleDarkMode}
        title="Toggle Map Dark Mode"
        className="flex items-center justify-center w-10 h-10 rounded-full bg-white hover:bg-neutral-50 shadow-lg border border-neutral-100 text-neutral-600 transition-all"
      >
        {config.isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Zoom In */}
      <button
        onClick={handleZoomIn}
        title="Zoom In"
        className="flex items-center justify-center w-10 h-10 rounded-full bg-white hover:bg-neutral-50 shadow-lg border border-neutral-100 text-neutral-600 transition-all"
      >
        <Plus className="w-5 h-5" />
      </button>

      {/* Zoom Out */}
      <button
        onClick={handleZoomOut}
        title="Zoom Out"
        className="flex items-center justify-center w-10 h-10 rounded-full bg-white hover:bg-neutral-50 shadow-lg border border-neutral-100 text-neutral-600 transition-all"
      >
        <Minus className="w-5 h-5" />
      </button>
    </div>
  );
};
export default FloatingControls;
