import React from "react";
import { Compass, Search, Calendar, Landmark } from "lucide-react";

export const EmptyState: React.FC = () => {
  return (
    <div id="smart-map-empty-state" className="flex flex-col items-center justify-center py-12 px-6 bg-white rounded-2xl border border-neutral-100/60 shadow-sm max-w-sm mx-auto text-center space-y-4">
      <div className="flex items-center justify-center w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full">
        <Compass className="w-6 h-6 animate-spin" style={{ animationDuration: "12s" }} />
      </div>

      <div>
        <h4 className="text-sm font-bold text-neutral-800">
          Smart Navigation Workspace
        </h4>
        <p className="text-xs text-neutral-400 font-medium leading-relaxed mt-1">
          Plan your departure schedules, match calendar tasks, and navigate efficiently.
        </p>
      </div>

      <div className="w-full flex flex-col space-y-2 pt-2 text-left">
        <div className="flex items-start p-2 hover:bg-neutral-50 rounded-xl transition-all">
          <Search className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5 mr-3" />
          <div>
            <p className="text-xs font-semibold text-neutral-700">Instant Search</p>
            <p className="text-[10px] text-neutral-400">Search for any city, ATM, library or hospital.</p>
          </div>
        </div>

        <div className="flex items-start p-2 hover:bg-neutral-50 rounded-xl transition-all">
          <Calendar className="w-4 h-4 text-purple-500 shrink-0 mt-0.5 mr-3" />
          <div>
            <p className="text-xs font-semibold text-neutral-700">Calendar Integration</p>
            <p className="text-[10px] text-neutral-400">Sync with today's scheduled tasks & leave times.</p>
          </div>
        </div>

        <div className="flex items-start p-2 hover:bg-neutral-50 rounded-xl transition-all">
          <Landmark className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 mr-3" />
          <div>
            <p className="text-xs font-semibold text-neutral-700">Milo Commands</p>
            <p className="text-[10px] text-neutral-400">Ask Milo to find a place or calculate a route.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default EmptyState;
