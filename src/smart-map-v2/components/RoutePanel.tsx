import React, { useContext } from "react";
import { SmartMapContext } from "../context/SmartMapContext";
import { useRoute } from "../hooks/useRoute";
import { useNavigation } from "../hooks/useNavigation";
import { formatDistance, formatDuration } from "../utils/format";
import { Car, Footprints, Bike, Train, Navigation, AlertTriangle, ExternalLink, Calendar, X, Compass, CloudSun, CheckCircle } from "lucide-react";

export const RoutePanel: React.FC = () => {
  const context = useContext(SmartMapContext);
  if (!context) return null;

  const {
    currentLocation,
    selectedPlace,
    setSelectedPlace,
    currentAddress,
    createReminder,
  } = context;

  const { routeInfo, travelMode, setTravelMode, trafficEnabled, toggleTraffic } = useRoute();
  const { navigationState, prepareNavigation, stopNavigation } = useNavigation();

  // 1. If no place is selected or no route is calculated, show IDLE instructions
  if (!selectedPlace || !routeInfo) {
    return (
      <div id="route-panel-idle" className="flex flex-col items-center justify-center py-10 px-4 text-center bg-neutral-50 rounded-2xl border border-neutral-100">
        <Navigation className="w-8 h-8 text-neutral-300 animate-pulse mb-3" />
        <p className="text-xs text-neutral-400 font-medium leading-relaxed">
          Select a destination to calculate route directions, ETA, and travel reminders.
        </p>
      </div>
    );
  }

  // 2. Hide route planning if currently navigating or arrived to avoid duplication/clutter
  if (navigationState.status === "NAVIGATING") {
    return (
      <div id="route-panel-navigating" className="flex flex-col bg-indigo-900/5 text-indigo-900 rounded-2xl border border-indigo-100 p-4 space-y-3">
        <div className="flex items-center space-x-2">
          <Compass className="w-5 h-5 text-indigo-600 animate-spin" style={{ animationDuration: "12s" }} />
          <h4 className="text-xs font-bold uppercase tracking-wider">Navigation Active</h4>
        </div>
        <p className="text-xs text-neutral-600 leading-relaxed">
          Follow instructions on the map overlay card to reach <b>{selectedPlace.name}</b>.
        </p>
        <button
          onClick={stopNavigation}
          className="w-full py-2 px-3 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all border border-rose-100"
        >
          Cancel Navigation
        </button>
      </div>
    );
  }

  if (navigationState.status === "ARRIVED") {
    return (
      <div id="route-panel-arrived" className="flex flex-col bg-emerald-50 text-emerald-900 rounded-2xl border border-emerald-100 p-4 space-y-3">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Destination Reached</h4>
        </div>
        <p className="text-xs text-neutral-600 leading-relaxed">
          You have successfully arrived at <b>{selectedPlace.name}</b>.
        </p>
        <button
          onClick={stopNavigation}
          className="w-full py-2 px-3 text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-all"
        >
          Reset Map State
        </button>
      </div>
    );
  }

  // 3. Modes Definitions
  const modes: Array<{ id: typeof travelMode; name: string; icon: React.ReactNode }> = [
    { id: "car", name: "Drive", icon: <Car className="w-4 h-4" /> },
    { id: "walking", name: "Walk", icon: <Footprints className="w-4 h-4" /> },
    { id: "bicycle", name: "Ride", icon: <Bike className="w-4 h-4" /> },
    { id: "train", name: "Transit", icon: <Train className="w-4 h-4" /> },
  ];

  // Helper to trigger reminder scheduling
  const handleScheduleReminder = () => {
    const minFromNow = Math.max(5, routeInfo.durationMin - 5);
    createReminder(`Depart for ${selectedPlace.name} 🚗`, "time", "custom", {
      description: `Prepare departure to arrive on time. Estimated travel: ${formatDuration(routeInfo.durationMin)}.`,
      targetTime: new Date(Date.now() + minFromNow * 60 * 1000).toISOString(),
    });
    alert(`Departure reminder scheduled for ${formatDuration(minFromNow)} from now!`);
  };

  // Weather status computation
  const isOutdoorMode = travelMode === "walking" || travelMode === "bicycle";
  const weatherText = isOutdoorMode 
    ? "☀️ 74°F Sunny - Ideal for outdoor commuting" 
    : "🌤️ 72°F Lightly Cloudy - Smooth transit expected";

  // Traffic congestion warning
  const trafficText = trafficEnabled
    ? "🔴 Heavy bottleneck on main expressway (+35% delay)"
    : "🟢 Flowing freely. Normal traffic levels.";

  // External real Google Maps link helper
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${selectedPlace.lat},${selectedPlace.lng}&travelmode=${
    travelMode === "car" ? "driving" : travelMode === "walking" ? "walking" : travelMode === "bicycle" ? "bicycling" : "transit"
  }`;

  return (
    <div id="route-panel-planned" className="flex flex-col bg-white rounded-2xl border border-neutral-100 shadow-sm p-4 space-y-4">
      {/* Title block */}
      <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
          Trip Planned
        </h3>
        {trafficEnabled && (
          <div className="flex items-center text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Delay Active
          </div>
        )}
      </div>

      {/* Address Waypoints */}
      <div className="relative flex flex-col space-y-3 pl-4 border-l-2 border-dashed border-neutral-200">
        <div className="absolute top-1 left-[-5px] w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-50"></div>
        <div className="absolute bottom-1 left-[-5px] w-2 h-2 rounded-full bg-rose-500 ring-4 ring-rose-50"></div>
        
        <div>
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Starting From</p>
          <p className="text-xs font-semibold text-neutral-700 truncate">{currentAddress}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Destination</p>
          <p className="text-xs font-bold text-indigo-900 truncate">{selectedPlace.name}</p>
        </div>
      </div>

      {/* Transport Mode Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-100 rounded-xl">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setTravelMode(m.id)}
            className={`flex flex-col items-center justify-center py-1.5 rounded-lg transition-all ${
              travelMode === m.id
                ? "bg-white text-indigo-600 shadow-sm font-semibold"
                : "text-neutral-500 hover:text-neutral-700 hover:bg-white/50"
            }`}
          >
            {m.icon}
            <span className="text-[10px] mt-0.5">{m.name}</span>
          </button>
        ))}
      </div>

      {/* Primary Route Metrics */}
      <div className="grid grid-cols-3 gap-2 bg-neutral-50 p-3 rounded-xl border border-neutral-100/50">
        <div className="text-center">
          <p className="text-[10px] font-medium text-neutral-400">Distance</p>
          <p className="text-sm font-bold text-neutral-800 mt-0.5">
            {formatDistance(routeInfo.distanceKm)}
          </p>
        </div>
        <div className="text-center border-x border-neutral-200">
          <p className="text-[10px] font-medium text-neutral-400">Est. Duration</p>
          <p className="text-sm font-bold text-neutral-800 mt-0.5">
            {formatDuration(routeInfo.durationMin)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-medium text-neutral-400">Leave By</p>
          <p className="text-sm font-bold text-emerald-600 mt-0.5">
            {routeInfo.suggestedLeaveTime}
          </p>
        </div>
      </div>

      {/* Live Environment Conditions */}
      <div className="space-y-2 bg-neutral-50 p-3 rounded-xl border border-neutral-100/50 text-xs">
        <div className="flex items-center space-x-2 text-neutral-600">
          <CloudSun className="w-4 h-4 text-amber-500 shrink-0" />
          <span>{weatherText}</span>
        </div>
        <div className="flex items-center space-x-2 text-neutral-600">
          <AlertTriangle className="w-4 h-4 text-neutral-400 shrink-0" />
          <span>{trafficText}</span>
        </div>
      </div>

      {/* Traffic Toggle Overlay Option */}
      <button
        onClick={toggleTraffic}
        className={`w-full py-1.5 px-3 text-[11px] font-semibold rounded-lg border transition-all ${
          trafficEnabled
            ? "bg-amber-50 text-amber-700 border-amber-200"
            : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
        }`}
      >
        {trafficEnabled ? "Disable Traffic Simulation" : "Enable Traffic Delay Simulation"}
      </button>

      {/* Command Action Buttons */}
      <div className="flex flex-col gap-2 pt-1">
        <button
          onClick={prepareNavigation}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-600/15"
        >
          <Navigation className="w-4 h-4" />
          Start Navigation
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleScheduleReminder}
            className="flex items-center justify-center gap-1 py-1.5 px-2 text-[11px] font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-all"
          >
            <Calendar className="w-3.5 h-3.5" />
            Remind Me
          </button>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 py-1.5 px-2 text-[11px] font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-all border border-neutral-200"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Google Maps
          </a>
        </div>

        <button
          onClick={() => setSelectedPlace(null)}
          className="w-full py-2 px-3 text-xs font-semibold text-neutral-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default RoutePanel;
