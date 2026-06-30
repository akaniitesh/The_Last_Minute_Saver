import React, { useState, useEffect, useRef, useMemo } from "react";
import { useMilo, MiloChat, eventBus } from "../milo-v2";
import { Task } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  MapPin, 
  Navigation, 
  Search, 
  Plus, 
  Minus, 
  Layers, 
  Activity, 
  Sun, 
  Moon, 
  Calendar, 
  Clock, 
  Trash2, 
  Edit2, 
  Save, 
  ArrowRight, 
  Bot, 
  Maximize2, 
  Minimize2, 
  ChevronUp, 
  Settings, 
  AlertCircle, 
  Home, 
  Briefcase, 
  GraduationCap, 
  Dumbbell, 
  Sparkles, 
  History, 
  Compass, 
  Check, 
  Info,
  X,
  ChevronRight
} from "lucide-react";
import L from "leaflet";

interface SmartMapTabProps {
  tasks: Task[];
  onAddTask: (task: Partial<Task>) => void;
  onUpdateTask: (task: Task) => void;
}

interface SavedPlace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: "home" | "office" | "college" | "gym" | "hospital" | "library" | "hostel" | "custom";
}

interface TripHistory {
  id: string;
  origin: string;
  destination: string;
  mode: string;
  distance: string;
  duration: string;
  arrivalTime: string;
  date: string;
}

export default function SmartMapTab({
  tasks,
  onAddTask,
  onUpdateTask
}: SmartMapTabProps) {
  const { state, speakText } = useMilo();

  // 1. CORE COORDINATES & MAP THEME STATES
  const [originAddress, setOriginAddress] = useState("My Location");
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [destinationAddress, setDestinationAddress] = useState("");
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [travelMode, setTravelMode] = useState<"walking" | "bicycle" | "bike" | "car" | "train">("car");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showTraffic, setShowTraffic] = useState(true);
  const [mapStatusMessage, setMapStatusMessage] = useState<string>("Locating device...");

  // Search Results & Autocomplete
  const [destinationSearch, setDestinationSearch] = useState("");
  const [isSearchingDest, setIsSearchingDest] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<any[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Saved Places & Editing State
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>(() => {
    const stored = localStorage.getItem("smart_map_saved_places");
    return stored ? JSON.parse(stored) : [];
  });
  const [editingPlace, setEditingPlace] = useState<SavedPlace | null>(null);
  const [editAddress, setEditAddress] = useState("");

  // Trip History
  const [travelHistory, setTravelHistory] = useState<TripHistory[]>(() => {
    const stored = localStorage.getItem("smart_map_history");
    return stored ? JSON.parse(stored) : [];
  });

  // Navigation Simulation States
  const [liveNavigationActive, setLiveNavigationActive] = useState(false);
  const [navigationProgress, setNavigationProgress] = useState(0); // 0 to 100
  const [isSimulating, setIsSimulating] = useState(false);

  // Right Panel Tab Active ("copilot" | "workspace")
  const [rightPanelTab, setRightPanelTab] = useState<"copilot" | "workspace">("copilot");

  // Mobile drawer tabs (bottom sheets)
  const [isCopilotSheetOpen, setIsCopilotSheetOpen] = useState(false);
  const [isWorkspaceSheetOpen, setIsWorkspaceSheetOpen] = useState(false);

  // Weather data caching
  const [destinationWeather, setDestinationWeather] = useState<any>(null);

  // Leaflet map element refs
  const leafletMapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapInstanceRef = useRef<L.Map | null>(null);
  const leafletTileLayerRef = useRef<L.TileLayer | null>(null);
  const leafletMarkersRef = useRef<L.Marker[]>([]);
  const leafletRouteLineRef = useRef<L.Polyline | null>(null);
  const leafletTrafficLinesRef = useRef<L.Polyline[]>([]);
  const leafletVehicleRef = useRef<L.Marker | null>(null);

  // 2. ACQUIRE CURRENT LOCATION (GEO FALLBACK)
  useEffect(() => {
    const locateUser = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setOriginCoords({ lat, lng });
            setMapStatusMessage("");
            
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`);
              if (res.ok) {
                const data = await res.json();
                const shortAddr = data.display_name.split(",").slice(0, 2).join(", ");
                setOriginAddress(shortAddr || "My Location");
              }
            } catch (err) {
              setOriginAddress("My Location");
            }
          },
          () => {
            // Fallback to New York City coordinates if denied
            setOriginCoords({ lat: 40.7128, lng: -74.0060 });
            setOriginAddress("New York, NY");
            setMapStatusMessage("");
          },
          { enableHighAccuracy: true, timeout: 6000 }
        );
      } else {
        setOriginCoords({ lat: 40.7128, lng: -74.0060 });
        setOriginAddress("New York, NY");
        setMapStatusMessage("");
      }
    };
    locateUser();
  }, []);

  // 3. SEED DYNAMIC SAVED PLACES RELATIVE TO CURRENT LOCATION ON FIRST LOAD
  useEffect(() => {
    if (originCoords && savedPlaces.length === 0) {
      const { lat, lng } = originCoords;
      const initialPlaces: SavedPlace[] = [
        { id: "place-home", name: "Home", address: "Sweet Home Lane", lat: lat + 0.006, lng: lng - 0.008, category: "home" },
        { id: "place-college", name: "College", address: "City College Campus Grounds", lat: lat - 0.014, lng: lng + 0.012, category: "college" },
        { id: "place-office", name: "Office", address: "Innovation Business Park", lat: lat + 0.015, lng: lng - 0.003, category: "office" },
        { id: "place-library", name: "Library", address: "Downtown Central Library", lat: lat - 0.003, lng: lng + 0.009, category: "library" }
      ];
      setSavedPlaces(initialPlaces);
      localStorage.setItem("smart_map_saved_places", JSON.stringify(initialPlaces));
    }
  }, [originCoords]);

  // Persist Saved Places and History
  useEffect(() => {
    localStorage.setItem("smart_map_saved_places", JSON.stringify(savedPlaces));
  }, [savedPlaces]);

  useEffect(() => {
    localStorage.setItem("smart_map_history", JSON.stringify(travelHistory));
  }, [travelHistory]);

  // 4. CHRONOLOGICAL TODAY'S SCHEDULE FROM PLANNER / CALENDAR
  const calendarTimeline = useMemo(() => {
    return tasks
      .filter(t => !t.isCompleted)
      .map(t => {
        const titleLower = t.title.toLowerCase();
        let guessedCategory: SavedPlace["category"] = "custom";
        let guessedLocation = t.destination || "";

        if (titleLower.includes("class") || titleLower.includes("college") || titleLower.includes("exam") || titleLower.includes("lecture")) {
          guessedCategory = "college";
          if (!guessedLocation) guessedLocation = "College";
        } else if (titleLower.includes("meeting") || titleLower.includes("work") || titleLower.includes("office") || titleLower.includes("interview")) {
          guessedCategory = "office";
          if (!guessedLocation) guessedLocation = "Office";
        } else if (titleLower.includes("gym") || titleLower.includes("workout") || titleLower.includes("training")) {
          guessedCategory = "gym";
          if (!guessedLocation) guessedLocation = "Gym";
        } else if (titleLower.includes("study") || titleLower.includes("book") || titleLower.includes("library")) {
          guessedCategory = "library";
          if (!guessedLocation) guessedLocation = "Library";
        }

        return {
          id: t.id,
          title: t.title,
          notes: t.notes || "",
          deadline: t.deadline ? new Date(t.deadline) : null,
          location: guessedLocation,
          category: guessedCategory
        };
      })
      .filter(t => t.location)
      .sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.getTime() - b.deadline.getTime();
      });
  }, [tasks]);

  // 5. AUTOCOMPLETE DESTINATION SEARCH DEBOUNCED
  useEffect(() => {
    if (destinationSearch.trim().length < 2) {
      setAutocompleteSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      // Find matches in saved places first
      const savedMatches = savedPlaces
        .filter(p => p.name.toLowerCase().includes(destinationSearch.toLowerCase() || p.category.toLowerCase().includes(destinationSearch.toLowerCase())))
        .map(p => ({
          id: p.id,
          name: p.name,
          address: p.address,
          lat: p.lat,
          lng: p.lng,
          isSaved: true
        }));

      // Find matches in calendar list
      const calendarMatches = calendarTimeline
        .filter(t => t.location.toLowerCase().includes(destinationSearch.toLowerCase()))
        .map(t => {
          const matchedPlace = savedPlaces.find(p => p.category === t.category);
          return {
            id: `cal-${t.id}`,
            name: t.location,
            address: matchedPlace ? matchedPlace.address : "Location in Calendar Schedule",
            lat: matchedPlace ? matchedPlace.lat : (originCoords ? originCoords.lat + 0.01 : 40.7128),
            lng: matchedPlace ? matchedPlace.lng : (originCoords ? originCoords.lng - 0.01 : -74.0060),
            isCalendar: true
          };
        });

      try {
        const viewboxParam = originCoords
          ? `&viewbox=${originCoords.lng - 0.4},${originCoords.lat + 0.4},${originCoords.lng + 0.4},${originCoords.lat - 0.4}`
          : "";
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destinationSearch)}&limit=4${viewboxParam}`);
        if (res.ok) {
          const data = await res.json();
          const apiSuggestions = data.map((item: any) => ({
            id: item.place_id.toString(),
            name: item.display_name.split(",")[0],
            address: item.display_name.split(",").slice(1, 4).join(",").trim(),
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon)
          }));
          setAutocompleteSuggestions([...savedMatches, ...calendarMatches, ...apiSuggestions]);
        } else {
          setAutocompleteSuggestions([...savedMatches, ...calendarMatches]);
        }
      } catch {
        setAutocompleteSuggestions([...savedMatches, ...calendarMatches]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [destinationSearch, savedPlaces, calendarTimeline, originCoords]);

  // Calculate distance
  const routeDistanceKm = useMemo(() => {
    if (!originCoords || !destinationCoords) return 0;
    const R = 6371;
    const dLat = ((destinationCoords.lat - originCoords.lat) * Math.PI) / 180;
    const dLon = ((destinationCoords.lng - originCoords.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((originCoords.lat * Math.PI) / 180) *
        Math.cos((destinationCoords.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, [originCoords, destinationCoords]);

  // Calculate ETA minutes
  const etaMinutes = useMemo(() => {
    if (routeDistanceKm === 0) return 0;
    let speed = 48; // car
    if (travelMode === "walking") speed = 5;
    else if (travelMode === "bicycle") speed = 15;
    else if (travelMode === "bike") speed = 35;
    else if (travelMode === "train") speed = 60;

    let time = (routeDistanceKm / speed) * 60;
    if (showTraffic && (travelMode === "car" || travelMode === "bike")) {
      time *= 1.25; // add 25% traffic delay
    }
    return Math.max(1, Math.round(time));
  }, [routeDistanceKm, travelMode, showTraffic]);

  // Leave-by calculation
  const suggestedLeaveByTime = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - etaMinutes);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [etaMinutes]);

  // Destination weather fetching
  useEffect(() => {
    if (!destinationCoords) {
      setDestinationWeather(null);
      return;
    }
    const fetchWeather = async () => {
      try {
        const res = await fetch(`/api/weather?lat=${destinationCoords.lat}&lon=${destinationCoords.lng}`);
        if (res.ok) {
          const data = await res.json();
          setDestinationWeather(data);
        }
      } catch (err) {
        console.warn("Weather load error", err);
      }
    };
    fetchWeather();
  }, [destinationCoords]);

  const weatherDetails = useMemo(() => {
    if (!destinationWeather) return null;
    const code = destinationWeather.conditionCode;
    if (code === 0) return { label: "Sunny", icon: "☀️", color: "text-amber-500", warning: null };
    if (code <= 3) return { label: "Cloudy", icon: "⛅", color: "text-gray-400", warning: null };
    if (code === 45 || code === 48) return { label: "Dense Fog", icon: "🌫️", color: "text-indigo-300", warning: "Dense Fog: Low visibility. Reduce driving speeds." };
    if (code >= 51 && code <= 67) return { label: "Rainy", icon: "🌧️", color: "text-blue-500", warning: "Wet Roads: Increased collision risks. Keep braking distance." };
    if (code >= 71 && code <= 86) return { label: "Snowing", icon: "❄️", color: "text-sky-300", warning: "Slippery roads. Winter tires or transit suggested." };
    if (code >= 95) return { label: "Thunderstorm", icon: "⛈️", color: "text-rose-500", warning: "Severe weather: Seek shelter. Delay non-essential travel." };
    return { label: "Mild", icon: "🌡️", color: "text-teal-500", warning: null };
  }, [destinationWeather]);

  // 6. MOUNT LEAFLET INTERACTIVE MAP & SYNC
  useEffect(() => {
    // Dynamically inject Leaflet stylesheet
    if (!document.getElementById("leaflet-osm-css-style")) {
      const link = document.createElement("link");
      link.id = "leaflet-osm-css-style";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Inject dash animation stylesheet
    if (!document.getElementById("leaflet-animated-route-path")) {
      const style = document.createElement("style");
      style.id = "leaflet-animated-route-path";
      style.textContent = `
        @keyframes dashRoute {
          to { stroke-dashoffset: -40; }
        }
        .leaflet-active-route {
          animation: dashRoute 1.5s linear infinite;
        }
      `;
      document.head.appendChild(style);
    }

    if (!leafletMapContainerRef.current) return;

    let map = leafletMapInstanceRef.current;
    if (!map) {
      const initLat = originCoords ? originCoords.lat : 40.7128;
      const initLng = originCoords ? originCoords.lng : -74.0060;
      map = L.map(leafletMapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([initLat, initLng], 13);
      leafletMapInstanceRef.current = map;

      // Click to drop marker
      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        setDestinationCoords({ lat, lng });
        setDestinationAddress(`Dropped Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        setDestinationSearch("");
      });
    }

    // Tile Layer Sync
    if (leafletTileLayerRef.current) {
      map.removeLayer(leafletTileLayerRef.current);
    }
    const tileUrl = isDarkMode
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    const tileLayer = L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);
    leafletTileLayerRef.current = tileLayer;

    // Clear Previous Markers
    leafletMarkersRef.current.forEach(m => m.remove());
    leafletMarkersRef.current = [];

    // Draw Origin Marker
    if (originCoords) {
      const originIcon = L.divIcon({
        className: "origin-icon",
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute -inset-2 rounded-full bg-blue-500/30 animate-ping"></div>
            <div class="w-7 h-7 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow-lg text-white font-sans text-xs">📍</div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      const oMarker = L.marker([originCoords.lat, originCoords.lng], { icon: originIcon }).addTo(map);
      leafletMarkersRef.current.push(oMarker);
    }

    // Draw Saved Places Pins
    savedPlaces.forEach(p => {
      const isTarget = destinationCoords && Math.abs(p.lat - destinationCoords.lat) < 0.0001 && Math.abs(p.lng - destinationCoords.lng) < 0.0001;
      const emoji = p.category === "home" ? "🏠" : p.category === "college" ? "🎓" : p.category === "office" ? "🏢" : p.category === "gym" ? "💪" : "📚";
      const placeIcon = L.divIcon({
        className: "saved-pin",
        html: `
          <div class="w-6 h-6 rounded-lg ${isTarget ? "bg-emerald-600 ring-2 ring-white scale-110" : "bg-neutral-800 border border-neutral-600"} flex items-center justify-center shadow-md cursor-pointer text-xs">
            ${emoji}
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      const pMarker = L.marker([p.lat, p.lng], { icon: placeIcon })
        .addTo(map!)
        .on("click", () => {
          setDestinationCoords({ lat: p.lat, lng: p.lng });
          setDestinationAddress(p.address);
          setDestinationSearch(p.name);
        });
      leafletMarkersRef.current.push(pMarker);
    });

    // Draw Destination Pin
    if (destinationCoords) {
      const destIcon = L.divIcon({
        className: "dest-icon",
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute -inset-3 rounded-full bg-emerald-500/20 animate-pulse"></div>
            <div class="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-xl text-sm">🏁</div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      const dMarker = L.marker([destinationCoords.lat, destinationCoords.lng], { icon: destIcon }).addTo(map);
      leafletMarkersRef.current.push(dMarker);
    }

    // Draw Routes & Traffic Layers
    if (leafletRouteLineRef.current) {
      map.removeLayer(leafletRouteLineRef.current);
      leafletRouteLineRef.current = null;
    }
    leafletTrafficLinesRef.current.forEach(tl => map?.removeLayer(tl));
    leafletTrafficLinesRef.current = [];

    if (originCoords && destinationCoords) {
      const p1 = [originCoords.lat, originCoords.lng] as L.LatLngExpression;
      const p2 = [destinationCoords.lat, destinationCoords.lng] as L.LatLngExpression;

      // Draw elegant spline offset path
      const midLat = (originCoords.lat + destinationCoords.lat) / 2;
      const midLng = (originCoords.lng + destinationCoords.lng) / 2;
      const offsetLat = midLat + (destinationCoords.lng - originCoords.lng) * 0.12;
      const offsetLng = midLng - (destinationCoords.lat - originCoords.lat) * 0.12;

      const fullRoutePoints: [number, number][] = [
        [originCoords.lat, originCoords.lng],
        [offsetLat, offsetLng],
        [destinationCoords.lat, destinationCoords.lng]
      ];

      // Standard active route polyline
      const mainRouteLine = L.polyline(fullRoutePoints, {
        color: isDarkMode ? "#10b981" : "#059669",
        weight: 6,
        opacity: showTraffic ? 0.3 : 0.9,
        dashArray: "12, 10",
        className: "leaflet-active-route"
      }).addTo(map);
      leafletRouteLineRef.current = mainRouteLine;

      // If Traffic is enabled, draw colored overlay segments
      if (showTraffic) {
        // Light green first segment
        const segment1 = L.polyline([fullRoutePoints[0], fullRoutePoints[1]], {
          color: "#22c55e", // Green
          weight: 6,
          opacity: 0.9
        }).addTo(map);

        // Moderate or high delay middle segment
        const segment2 = L.polyline([fullRoutePoints[1], fullRoutePoints[2]], {
          color: "#ef4444", // Red (Traffic delay)
          weight: 6,
          opacity: 0.9
        }).addTo(map);

        leafletTrafficLinesRef.current = [segment1, segment2];
      }

      // Auto fit boundaries
      const bounds = L.latLngBounds([p1, p2]);
      map.fitBounds(bounds, { padding: [60, 60], animate: true, duration: 1.0 });
    } else if (originCoords) {
      map.setView([originCoords.lat, originCoords.lng], 13);
    }

    return () => {
      // Cleanup leaflet route/marker listeners
    };
  }, [originCoords, destinationCoords, savedPlaces, isDarkMode, showTraffic]);

  // 7. SIMULATION DRIVER: ANIMATES POSITION ALONG PATH IN DURATION WINDOW
  useEffect(() => {
    if (!liveNavigationActive || !originCoords || !destinationCoords) {
      if (leafletVehicleRef.current) {
        leafletVehicleRef.current.remove();
        leafletVehicleRef.current = null;
      }
      return;
    }

    const p1 = [originCoords.lat, originCoords.lng];
    const p2 = [destinationCoords.lat, destinationCoords.lng];
    const midLat = (p1[0] + p2[0]) / 2;
    const midLng = (p1[1] + p2[1]) / 2;
    const offsetLat = midLat + (p2[1] - p1[1]) * 0.12;
    const offsetLng = midLng - (p2[0] - p1[0]) * 0.12;

    const fullRoutePoints: [number, number][] = [
      [p1[0], p1[1]],
      [offsetLat, offsetLng],
      [p2[0], p2[1]]
    ];

    const interval = setInterval(() => {
      setNavigationProgress(prev => {
        const next = prev + 5;
        if (next >= 100) {
          clearInterval(interval);
          setLiveNavigationActive(false);
          setIsSimulating(false);
          
          // Save completed trip to history
          const now = new Date();
          const formatTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          const formatDate = now.toLocaleDateString([], { month: "short", day: "numeric" });
          
          const newHistoryItem: TripHistory = {
            id: `trip-${Date.now()}`,
            origin: originAddress,
            destination: destinationAddress,
            mode: travelMode,
            distance: `${routeDistanceKm.toFixed(1)} km`,
            duration: `${etaMinutes} min`,
            arrivalTime: formatTime,
            date: `${formatDate} ${formatTime}`
          };
          setTravelHistory(prevH => [newHistoryItem, ...prevH]);
          speakText(`Navigation complete! You have arrived safely at ${destinationAddress}.`);
          return 100;
        }

        // Interpolate current vehicle coordinates along quadratic curve
        const ratio = next / 100;
        let vehicleLat = p1[0];
        let vehicleLng = p1[1];
        if (ratio < 0.5) {
          const subRatio = ratio * 2;
          vehicleLat = p1[0] + (offsetLat - p1[0]) * subRatio;
          vehicleLng = p1[1] + (offsetLng - p1[1]) * subRatio;
        } else {
          const subRatio = (ratio - 0.5) * 2;
          vehicleLat = offsetLat + (p2[0] - offsetLat) * subRatio;
          vehicleLng = offsetLng + (p2[1] - offsetLng) * subRatio;
        }

        const map = leafletMapInstanceRef.current;
        if (map) {
          if (leafletVehicleRef.current) {
            leafletVehicleRef.current.setLatLng([vehicleLat, vehicleLng]);
          } else {
            const vehicleIcon = L.divIcon({
              className: "vehicle-marker",
              html: `
                <div class="relative flex items-center justify-center">
                  <div class="absolute -inset-2 rounded-full bg-emerald-400/50 animate-ping"></div>
                  <div class="w-8 h-8 rounded-full bg-emerald-600 border border-white shadow-lg flex items-center justify-center text-sm">🚗</div>
                </div>
              `,
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            });
            leafletVehicleRef.current = L.marker([vehicleLat, vehicleLng], { icon: vehicleIcon }).addTo(map);
          }
          map.panTo([vehicleLat, vehicleLng]);
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [liveNavigationActive, originCoords, destinationCoords]);

  // Dynamic next turn instructions
  const navigationTurnInstruction = useMemo(() => {
    if (navigationProgress < 20) return "In 200m, turn right onto Main Street.";
    if (navigationProgress < 50) return "Continue straight for 1.5 km. Light traffic ahead.";
    if (navigationProgress < 80) return "In 400m, turn left toward destination entryway.";
    if (navigationProgress < 98) return "You are arriving at your destination shortly. Slow down.";
    return "Arrived at your destination! Trip complete.";
  }, [navigationProgress]);

  // 8. CO-PILOT INTEGRATION: INTERCEPT VOICE OR CHAT COMMANDS VIA EVENTBUS
  useEffect(() => {
    const unsubscribe = eventBus.on("map_navigate", (payload: any) => {
      if (payload && payload.destination) {
        const query = payload.destination;
        handleSearchAndLocate(query);
      }
    });
    return () => unsubscribe();
  }, [savedPlaces, originCoords]);

  // Helper function to search and set destination
  const handleSearchAndLocate = async (term: string) => {
    if (!term) return;

    // 1. Check if matches category of saved places
    const matchedSaved = savedPlaces.find(
      p => p.name.toLowerCase().includes(term.toLowerCase()) || p.category.toLowerCase().includes(term.toLowerCase())
    );

    if (matchedSaved) {
      setDestinationCoords({ lat: matchedSaved.lat, lng: matchedSaved.lng });
      setDestinationAddress(matchedSaved.address);
      setDestinationSearch(matchedSaved.name);
      speakText(`Locating your saved ${matchedSaved.name} on the map. Ready to calculate route.`);
      setRightPanelTab("workspace");
      return;
    }

    // 2. Query Nominatim
    setIsSearchingDest(true);
    try {
      const viewboxParam = originCoords
        ? `&viewbox=${originCoords.lng - 0.4},${originCoords.lat + 0.4},${originCoords.lng + 0.4},${originCoords.lat - 0.4}`
        : "";
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(term)}&limit=1${viewboxParam}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          setDestinationCoords({ lat, lng });
          setDestinationAddress(data[0].display_name.split(",").slice(0, 3).join(","));
          setDestinationSearch(term);
          speakText(`I have located "${term}" on the map. Ready to route.`);
          setRightPanelTab("workspace");
        } else {
          speakText(`I couldn't locate "${term}". Try searching for another keyword.`);
        }
      }
    } catch {
      speakText(`Sorry, I had an issue connecting to the search service.`);
    } finally {
      setIsSearchingDest(false);
    }
  };

  const startNavigationSim = () => {
    if (!destinationCoords) return;
    setNavigationProgress(0);
    setLiveNavigationActive(true);
    setIsSimulating(true);
    speakText(`Starting navigation simulator to ${destinationAddress}. Please proceed along the highlighted route.`);
  };

  const handleRecenter = () => {
    const map = leafletMapInstanceRef.current;
    if (map && originCoords) {
      map.setView([originCoords.lat, originCoords.lng], 14, { animate: true });
    }
  };

  const handleEditPlace = (place: SavedPlace) => {
    setEditingPlace(place);
    setEditAddress(place.address);
  };

  const handleSavePlaceEdit = async (id: string) => {
    if (!editAddress.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(editAddress)}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const updated = savedPlaces.map(p => {
            if (p.id === id) {
              return {
                ...p,
                address: editAddress,
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
              };
            }
            return p;
          });
          setSavedPlaces(updated);
          setEditingPlace(null);
          speakText(`Saved place address updated successfully.`);
        }
      }
    } catch {
      setEditingPlace(null);
    }
  };

  return (
    <div id="smart-map-tab-root" className="flex flex-col h-full bg-[#FAFAFA] font-sans">
      
      {/* HEADER SECTION */}
      <div className="px-6 py-4 bg-white border-b border-gray-100 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Compass className="text-emerald-500 animate-spin-slow" size={20} />
            Smart Map Planner V2
          </h1>
          <p className="text-xs text-gray-400 font-medium">AI Navigation Workspace</p>
        </div>
        
        {/* Desktop tab selection inside page header */}
        <div className="hidden md:flex items-center bg-gray-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setRightPanelTab("copilot")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              rightPanelTab === "copilot" ? "bg-white text-black shadow-xs" : "text-gray-400 hover:text-black"
            }`}
          >
            <Bot size={13} />
            Milo Co-Pilot
          </button>
          <button
            onClick={() => setRightPanelTab("workspace")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              rightPanelTab === "workspace" ? "bg-white text-black shadow-xs" : "text-gray-400 hover:text-black"
            }`}
          >
            <Layers size={13} />
            Workspace
          </button>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE PANELS */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row relative">
        
        {/* LEFT COLUMN: INTERACTIVE MAP & OVERLAY SEARCH (70% on Desktop, Full screen on Mobile) */}
        <div className="flex-1 relative min-h-[300px] md:min-h-0">
          
          {/* Leaflet DOM container */}
          <div ref={leafletMapContainerRef} className="absolute inset-0 z-0 h-full w-full" />

          {/* Map Loading/Status Overlay */}
          {mapStatusMessage && (
            <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-xs z-20 flex items-center justify-center font-mono text-xs text-white">
              <div className="flex flex-col items-center gap-3 bg-black/80 p-4 rounded-xl border border-neutral-800 shadow-xl">
                <span className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span>{mapStatusMessage}</span>
              </div>
            </div>
          )}

          {/* TOP FLOATING SEARCH OVERLAY PANEL */}
          <div className="absolute top-4 left-4 right-4 md:right-auto md:w-[380px] z-10 space-y-2">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-100 shadow-xl p-2 relative">
              <div className="flex items-center gap-2 px-2">
                <Search className="text-gray-400 shrink-0" size={16} />
                <input
                  type="text"
                  placeholder="Search Home, College, restaurants, ATMs..."
                  value={destinationSearch}
                  onChange={(e) => setDestinationSearch(e.target.value)}
                  className="flex-1 bg-transparent border-0 outline-none font-sans text-xs text-gray-800 placeholder-gray-400 py-2 focus:ring-0 focus:outline-none"
                />
                {isSearchingDest ? (
                  <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shrink-0" />
                ) : destinationSearch && (
                  <button
                    onClick={() => {
                      setDestinationSearch("");
                      setAutocompleteSuggestions([]);
                    }}
                    className="text-gray-400 hover:text-black text-xs font-bold cursor-pointer shrink-0"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Autocomplete Suggestion Dropdown */}
              <AnimatePresence>
                {autocompleteSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl border border-gray-100 shadow-2xl max-h-[240px] overflow-y-auto z-50 p-1"
                  >
                    {autocompleteSuggestions.map((sug, i) => (
                      <button
                        key={sug.id}
                        onClick={() => {
                          setDestinationCoords({ lat: sug.lat, lng: sug.lng });
                          setDestinationAddress(sug.address);
                          setDestinationSearch(sug.name);
                          setAutocompleteSuggestions([]);
                          speakText(`Destination set to ${sug.name}.`);
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 flex items-start gap-2.5 transition-colors cursor-pointer"
                      >
                        <MapPin className={`${sug.isSaved ? "text-emerald-500" : sug.isCalendar ? "text-indigo-500" : "text-gray-400"} shrink-0 mt-0.5`} size={14} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-950 truncate leading-snug">{sug.name}</p>
                          <p className="text-[10px] text-gray-400 truncate leading-snug mt-0.5">{sug.address}</p>
                        </div>
                        {sug.isSaved && <span className="text-[8px] uppercase tracking-wider font-mono bg-emerald-50 text-emerald-600 px-1 py-0.5 rounded-sm font-bold shrink-0">Saved</span>}
                        {sug.isCalendar && <span className="text-[8px] uppercase tracking-wider font-mono bg-indigo-50 text-indigo-600 px-1 py-0.5 rounded-sm font-bold shrink-0">Schedule</span>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* QUICK TOGGLE SAVED PLACES CHIPS BAR */}
            <div className="flex flex-wrap gap-1.5 px-1 py-0.5 overflow-x-auto no-scrollbar max-w-full">
              {savedPlaces.map(p => {
                const isSelected = destinationCoords && Math.abs(p.lat - destinationCoords.lat) < 0.0001 && Math.abs(p.lng - destinationCoords.lng) < 0.0001;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setDestinationCoords({ lat: p.lat, lng: p.lng });
                      setDestinationAddress(p.address);
                      setDestinationSearch(p.name);
                      speakText(`Routing to ${p.name}.`);
                    }}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap border ${
                      isSelected
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "bg-white border-gray-150 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span>{p.category === "home" ? "🏠" : p.category === "college" ? "🎓" : p.category === "office" ? "🏢" : p.category === "gym" ? "💪" : "📍"}</span>
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FLOATING ACTION OVERLAY CONTROLS (VERTICAL BUTTON GROUP) */}
          <div className="absolute right-4 bottom-24 sm:bottom-6 z-10 flex flex-col gap-2">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-100 shadow-xl p-1.5 flex flex-col gap-1">
              <button
                onClick={handleRecenter}
                className="p-2.5 rounded-xl hover:bg-gray-50 text-gray-500 hover:text-black transition-colors cursor-pointer"
                title="Locate Me / Centering"
              >
                <Navigation size={15} className="rotate-45" />
              </button>

              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2.5 rounded-xl hover:bg-gray-50 text-gray-500 hover:text-black transition-colors cursor-pointer"
                title="Toggle Dark Mode"
              >
                {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
              </button>

              <button
                onClick={() => setShowTraffic(!showTraffic)}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  showTraffic ? "bg-red-50 text-red-600" : "text-gray-500 hover:text-black hover:bg-gray-50"
                }`}
                title="Toggle Live Traffic Overlays"
              >
                <Activity size={15} className={showTraffic ? "animate-pulse" : ""} />
              </button>

              <div className="h-[1px] bg-gray-100 mx-1.5 my-0.5" />

              <button
                onClick={() => leafletMapInstanceRef.current?.zoomIn()}
                className="p-2.5 rounded-xl hover:bg-gray-50 text-gray-500 hover:text-black transition-colors cursor-pointer"
                title="Zoom In"
              >
                <Plus size={15} />
              </button>

              <button
                onClick={() => leafletMapInstanceRef.current?.zoomOut()}
                className="p-2.5 rounded-xl hover:bg-gray-50 text-gray-500 hover:text-black transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <Minus size={15} />
              </button>
            </div>
          </div>

          {/* FLOATING LIVE NAVIGATION TELEMETRY PANEL */}
          <AnimatePresence>
            {liveNavigationActive && destinationCoords && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="absolute bottom-24 sm:bottom-6 left-4 right-16 sm:right-auto sm:w-[380px] z-10"
              >
                <div className="bg-emerald-950 text-white rounded-2xl border border-emerald-800 shadow-2xl p-4 flex flex-col gap-3">
                  
                  {/* Top line with mode emoji and next turn guidance */}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-800/80 flex items-center justify-center text-lg shrink-0 animate-bounce">
                      🧭
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase font-mono tracking-widest text-emerald-300 font-bold leading-none">Live Guidance Active</p>
                      <p className="text-xs font-semibold leading-snug mt-1.5 text-emerald-50 truncate">{navigationTurnInstruction}</p>
                    </div>
                  </div>

                  {/* Telemetry metrics bar */}
                  <div className="grid grid-cols-3 gap-2 border-t border-emerald-900/40 pt-3">
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">Speed</span>
                      <span className="text-xs font-bold text-white mt-1 block">42 km/h</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">Distance</span>
                      <span className="text-xs font-bold text-white mt-1 block">{(routeDistanceKm * (1 - navigationProgress / 100)).toFixed(1)} km</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">ETA</span>
                      <span className="text-xs font-bold text-white mt-1 block">{Math.max(1, Math.round(etaMinutes * (1 - navigationProgress / 100)))} min</span>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="space-y-1 mt-1">
                    <div className="h-1.5 w-full bg-emerald-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 transition-all duration-1000"
                        style={{ width: `${navigationProgress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[8px] font-mono text-emerald-400">
                      <span>START</span>
                      <span>{navigationProgress}% COMPLETE</span>
                      <span>ARRIVED</span>
                    </div>
                  </div>

                  {/* Cancel button */}
                  <button
                    onClick={() => {
                      setLiveNavigationActive(false);
                      setIsSimulating(false);
                      speakText("Navigation stopped.");
                    }}
                    className="w-full py-2 bg-emerald-800 hover:bg-emerald-700 active:scale-95 text-white text-[10px] font-mono uppercase tracking-widest rounded-xl transition-all cursor-pointer font-bold mt-1"
                  >
                    Cancel Guidance
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN SIDEBAR panel (30% on Desktop, hidden on Mobile) */}
        <div className="hidden md:flex md:w-[32%] lg:w-[30%] shrink-0 border-l border-gray-150 bg-white flex-col overflow-hidden">
          
          {/* TAB HEADERS PORTAL */}
          <div className="p-3 bg-gray-50 border-b border-gray-150 flex items-center justify-between gap-1.5">
            <button
              onClick={() => setRightPanelTab("copilot")}
              className={`flex-1 py-2 rounded-xl text-[10px] font-mono font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                rightPanelTab === "copilot"
                  ? "bg-white text-black border border-gray-200/50 shadow-xs"
                  : "text-gray-400 hover:text-black"
              }`}
            >
              <Bot size={13} />
              Milo Copilot
            </button>

            <button
              onClick={() => setRightPanelTab("workspace")}
              className={`flex-1 py-2 rounded-xl text-[10px] font-mono font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                rightPanelTab === "workspace"
                  ? "bg-white text-black border border-gray-200/50 shadow-xs"
                  : "text-gray-400 hover:text-black"
              }`}
            >
              <Layers size={13} />
              Trip Info
            </button>
          </div>

          {/* ACTIVE RIGHT PANEL CONTAINER */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-5 [scrollbar-width:thin]">
            
            {/* TAB 1: MILO COPILOT AI CHAT INTERFACE EMBED */}
            {rightPanelTab === "copilot" && (
              <div className="h-full flex flex-col min-h-0">
                <div className="flex-1 min-h-0 bg-gray-50/50 rounded-2xl border border-gray-150 overflow-hidden flex flex-col p-1.5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.01)]">
                  <MiloChat />
                </div>
              </div>
            )}

            {/* TAB 2: TRIP WORKSPACE DETAIL PANELS */}
            {rightPanelTab === "workspace" && (
              <div className="space-y-6">
                
                {/* A. CURRENT ACTIVE TRIP CARD */}
                <div className="bg-white rounded-2xl border border-gray-150 p-4 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1.5 pl-1.5">
                    🧭 Current Journey Details
                  </h3>

                  {destinationCoords ? (
                    <div className="space-y-3.5 pl-1.5">
                      <div className="space-y-2 relative pl-3.5 border-l border-dashed border-gray-200 ml-1.5 py-1">
                        <div className="absolute top-1 -left-1.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white" />
                        <div className="absolute bottom-1 -left-1.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                        <div>
                          <p className="text-[9px] font-mono uppercase tracking-wider text-gray-400 font-bold leading-none">Origin</p>
                          <p className="text-xs text-gray-700 truncate font-semibold leading-normal mt-1">{originAddress}</p>
                        </div>
                        <div className="pt-2">
                          <p className="text-[9px] font-mono uppercase tracking-wider text-emerald-500 font-bold leading-none">Destination</p>
                          <p className="text-xs text-gray-900 truncate font-bold leading-normal mt-1">{destinationAddress}</p>
                        </div>
                      </div>

                      {/* Distance & ETA & suggested Leave metrics */}
                      <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-150">
                        <div>
                          <span className="text-[9px] font-mono uppercase tracking-wider text-gray-400 font-semibold block">Distance</span>
                          <span className="text-sm font-bold text-gray-900 mt-1 block">{routeDistanceKm.toFixed(1)} km</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-mono uppercase tracking-wider text-gray-400 font-semibold block">Travel Time</span>
                          <span className="text-sm font-bold text-emerald-600 mt-1 block">{etaMinutes} min</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-gray-500 flex items-center gap-1.5 bg-gray-50 p-2 rounded-lg border border-gray-150">
                        <Clock size={13} className="text-gray-400" />
                        <span>Suggested Leave Time: <strong className="text-gray-900">{suggestedLeaveByTime}</strong></span>
                      </div>

                      {/* WEATHER CORRELATOR */}
                      {weatherDetails && (
                        <div className="bg-sky-50/50 border border-sky-100/80 rounded-xl p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-sky-600 font-bold block">Dest Weather</span>
                            <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                              <span className="text-base leading-none">{weatherDetails.icon}</span>
                              {destinationWeather.temperature}°C • {weatherDetails.label}
                            </span>
                          </div>
                          {weatherDetails.warning && (
                            <p className="text-[10px] text-rose-600 leading-normal font-medium bg-rose-50 p-1.5 rounded-md border border-rose-100">
                              ⚠️ {weatherDetails.warning}
                            </p>
                          )}
                        </div>
                      )}

                      {/* TRAVEL MODE SWITCHERS */}
                      <div className="pt-1.5">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-gray-400 font-bold block mb-2">Change Travel Mode</span>
                        <div className="grid grid-cols-5 gap-1 bg-gray-50 p-1 rounded-xl border border-gray-150">
                          {(["car", "bike", "bicycle", "walking", "train"] as const).map(mode => {
                            const icon = mode === "car" ? "🚗" : mode === "bike" ? "🏍️" : mode === "bicycle" ? "🚲" : mode === "walking" ? "🚶" : "🚆";
                            return (
                              <button
                                key={mode}
                                onClick={() => {
                                  setTravelMode(mode);
                                  speakText(`Commute mode updated to ${mode}.`);
                                }}
                                className={`py-2 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${
                                  travelMode === mode ? "bg-white shadow-xs scale-105 border border-gray-150" : "opacity-60 hover:opacity-100"
                                }`}
                                title={`Commute by ${mode}`}
                              >
                                {icon}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* TRIGGER SIMULATION PILOT BUTTON */}
                      <button
                        onClick={startNavigationSim}
                        disabled={isSimulating}
                        className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer text-white shadow-md ${
                          isSimulating
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-emerald-600 hover:bg-emerald-500 hover:shadow-lg active:scale-98"
                        }`}
                      >
                        <Activity size={14} className={isSimulating ? "animate-pulse" : ""} />
                        {isSimulating ? "Simulation Active" : "Start Live Guidance"}
                      </button>

                      <button
                        onClick={() => {
                          setDestinationCoords(null);
                          setDestinationAddress("");
                          setDestinationSearch("");
                          speakText("Route cleared.");
                        }}
                        className="w-full py-2 border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-xl font-mono text-[10px] uppercase tracking-widest transition-all cursor-pointer"
                      >
                        Clear Route
                      </button>

                    </div>
                  ) : (
                    <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center pl-1.5">
                      <Compass className="text-gray-300 animate-pulse mb-2" size={32} />
                      <p className="text-xs font-semibold text-gray-400">No Destination Active</p>
                      <p className="text-[10px] text-gray-400 mt-1 max-w-[200px] leading-relaxed mx-auto">
                        Search or select any saved place, planner item or calendar event to map a route.
                      </p>
                    </div>
                  )}
                </div>

                {/* B. TODAY'S SCHEDULE & CALENDAR EVENTS & PLANNER INTEGRATION */}
                <div className="bg-white rounded-2xl border border-gray-150 p-4 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center justify-between pl-1.5">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="text-indigo-500" size={14} />
                      Today's Smart Itinerary
                    </span>
                    <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full font-bold">
                      {calendarTimeline.length} events
                    </span>
                  </h3>

                  {calendarTimeline.length > 0 ? (
                    <div className="space-y-3 pl-1.5">
                      {calendarTimeline.map(item => {
                        const leaveBy = suggestedLeaveByTime;
                        const isLateSoon = true; // Alarm trigger helper

                        return (
                          <div
                            key={item.id}
                            className="p-3 rounded-xl border border-gray-150 bg-gray-50/50 hover:bg-gray-50 transition-all flex items-start gap-2.5 group cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-sm shrink-0">
                              {item.category === "college" ? "🎓" : item.category === "office" ? "🏢" : item.category === "gym" ? "💪" : "📅"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate leading-snug">{item.title}</p>
                              
                              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-1">
                                <Clock size={11} />
                                <span>{item.deadline ? item.deadline.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Scheduled"}</span>
                                <span>•</span>
                                <span className="font-medium text-gray-600 truncate">{item.location}</span>
                              </div>

                              {/* Commute leaf suggestion */}
                              <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-[9px] font-mono text-indigo-600 font-bold bg-indigo-50/50 px-1 py-0.5 rounded">
                                  ⏱️ Leave by {leaveBy}
                                </span>
                                
                                <button
                                  onClick={() => handleSearchAndLocate(item.location)}
                                  className="text-[10px] text-gray-400 group-hover:text-indigo-600 font-bold flex items-center gap-1 transition-colors cursor-pointer uppercase tracking-wider font-mono"
                                >
                                  Route
                                  <ArrowRight size={10} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-6 text-center bg-gray-50/50 rounded-xl border border-gray-150 flex flex-col items-center justify-center pl-1.5">
                      <Clock className="text-gray-300 mb-1" size={24} />
                      <p className="text-[11px] font-semibold text-gray-400">No events found with locations</p>
                      <p className="text-[9px] text-gray-400 mt-0.5 max-w-[180px] leading-relaxed">
                        Add a task with a location/destination in the Planner to auto-detect commute details.
                      </p>
                    </div>
                  )}
                </div>

                {/* C. EDITABLE SAVED PLACES SETTING */}
                <div className="bg-white rounded-2xl border border-gray-150 p-4 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1.5 pl-1.5">
                    <Home className="text-amber-500" size={14} />
                    Saved Workspace Locations
                  </h3>

                  <div className="space-y-2.5 pl-1.5">
                    {savedPlaces.map(p => (
                      <div key={p.id} className="p-3 bg-gray-50/50 hover:bg-gray-50 border border-gray-150 rounded-xl transition-all">
                        {editingPlace?.id === p.id ? (
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider font-mono">Editing {p.name} Address</span>
                            <input
                              type="text"
                              value={editAddress}
                              onChange={(e) => setEditAddress(e.target.value)}
                              placeholder="Enter street, city, postal code..."
                              className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-amber-500"
                            />
                            <div className="flex justify-end gap-1.5 pt-1">
                              <button
                                onClick={() => setEditingPlace(null)}
                                className="px-2 py-1 text-[10px] border border-gray-200 hover:bg-gray-100 rounded-lg cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSavePlaceEdit(p.id)}
                                className="px-2.5 py-1 text-[10px] bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Save size={10} />
                                Save Address
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-gray-950 truncate">{p.name}</span>
                                <span className="text-[8px] uppercase tracking-wider font-mono bg-amber-50 text-amber-600 px-1 rounded font-bold">{p.category}</span>
                              </div>
                              <p className="text-[10px] text-gray-400 truncate mt-1">{p.address}</p>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEditPlace(p)}
                                className="p-1 hover:bg-amber-50 text-gray-400 hover:text-amber-600 rounded transition-colors cursor-pointer"
                                title="Edit Location Coordinates"
                              >
                                <Edit2 size={11} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* D. NAVIGATION HISTORY & RECENT TRIPS */}
                <div className="bg-white rounded-2xl border border-gray-150 p-4 shadow-sm relative overflow-hidden animate-fade-in">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-neutral-600" />
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center justify-between pl-1.5">
                    <span className="flex items-center gap-1.5">
                      <History className="text-gray-500" size={14} />
                      Trip History Logs
                    </span>
                    {travelHistory.length > 0 && (
                      <button
                        onClick={() => {
                          setTravelHistory([]);
                          speakText("Travel history deleted.");
                        }}
                        className="text-[9px] text-red-500 hover:underline cursor-pointer font-bold"
                      >
                        Clear logs
                      </button>
                    )}
                  </h3>

                  {travelHistory.length > 0 ? (
                    <div className="space-y-2.5 pl-1.5 max-h-[220px] overflow-y-auto no-scrollbar">
                      {travelHistory.map(item => (
                        <div key={item.id} className="p-2.5 bg-gray-50/50 rounded-xl border border-gray-150 text-[10px] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[9px] text-gray-400 uppercase tracking-wider">{item.date}</span>
                            <span className="text-[8px] uppercase font-mono bg-emerald-50 text-emerald-600 px-1 rounded-sm font-bold">ARRIVED</span>
                          </div>
                          <div>
                            <span className="font-bold text-gray-800 line-clamp-1">{item.destination}</span>
                          </div>
                          <div className="flex items-center justify-between text-gray-400 pt-0.5 border-t border-gray-100/50">
                            <span>Commute: {item.mode === "car" ? "🚗" : item.mode === "bike" ? "🏍️" : item.mode === "bicycle" ? "🚲" : item.mode === "walking" ? "🚶" : "🚆"}</span>
                            <span>{item.distance} ({item.duration})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-5 text-center bg-gray-50/50 rounded-xl border border-gray-150 flex flex-col items-center justify-center pl-1.5">
                      <History className="text-gray-300 mb-1" size={20} />
                      <p className="text-[10px] text-gray-400">No complete journeys in history yet.</p>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION TAB BAR (ONLY VISIBLE ON MOBILE SCREEN WIDTHS) */}
      <div className="md:hidden shrink-0 h-14 bg-white border-t border-gray-150 flex items-center justify-around z-20 shadow-lg relative px-3">
        <button
          onClick={() => {
            setIsCopilotSheetOpen(false);
            setIsWorkspaceSheetOpen(false);
          }}
          className={`flex flex-col items-center justify-center gap-1 w-20 py-1 transition-all cursor-pointer ${
            (!isCopilotSheetOpen && !isWorkspaceSheetOpen) ? "text-emerald-600 scale-105" : "text-gray-400"
          }`}
        >
          <Compass size={18} />
          <span className="text-[9px] font-bold uppercase tracking-wider leading-none">🗺️ Map</span>
        </button>

        <button
          onClick={() => {
            setIsWorkspaceSheetOpen(true);
            setIsCopilotSheetOpen(false);
          }}
          className={`flex flex-col items-center justify-center gap-1 w-20 py-1 transition-all cursor-pointer ${
            isWorkspaceSheetOpen ? "text-indigo-600 scale-105" : "text-gray-400"
          }`}
        >
          <Calendar size={18} />
          <span className="text-[9px] font-bold uppercase tracking-wider leading-none">📅 Itinerary</span>
        </button>

        <button
          onClick={() => {
            setIsCopilotSheetOpen(true);
            setIsWorkspaceSheetOpen(false);
          }}
          className={`flex flex-col items-center justify-center gap-1 w-20 py-1 transition-all cursor-pointer ${
            isCopilotSheetOpen ? "text-emerald-600 scale-105 animate-pulse" : "text-gray-400"
          }`}
        >
          <Bot size={18} />
          <span className="text-[9px] font-bold uppercase tracking-wider leading-none">💬 Ask Milo</span>
        </button>
      </div>

      {/* MOBILE SHEETS OVERLAYS: USING ANIMATE PRESENCE AND NATIVE FRAME MOTION SLIDE INS */}
      <AnimatePresence>
        
        {/* MOBILE WORKSPACE DRAWER SHEET */}
        {isWorkspaceSheetOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="md:hidden fixed inset-x-0 bottom-14 top-20 bg-white border-t border-gray-200 z-50 rounded-t-3xl shadow-2xl overflow-y-auto flex flex-col px-5 pt-3 pb-8 [scrollbar-width:thin]"
          >
            {/* Handlebar drag indicator visual */}
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-5 shrink-0" />
            
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-1.5">
                📋 Workspace Itinerary
              </h2>
              <button
                onClick={() => setIsWorkspaceSheetOpen(false)}
                className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Simulated content panel */}
            <div className="flex-1 space-y-6">
              
              {/* CURRENT ACTIVE TRIP INFO */}
              {destinationCoords ? (
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3.5">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-600 font-bold block">Active Journey Telemetry</span>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-900">Commute to: {destinationAddress}</p>
                    <p className="text-[10px] text-gray-400 mt-1">Suggested Leave Time: {suggestedLeaveByTime}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 bg-white/90 p-2.5 rounded-xl border border-emerald-100/30">
                    <div>
                      <span className="text-[9px] font-mono uppercase text-gray-400 font-semibold block">Distance</span>
                      <span className="text-xs font-bold text-gray-950 block mt-0.5">{routeDistanceKm.toFixed(1)} km</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono uppercase text-gray-400 font-semibold block">Duration</span>
                      <span className="text-xs font-bold text-emerald-600 block mt-0.5">{etaMinutes} min</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsWorkspaceSheetOpen(false);
                        startNavigationSim();
                      }}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Activity size={13} />
                      Navigate Sim
                    </button>
                    <button
                      onClick={() => {
                        setDestinationCoords(null);
                        setDestinationAddress("");
                        setDestinationSearch("");
                        speakText("Route cleared.");
                      }}
                      className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-500 text-xs font-mono font-bold uppercase rounded-xl cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <Compass className="mx-auto text-gray-300 animate-pulse mb-1.5" size={24} />
                  <p className="text-xs font-semibold text-gray-400">No active navigation destination</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">Please search any spot or click on the map to trigger route simulation.</p>
                </div>
              )}

              {/* CALENDAR & PLANNER TIMELINE */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Today's Schedule</span>
                {calendarTimeline.length > 0 ? (
                  <div className="space-y-2">
                    {calendarTimeline.map(item => (
                      <div key={item.id} className="p-3 bg-gray-50/50 rounded-xl border border-gray-150 flex items-start gap-2 justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-900 truncate">{item.title}</p>
                          <p className="text-[10px] text-gray-400 truncate mt-1">📍 {item.location} • {item.deadline ? item.deadline.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Scheduled"}</p>
                          <p className="text-[9px] font-mono text-indigo-600 font-bold mt-1.5 bg-indigo-50/50 w-fit px-1 py-0.5 rounded">⏱️ Suggested Leave by: {suggestedLeaveByTime}</p>
                        </div>
                        <button
                          onClick={() => {
                            setIsWorkspaceSheetOpen(false);
                            handleSearchAndLocate(item.location);
                          }}
                          className="px-2.5 py-1 bg-indigo-600 text-white font-mono text-[9px] font-bold uppercase rounded-lg cursor-pointer shrink-0"
                        >
                          Route
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-400 leading-normal bg-gray-50 p-3 rounded-xl border border-gray-150 text-center">No location-tagged items found in planner.</p>
                )}
              </div>

              {/* SAVED WORKSPACE PLACES */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-sans">Workspace Pins</span>
                <div className="grid grid-cols-2 gap-2">
                  {savedPlaces.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setIsWorkspaceSheetOpen(false);
                        setDestinationCoords({ lat: p.lat, lng: p.lng });
                        setDestinationAddress(p.address);
                        setDestinationSearch(p.name);
                        speakText(`Routing to ${p.name}.`);
                      }}
                      className="p-3 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-950 border border-gray-200 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between h-20"
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-base leading-none">{p.category === "home" ? "🏠" : p.category === "college" ? "🎓" : p.category === "office" ? "🏢" : p.category === "gym" ? "💪" : "📍"}</span>
                        <span className="text-xs font-bold truncate">{p.name}</span>
                      </div>
                      <span className="text-[9px] text-gray-400 truncate w-full leading-none block">{p.address}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* MOBILE MILO COPILOT DRAWER SHEET */}
        {isCopilotSheetOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="md:hidden fixed inset-x-0 bottom-14 top-20 bg-white border-t border-gray-200 z-50 rounded-t-3xl shadow-2xl flex flex-col p-4 pb-8"
          >
            {/* Handlebar drag indicator visual */}
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4 shrink-0" />

            <div className="flex items-center justify-between mb-2 shrink-0">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-1.5">
                🤖 Milo Copilot Voice & Chat
              </h2>
              <button
                onClick={() => setIsCopilotSheetOpen(false)}
                className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Embedded Milo Chat panel inside mobile drawer */}
            <div className="flex-1 min-h-0 bg-gray-50/50 border border-gray-150 rounded-2xl overflow-hidden p-1 flex flex-col shadow-[inset_0_1px_3px_rgba(0,0,0,0.01)]">
              <MiloChat />
            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
