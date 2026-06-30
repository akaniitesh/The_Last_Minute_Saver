import React, { useContext } from "react";
import { SmartMapContext } from "../context/SmartMapContext";
import { useNavigation } from "../hooks/useNavigation";
import { formatDistance, formatDuration } from "../utils/format";
import { Compass, X, CheckCircle, Play, Pause, AlertTriangle, CheckCircle2, Navigation, Award, MapPin } from "lucide-react";

export const NavigationCard: React.FC = () => {
  const context = useContext(SmartMapContext);
  if (!context) return null;

  const { selectedPlace, routeInfo } = context;
  const { 
    navigationState, 
    startNavigation, 
    stopNavigation, 
    pauseNavigation, 
    resumeNavigation,
    resetToIdle
  } = useNavigation();

  // If status is IDLE or TRIP_PLANNED, do not render any navigation overlay card
  if (navigationState.status === "IDLE" || navigationState.status === "TRIP_PLANNED" || !selectedPlace || !routeInfo) {
    return null;
  }

  // Formatting helpers
  const formatTravelTime = (totalSeconds: number): string => {
    if (totalSeconds < 60) {
      return `${totalSeconds}s`;
    }
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const getETA = (minutes: number): string => {
    const arrivalTime = new Date(Date.now() + minutes * 60 * 1000);
    return arrivalTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // 1. READY TO START STATE
  if (navigationState.status === "READY_TO_START") {
    return (
      <div 
        id="ready-to-start-overlay" 
        className="absolute top-4 left-4 right-4 sm:right-auto sm:w-[360px] bg-white border border-neutral-200 text-neutral-800 rounded-2xl shadow-2xl p-4 z-40 animate-in slide-in-from-top-4 duration-200"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600">Prepare Departure</h4>
          </div>
          <button 
            onClick={stopNavigation}
            className="p-1 hover:bg-neutral-100 rounded-full text-neutral-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 text-center">
          <Compass className="w-12 h-12 text-indigo-500 mx-auto mb-2 animate-pulse" />
          <p className="text-sm font-bold text-neutral-800">Press Start Navigation</p>
          <p className="text-xs text-neutral-500 mt-1 max-w-[280px] mx-auto">
            Ready to commute to <b>{selectedPlace.name}</b>. GPS tracking is primed and waiting.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={startNavigation}
            className="flex-1 py-2 px-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5"
          >
            <Navigation className="w-3.5 h-3.5" />
            Start Navigation
          </button>
          <button
            onClick={stopNavigation}
            className="py-2 px-3 text-xs font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // 2. NAVIGATING STATE (ACTIVE NAVIGATION)
  if (navigationState.status === "NAVIGATING") {
    const currentStep = navigationState.steps[navigationState.stepIndex] || "Head out towards destination";
    const progressPercent = navigationState.progress;
    const remainingDistance = navigationState.remainingDistanceKm;
    const remainingDuration = navigationState.remainingDurationMin;
    const speed = navigationState.currentSpeedKmH;

    // Premium visual guidance indicator text
    const laneGuidanceText = navigationState.stepIndex === 0 
      ? "Lane Guidance: Any lane. Prepare to pull out."
      : navigationState.stepIndex === 1
      ? "Lane Guidance: Use the right-most lane to turn."
      : "Lane Guidance: Maintain center lane.";

    const isSpeedStationary = speed === "Stationary" || speed === 0;

    return (
      <div 
        id="active-nav-overlay" 
        className="absolute top-4 left-4 right-4 sm:right-auto sm:w-[360px] bg-indigo-950 text-white rounded-2xl shadow-2xl border border-indigo-900 p-4 z-40 animate-in slide-in-from-top-4 duration-200"
      >
        {/* Navigation Status Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-900 text-emerald-400">
              <Compass 
                className={`w-5 h-5 ${!isSpeedStationary ? "animate-spin" : ""}`} 
                style={{ animationDuration: "5s" }} 
              />
            </div>
            <div>
              <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-1">
                Live GPS Guidance
                {navigationState.isActive ? (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ) : (
                  <span className="text-amber-400 font-semibold">(PAUSED)</span>
                )}
              </p>
              <p className="text-xs font-semibold text-neutral-100 truncate max-w-[180px]">
                to {selectedPlace.name}
              </p>
            </div>
          </div>

          <button
            onClick={stopNavigation}
            className="p-1.5 hover:bg-indigo-900 rounded-full text-indigo-300 transition-colors"
            title="End navigation"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Turn Step Instruction */}
        <div className="flex items-start bg-indigo-900/50 rounded-xl p-3.5 mt-3 border border-indigo-800/40">
          <div className="text-2xl mr-3 shrink-0">
            {navigationState.stepIndex === 1 ? "↪️" : navigationState.stepIndex === 3 ? "↩️" : "⬆️"}
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Next Instruction</p>
            <p className="text-xs font-semibold text-neutral-100 mt-0.5 leading-snug">{currentStep}</p>
          </div>
        </div>

        {/* Lane Guidance */}
        <div className="bg-indigo-900/30 text-[10px] text-indigo-200 font-semibold py-1 px-3 mt-2 rounded-lg border border-indigo-800/20 truncate">
          {laneGuidanceText}
        </div>

        {/* Real Metrics progression */}
        <div className="flex flex-col mt-4 space-y-2.5">
          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-indigo-300">REMAINING</span>
              <span className="text-lg font-bold text-neutral-50 tracking-tight">
                {formatDistance(remainingDistance)}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-indigo-300">ETA / ARRIVAL</span>
              <span className="text-xs font-bold text-emerald-400">
                {formatDuration(remainingDuration)} ({getETA(remainingDuration)})
              </span>
            </div>
          </div>

          {/* Core GPS-Driven Progress Bar */}
          <div className="w-full h-2 bg-indigo-900/80 rounded-full overflow-hidden border border-indigo-800">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-indigo-200 mt-0.5 font-bold">
            <span className="flex items-center">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mr-1 shrink-0" />
              {progressPercent}% Complete
            </span>
            <span className="bg-indigo-900 px-2 py-0.5 rounded text-neutral-50 border border-indigo-800">
              Speed: {isSpeedStationary ? "Stationary (0 km/h)" : `${speed} km/h`}
            </span>
          </div>
        </div>

        {/* Dynamic Controls */}
        <div className="flex gap-2 mt-4 pt-1 border-t border-indigo-900">
          {navigationState.isActive ? (
            <button
              onClick={pauseNavigation}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 px-3 text-[11px] font-bold text-indigo-100 bg-indigo-900 hover:bg-indigo-800 rounded-lg transition-all border border-indigo-800"
            >
              <Pause className="w-3.5 h-3.5" />
              Pause GPS
            </button>
          ) : (
            <button
              onClick={resumeNavigation}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 px-3 text-[11px] font-bold text-indigo-950 bg-emerald-400 hover:bg-emerald-500 rounded-lg transition-all"
            >
              <Play className="w-3.5 h-3.5" />
              Resume GPS
            </button>
          )}

          <button
            onClick={stopNavigation}
            className="flex-1 py-1.5 px-3 text-[11px] font-bold text-rose-200 bg-rose-950/40 hover:bg-rose-950/80 border border-rose-900/40 rounded-lg transition-all"
          >
            End Navigation
          </button>
        </div>
      </div>
    );
  }

  // 3. ARRIVED STATE
  if (navigationState.status === "ARRIVED") {
    // Show stats from trip: travelTimeSec, routeInfo.distanceKm
    const totalTimeStr = formatTravelTime(navigationState.travelTimeSec);
    const travelledDistStr = formatDistance(routeInfo.distanceKm); // fully travelled

    return (
      <div 
        id="arrived-overlay" 
        className="absolute top-4 left-4 right-4 sm:right-auto sm:w-[360px] bg-white border border-emerald-200 text-neutral-800 rounded-2xl shadow-2xl p-5 z-40 animate-in zoom-in-95 duration-200"
      >
        <div className="text-center">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3.5 shadow-inner">
            <Award className="w-7 h-7" />
          </div>
          
          <h3 className="text-base font-extrabold text-neutral-900">Destination Reached 🎉</h3>
          <p className="text-xs text-neutral-500 mt-0.5 leading-normal">
            You have successfully arrived at <b>{selectedPlace.name}</b>.
          </p>
        </div>

        {/* Real Stats Summary Block */}
        <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-3.5 my-4 space-y-2.5">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-center border-b border-neutral-100 pb-1.5">
            Trip Summary Statistics
          </p>
          
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-white p-2 rounded-lg border border-neutral-100 shadow-sm">
              <p className="text-[10px] text-neutral-400 font-semibold">Travel Duration</p>
              <p className="text-xs font-bold text-neutral-800 mt-0.5">{totalTimeStr}</p>
            </div>
            <div className="bg-white p-2 rounded-lg border border-neutral-100 shadow-sm">
              <p className="text-[10px] text-neutral-400 font-semibold">Total Distance</p>
              <p className="text-xs font-bold text-neutral-800 mt-0.5">{travelledDistStr}</p>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-1.5 text-[10px] text-emerald-600 font-bold bg-emerald-50/50 py-1.5 rounded-lg border border-emerald-100/50">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Map Planner Updated Successfully</span>
          </div>
        </div>

        <button
          onClick={resetToIdle}
          className="w-full py-2.5 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-600/10"
        >
          Dismiss Summary & Close
        </button>
      </div>
    );
  }

  return null;
};

export default NavigationCard;
