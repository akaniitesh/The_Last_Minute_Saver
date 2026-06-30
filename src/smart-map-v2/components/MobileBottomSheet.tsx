import React, { useState, useContext } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SmartMapContext } from "../context/SmartMapContext";
import { RoutePanel } from "./RoutePanel";
import { PlannerPanel } from "./PlannerPanel";
import { ReminderPanel } from "./ReminderPanel";
import { SavedPlaces } from "./SavedPlaces";
import { MiloDock } from "./MiloDock";
import { Map, Calendar, Bookmark, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { Task } from "../../types";

interface MobileBottomSheetProps {
  tasks: Task[];
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({ tasks }) => {
  const context = useContext(SmartMapContext);
  if (!context) return null;

  const { isMobileOpen, setIsMobileOpen, selectedPlace } = context;
  const [activeSubTab, setActiveSubTab] = useState<"route" | "schedule" | "places" | "milo">(
    selectedPlace ? "route" : "schedule"
  );

  if (!isMobileOpen) {
    return (
      <button
        onClick={() => setIsMobileOpen(true)}
        className="absolute bottom-6 left-1/2 transform -translate-x-1/2 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-full shadow-2xl flex items-center gap-2 z-30 shrink-0 border border-indigo-500 animate-bounce"
      >
        <Map className="w-4 h-4" />
        Explore Map Options
      </button>
    );
  }

  const subTabs = [
    { id: "route" as const, name: "Directions", icon: <Map className="w-4 h-4" /> },
    { id: "schedule" as const, name: "Schedule", icon: <Calendar className="w-4 h-4" /> },
    { id: "places" as const, name: "Saved", icon: <Bookmark className="w-4 h-4" /> },
    { id: "milo" as const, name: "Assistant", icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <AnimatePresence>
      <motion.div
        id="mobile-bottom-sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className="absolute bottom-0 left-0 right-0 max-h-[75dvh] bg-white rounded-t-3xl shadow-2xl border-t border-neutral-150 z-40 flex flex-col overflow-hidden"
      >
        {/* Swipe Handle Bar */}
        <div
          onClick={() => setIsMobileOpen(false)}
          className="flex flex-col items-center justify-center py-3 cursor-pointer select-none shrink-0"
        >
          <div className="w-12 h-1 bg-neutral-300 rounded-full mb-1"></div>
          <ChevronDown className="w-4 h-4 text-neutral-400" />
        </div>

        {/* Tab Headers */}
        <div className="grid grid-cols-4 border-b border-neutral-100 bg-neutral-50/50 shrink-0">
          {subTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveSubTab(t.id)}
              className={`flex flex-col items-center justify-center py-2.5 border-b-2 transition-all ${
                activeSubTab === t.id
                  ? "border-indigo-600 text-indigo-600 font-semibold"
                  : "border-transparent text-neutral-500"
              }`}
            >
              {t.icon}
              <span className="text-[10px] mt-1">{t.name}</span>
            </button>
          ))}
        </div>

        {/* Tab Contents Frame */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeSubTab === "route" && <RoutePanel />}
          {activeSubTab === "schedule" && (
            <div className="space-y-4">
              <ReminderPanel />
              <PlannerPanel tasks={tasks} />
            </div>
          )}
          {activeSubTab === "places" && <SavedPlaces />}
          {activeSubTab === "milo" && <MiloDock />}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
export default MobileBottomSheet;
