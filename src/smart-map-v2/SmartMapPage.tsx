import React, { useContext, useEffect, useState } from "react";
import { SmartMapProvider, SmartMapContext } from "./context/SmartMapContext";
import { useResponsiveLayout } from "./hooks/useResponsiveLayout";
import { useLocation } from "./hooks/useLocation";
import { GeocodingService } from "./services/geocoding";
import { eventBus } from "../milo-v2";

// Import sub-components
import { MapCanvas } from "./components/MapCanvas";
import { SearchBar } from "./components/SearchBar";
import { MapToolbar } from "./components/MapToolbar";
import { RoutePanel } from "./components/RoutePanel";
import { PlannerPanel } from "./components/PlannerPanel";
import { ReminderPanel } from "./components/ReminderPanel";
import { SavedPlaces } from "./components/SavedPlaces";
import { MiloDock } from "./components/MiloDock";
import { NavigationCard } from "./components/NavigationCard";
import { FloatingControls } from "./components/FloatingControls";
import { MobileBottomSheet } from "./components/MobileBottomSheet";
import { EmptyState } from "./components/EmptyState";
import { Task } from "../types";
import { Menu, X, Sparkles, Navigation } from "lucide-react";

interface SmartMapPageProps {
  tasks: Task[];
  onAddTask?: (task: Omit<Task, "id">) => void;
  onUpdateTask?: (task: Task) => void;
}

const SmartMapPageContent: React.FC<SmartMapPageProps> = ({ tasks }) => {
  const { isDesktop, isTablet, isMobile } = useResponsiveLayout();
  const { refreshLocation, currentAddress } = useLocation();
  const context = useContext(SmartMapContext);

  if (!context) return null;

  const {
    setSelectedPlace,
    selectedPlace,
    isMobileOpen,
    setIsMobileOpen,
    currentLocation,
  } = context;

  const [tabletSidebarOpen, setTabletSidebarOpen] = useState<boolean>(true);

  // 1. Locate User on Mount
  useEffect(() => {
    refreshLocation();
  }, []);

  // 2. Co-Pilot / Milo Integration: Intercept navigate requests
  useEffect(() => {
    const unsubscribe = eventBus.on("map_navigate", async (payload: any) => {
      if (payload && payload.destination) {
        try {
          const results = await GeocodingService.searchLocations(payload.destination, currentLocation);
          if (results.length > 0) {
            setSelectedPlace(results[0]);
            // If on mobile, slide bottom sheet open to Route summary
            if (isMobile) {
              setIsMobileOpen(true);
            }
          }
        } catch (err) {
          console.error("Milo navigate integration geocoding failed", err);
        }
      }
    });

    return () => unsubscribe();
  }, [currentLocation, isMobile, setSelectedPlace, setIsMobileOpen]);

  return (
    <div id="smart-map-root-layout" className="flex flex-col w-full h-[calc(100dvh-64px)] overflow-hidden bg-neutral-50 text-neutral-800">
      
      {/* Dynamic Sub-header Info rail */}
      <div className="flex items-center justify-between px-6 py-2 bg-white border-b border-neutral-150 shrink-0 text-xs">
        <div className="flex items-center space-x-2 text-neutral-500 font-semibold">
          <Navigation className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
          <span>Active Origin:</span>
          <strong className="text-neutral-800 truncate max-w-[220px] sm:max-w-md">{currentAddress}</strong>
        </div>

        {isTablet && (
          <button
            onClick={() => setTabletSidebarOpen(!tabletSidebarOpen)}
            className="flex items-center gap-1.5 px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-lg transition-all font-semibold"
          >
            {tabletSidebarOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
            {tabletSidebarOpen ? "Collapse Info" : "Expand Info"}
          </button>
        )}
      </div>

      {/* Main stage wrapper */}
      <div className="flex-1 flex w-full overflow-hidden relative">
        
        {/* A. Map Viewport Canvas with Floating controls overlays */}
        <div className="flex-1 h-full relative overflow-hidden">
          
          {/* Top Overlaid Headers */}
          <div className="absolute top-4 left-4 right-4 z-30 pointer-events-none flex flex-col gap-3">
            <div className="pointer-events-auto">
              <SearchBar />
            </div>
            <div className="pointer-events-auto">
              <MapToolbar />
            </div>
          </div>

          {/* Map canvas itself */}
          <MapCanvas />

          {/* Navigation Overlay */}
          <NavigationCard />

          {/* Bottom Right Floating controls */}
          <FloatingControls />

          {/* Mobile Bottom Sheet Overlay */}
          {isMobile && <MobileBottomSheet tasks={tasks} />}
        </div>

        {/* B. Desktop Sidebar Panel (25% width) */}
        {isDesktop && (
          <div className="w-[380px] h-full bg-white border-l border-neutral-200 flex flex-col overflow-y-auto p-4 space-y-4 shrink-0 shadow-sm">
            <RoutePanel />
            <ReminderPanel />
            <PlannerPanel tasks={tasks} />
            <SavedPlaces />
            <MiloDock />
          </div>
        )}

        {/* C. Tablet Sidebar Panel (collapsible) */}
        {isTablet && tabletSidebarOpen && (
          <div className="absolute top-0 right-0 w-[340px] h-full bg-white/95 backdrop-blur-md border-l border-neutral-200 flex flex-col overflow-y-auto p-4 space-y-4 shrink-0 z-30 shadow-2xl animate-in slide-in-from-right-4 duration-200">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Map Summary</span>
              <button onClick={() => setTabletSidebarOpen(false)} className="p-1 hover:bg-neutral-100 rounded-full">
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            <RoutePanel />
            <ReminderPanel />
            <PlannerPanel tasks={tasks} />
            <SavedPlaces />
            <MiloDock />
          </div>
        )}
      </div>
    </div>
  );
};

export const SmartMapPage: React.FC<SmartMapPageProps> = (props) => {
  return (
    <SmartMapProvider>
      <SmartMapPageContent {...props} />
    </SmartMapProvider>
  );
};

export default SmartMapPage;
