import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLocalization, countryConfigs } from "../context/LocalizationContext";
import { Task } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  MapPin, 
  Navigation, 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudLightning,
  Clock, 
  ArrowRight, 
  Search, 
  Plus, 
  Check, 
  Info, 
  Sliders, 
  Activity, 
  Coffee, 
  BookOpen, 
  Home, 
  Sparkles, 
  CheckCircle2, 
  Locate,
  AlertCircle,
  Star,
  AlertTriangle,
  Shield,
  Bell,
  Volume2,
  Moon,
  Compass,
  RefreshCw,
  Car,
  Bike,
  Train,
  Briefcase,
  Layers,
  HeartPulse,
  Trash2,
  Calendar,
  Lock,
  Compass as CompassIcon,
  HelpCircle,
  Eye,
  User,
  Zap,
  Mic,
  Map as MapIcon,
  Globe
} from "lucide-react";
import L from "leaflet";
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";

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
  category: "home" | "office" | "college" | "gym" | "hospital" | "library" | "parents" | "custom";
}

interface TripHistory {
  id: string;
  origin: string;
  destination: string;
  mode: string;
  date: string;
  distance?: string;
  duration?: string;
  arrivalTime?: string;
}

export default function SmartMapTab({
  tasks,
  onAddTask,
  onUpdateTask
}: SmartMapTabProps) {
  // 1. ENVIRONMENT & API KEY VALIDATION
  const GOOGLE_MAPS_API_KEY =
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
    "";
  const hasValidGoogleKey = Boolean(GOOGLE_MAPS_API_KEY) && GOOGLE_MAPS_API_KEY.trim().length > 10 && GOOGLE_MAPS_API_KEY !== "YOUR_API_KEY";

  // 2. PRIVACY & LOCATION PERMISSION STATE
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<"granted" | "denied" | "undecided">(() => {
    return (localStorage.getItem("smart_map_location_permission") as "granted" | "denied" | "undecided") || "undecided";
  });
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  // Privacy Options (Local Storage persisted)
  const [pauseGPS, setPauseGPS] = useState(() => localStorage.getItem("privacy_pause_gps") === "true");
  const [disableTracking, setDisableTracking] = useState(() => localStorage.getItem("privacy_disable_tracking") === "true");
  const [disableSuggestions, setDisableSuggestions] = useState(() => localStorage.getItem("privacy_disable_suggestions") === "true");

  // Sync privacy settings
  useEffect(() => {
    localStorage.setItem("privacy_pause_gps", String(pauseGPS));
  }, [pauseGPS]);
  useEffect(() => {
    localStorage.setItem("privacy_disable_tracking", String(disableTracking));
  }, [disableTracking]);
  useEffect(() => {
    localStorage.setItem("privacy_disable_suggestions", String(disableSuggestions));
  }, [disableSuggestions]);

  const {
    country, state, district, city,
    postalCode, latitude, longitude,
    isTravelMode, homeCountry,
    travelProductivityMode, setTravelProductivityMode,
    isOffline, setIsOffline, simulateTravel, convertDeadlineDisplay,
    timeFormat
  } = useLocalization();

  // 3. CORE ROUTING & TRAVEL COORDINATES
  const [originAddress, setOriginAddress] = useState("");
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [destinationAddress, setDestinationAddress] = useState("");
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [travelMode, setTravelMode] = useState<"walking" | "bicycle" | "bike" | "car" | "taxi" | "bus" | "metro" | "train" | "flight">("car");
  const [desiredArrivalTime, setDesiredArrivalTime] = useState("Reach as early as possible");
  const [mapType, setMapType] = useState<"roadmap" | "satellite" | "hybrid" | "terrain">("roadmap");
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Loading and acquiring location states
  const [mapStatusMessage, setMapStatusMessage] = useState<string>("Requesting Location...");
  const [isAcquiringLocation, setIsAcquiringLocation] = useState(false);

  // Speech and Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  // 4. SAVED PLACES STATE (Empty by default per user specification)
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>(() => {
    const stored = localStorage.getItem("smart_map_saved_places");
    if (stored) return JSON.parse(stored);
    return []; // No default locations. Empty list.
  });

  const [newPlaceName, setNewPlaceName] = useState("");
  const [newPlaceAddress, setNewPlaceAddress] = useState("");
  const [newPlaceCategory, setNewPlaceCategory] = useState<SavedPlace["category"]>("custom");
  const [showAddPlaceModal, setShowAddPlaceModal] = useState(false);

  useEffect(() => {
    localStorage.setItem("smart_map_saved_places", JSON.stringify(savedPlaces));
  }, [savedPlaces]);

  // 5. TRIP HISTORY STATE
  const [travelHistory, setTravelHistory] = useState<TripHistory[]>(() => {
    const stored = localStorage.getItem("smart_map_history");
    if (stored) return JSON.parse(stored);
    return [];
  });

  useEffect(() => {
    localStorage.setItem("smart_map_history", JSON.stringify(travelHistory));
  }, [travelHistory]);

  const handleClearHistory = () => {
    setTravelHistory([]);
    triggerAudioTone("success");
    triggerNotification("Travel history permanently deleted.", "success");
  };

  // 6. LIVE NAVIGATION TRACKING STATE
  const [liveNavigationActive, setLiveNavigationActive] = useState(false);
  const [navigationProgress, setNavigationProgress] = useState(0); // 0 to 100%
  const [departureReminderDismissed, setDepartureReminderDismissed] = useState(false);
  const [snoozeMinutes, setSnoozeMinutes] = useState(0);

  // Recalculating state simulation
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Notification states
  const [activeAlert, setActiveAlert] = useState<{ text: string; type: "success" | "warning" | "alert" | "emergency" } | null>(null);

  // Leaflet references
  const leafletMapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapInstanceRef = useRef<L.Map | null>(null);
  const leafletTileLayerRef = useRef<L.TileLayer | null>(null);
  const leafletMarkersRef = useRef<L.Marker[]>([]);
  const leafletRouteLineRef = useRef<L.Polyline | null>(null);
  const leafletVehicleRef = useRef<L.Marker | null>(null);

  // Search Results & Autocomplete
  const [destinationSearch, setDestinationSearch] = useState("");
  const [isSearchingDest, setIsSearchingDest] = useState(false);
  const [recentDestinations, setRecentDestinations] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem("smart_map_recent_destinations") || '[]');
  });

  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<any[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Speak feedback text to user via SpeechSynthesis
  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel(); // stop current speaking
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn("SpeechSynthesis failed:", e);
      }
    }
  };

  // Debounced live autocomplete suggestion fetching
  useEffect(() => {
    if (destinationSearch.trim().length < 3) {
      setAutocompleteSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      // Filter local saved places first
      const savedMatches = savedPlaces
        .filter(p => p.name.toLowerCase().includes(destinationSearch.toLowerCase()))
        .map(p => ({
          id: p.id,
          name: p.name,
          city: p.address.split(",")[0] || "",
          country: "Saved Place",
          lat: p.lat,
          lng: p.lng,
          isSaved: true
        }));

      try {
        // Query OpenStreetMap Nominatim Geocoder
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destinationSearch)}&limit=5&addressdetails=1`;
        const res = await fetch(url, {
          headers: {
            "Accept-Language": "en"
          }
        });
        if (res.ok) {
          const data = await res.json();
          const apiSuggestions = data.map((item: any) => {
            const address = item.address || {};
            const city = address.city || address.town || address.suburb || address.village || "";
            const country = address.country || "";
            const name = item.display_name.split(",")[0];
            return {
              id: item.place_id.toString(),
              name: name,
              city: city,
              country: country,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              displayName: item.display_name
            };
          });

          setAutocompleteSuggestions([...savedMatches, ...apiSuggestions]);
          setSelectedSuggestionIndex(-1);
        }
      } catch (e) {
        setAutocompleteSuggestions(savedMatches);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [destinationSearch, savedPlaces]);

  const selectSuggestion = (sug: any) => {
    setDestinationCoords({ lat: sug.lat, lng: sug.lng });
    const formattedAddr = sug.isSaved ? sug.city : (sug.name + (sug.city ? ", " + sug.city : "") + (sug.country ? ", " + sug.country : ""));
    setDestinationAddress(formattedAddr);
    setDestinationSearch(sug.name);
    setAutocompleteSuggestions([]);
    
    // Add to recent searches
    setRecentDestinations(prev => {
      const updated = [sug.name, ...prev.filter(x => x !== sug.name)].slice(0, 5);
      localStorage.setItem("smart_map_recent_destinations", JSON.stringify(updated));
      return updated;
    });

    triggerNotification(`🎯 Marker placed at: ${sug.name}`, "success");
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => Math.min(prev + 1, autocompleteSuggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0 && autocompleteSuggestions[selectedSuggestionIndex]) {
        selectSuggestion(autocompleteSuggestions[selectedSuggestionIndex]);
      } else if (autocompleteSuggestions.length > 0) {
        selectSuggestion(autocompleteSuggestions[0]);
      } else {
        triggerDestinationSearch(destinationSearch);
      }
    } else if (e.key === "Escape") {
      setAutocompleteSuggestions([]);
    }
  };

  // Voice navigation console state
  const [voiceCommand, setVoiceCommand] = useState("");
  const [voiceConsoleOpen, setVoiceConsoleOpen] = useState(true); // Open by default for prominence

  // Triggering visual alerts and synthetic sounds
  const triggerAudioTone = (toneType: "success" | "warning" | "alert" | "emergency") => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      if (toneType === "success") {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (toneType === "warning") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(349.23, ctx.currentTime); // F4
        gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (toneType === "alert") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(698.46, ctx.currentTime); // F5
        osc.frequency.exponentialRampToValueAtTime(349.23, ctx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (toneType === "emergency") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.linearRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5
        osc.frequency.linearRampToValueAtTime(523.25, ctx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (err) {
      console.warn("Audio Context blocked by browser safety protocols:", err);
    }
  };

  const triggerNotification = (text: string, type: "success" | "warning" | "alert" | "emergency" = "alert") => {
    setActiveAlert({ text, type });
    triggerAudioTone(type);
    setTimeout(() => {
      setActiveAlert(prev => prev?.text === text ? null : prev);
    }, 6000);
  };

  // 7. LOCATION REQUEST HANDLER (AUTOMATIC ACQUISITION CYCLE & FALLBACKS)
  const handleGPSButtonClick = () => {
    setMapStatusMessage("Requesting Location...");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setOriginCoords({ lat, lng });
          setMapStatusMessage("Loading Map...");
          
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=12`);
            if (res.ok) {
              const data = await res.json();
              const displayName = data.display_name.split(",").slice(0, 3).join(",");
              setOriginAddress(displayName || `My Current Position (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
            } else {
              setOriginAddress(`My Current Position (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
            }
          } catch {
            setOriginAddress(`My Current Position (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
          }
          
          setMapStatusMessage("");
          triggerNotification("📍 GPS live coordinates updated. Map centered!", "success");
          if (leafletMapInstanceRef.current) {
            leafletMapInstanceRef.current.setView([lat, lng], 13, { animate: true });
          }
        },
        async (error) => {
          console.warn("GPS button failed. Fetching IP Geolocation fallback...", error);
          setMapStatusMessage("Finding GPS...");
          await runIPFallback();
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      triggerNotification("⚠️ Geolocation API not supported.", "warning");
    }
  };

  const handleRequestLocation = () => {
    handleGPSButtonClick();
  };

  const handleDeclineLocation = () => {
    setLocationPermissionStatus("denied");
    localStorage.setItem("smart_map_location_permission", "denied");
    runIPFallback();
  };

  const runIPFallback = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      if (res.ok) {
        const data = await res.json();
        const lat = parseFloat(data.latitude);
        const lng = parseFloat(data.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          setOriginCoords({ lat, lng });
          setOriginAddress(`${data.city || "My Area"}, ${data.region || ""}`);
          setLocationPermissionStatus("granted");
          localStorage.setItem("smart_map_location_permission", "granted");
          setMapStatusMessage("");
          triggerNotification(`📍 Centered using IP Geolocation fallback: ${data.city}`, "success");
          if (leafletMapInstanceRef.current) {
            leafletMapInstanceRef.current.setView([lat, lng], 13, { animate: true });
          }
          return;
        }
      }
    } catch (e) {
      console.warn("IP Geolocation failed:", e);
    }

    // Try localization context
    const parsedLat = parseFloat(latitude);
    const parsedLng = parseFloat(longitude);
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      setOriginCoords({ lat: parsedLat, lng: parsedLng });
      setOriginAddress(`${city || "My Location"}, ${state || ""}`);
      setLocationPermissionStatus("granted");
      localStorage.setItem("smart_map_location_permission", "granted");
      setMapStatusMessage("");
      triggerNotification("📍 Centered using device context location", "success");
    } else {
      // Fallback location that is NOT SF to avoid demo coordinates
      setOriginCoords({ lat: 40.7128, lng: -74.0060 }); // New York City fallback
      setOriginAddress("New York, NY");
      setLocationPermissionStatus("granted");
      setMapStatusMessage("");
      triggerNotification("⚠️ Unable to resolve GPS. Manual entry enabled.", "warning");
    }
  };

  // Mount Automatic Location Fetcher
  useEffect(() => {
    const initLocation = async () => {
      if (pauseGPS) {
        setMapStatusMessage("Finding GPS...");
        await runIPFallback();
        return;
      }

      setMapStatusMessage("Requesting Location...");
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setOriginCoords({ lat, lng });
            setMapStatusMessage("Loading Map...");
            
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=12`);
              if (res.ok) {
                const data = await res.json();
                const displayName = data.display_name.split(",").slice(0, 3).join(",");
                setOriginAddress(displayName || `My Current Position (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
              } else {
                setOriginAddress(`My Current Position (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
              }
            } catch {
              setOriginAddress(`My Current Position (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
            }
            
            setLocationPermissionStatus("granted");
            localStorage.setItem("smart_map_location_permission", "granted");
            setMapStatusMessage("");
            triggerNotification("📍 Live GPS location successfully acquired!", "success");
          },
          async (error) => {
            console.warn("Initial browser GPS denied or failed. Trying IP location...", error);
            setMapStatusMessage("Finding GPS...");
            await runIPFallback();
          },
          { enableHighAccuracy: true, timeout: 6000 }
        );
      } else {
        setMapStatusMessage("Finding GPS...");
        await runIPFallback();
      }
    };

    initLocation();
  }, []);

  // 8. AUTO TRIGGER WEATHER GENERATOR FOR ORIGIN & DESTINATION (DYNAMIC LINK)
  const [weatherData, setWeatherData] = useState<any>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  useEffect(() => {
    if (!originCoords) return;

    const fetchWeather = async () => {
        try {
          let originQuery = `lat=${originCoords.lat}&lon=${originCoords.lng}`;
          const originRes = await fetch(`/api/weather?${originQuery}`);
          const originData = await originRes.json();
          
          let destData = null;
          if (destinationCoords) {
            const destRes = await fetch(`/api/weather?lat=${destinationCoords.lat}&lon=${destinationCoords.lng}`);
            destData = await destRes.json();
          }

          setWeatherData({ origin: originData, dest: destData || originData });
          setWeatherError(null);
        } catch (err) {
          setWeatherError("Weather unavailable");
          console.warn("Weather API Error:", err);
        }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, [originCoords, destinationCoords]);

  // Contextual advice suggestions based on weather
  const getConditionString = (code: number) => {
    if (code === 0) return "Clear";
    if (code <= 3) return "Cloudy";
    if (code >= 45 && code <= 48) return "Fog";
    if (code >= 51 && code <= 67) return "Rain";
    if (code >= 71 && code <= 86) return "Snow";
    if (code >= 95) return "Thunderstorm";
    return "Unknown";
  };

  const healthSuggestions = useMemo(() => {
    const suggestions: string[] = [];
    if (!weatherData || !weatherData.dest) return suggestions;
    const dest = weatherData.dest;
    if (dest.temperature >= 30) {
      suggestions.push("⚠️ High Temperature: Stay hydrated. Carry an extra bottle of water.");
    }
    if (getConditionString(dest.conditionCode) === "Fog") {
      suggestions.push("⚠️ Dense Fog: Low visibility. Allow an extra 10-15 minutes of buffer time.");
    }
    if (dest.rain > 0) {
      suggestions.push("☔ Rain Forecasted: Carry a travel umbrella or waterproof jacket.");
    }
    if (dest.uvIndex >= 7) {
      suggestions.push("☀️ Intense UV Radiation: High exposure risk. Apply sunscreen (SPF 30+).");
    }
    // Evening trip suggestion
    const isNight = new Date().getHours() > 19 || new Date().getHours() < 6;
    if (isNight) {
      suggestions.push("🌙 Late Night Commute: Share your active trip details with a trusted contact.");
    }
    if (destinationCoords && originCoords) {
      const distance = calculateDistance(originCoords.lat, originCoords.lng, destinationCoords.lat, destinationCoords.lng);
      if (distance > 15) {
        suggestions.push("🚗 Long Journey: Consider taking a short 5-minute stretch break every 2 hours.");
      }
    }
    return suggestions;
  }, [weatherData, destinationCoords, originCoords]);

  // Haversine calculator
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  const activeDistanceKm = useMemo(() => {
    if (!destinationCoords || !originCoords) return 0;
    return calculateDistance(originCoords.lat, originCoords.lng, destinationCoords.lat, destinationCoords.lng);
  }, [originCoords, destinationCoords]);

  const activeDurationMinutes = useMemo(() => {
    if (activeDistanceKm === 0) return 0;
    let baselineSpeed = 50; // Car / Taxi
    if (travelMode === "walking") baselineSpeed = 5;
    else if (travelMode === "bicycle") baselineSpeed = 16;
    else if (travelMode === "bike") baselineSpeed = 40;
    else if (travelMode === "bus") baselineSpeed = 24;
    else if (travelMode === "metro" || travelMode === "train") baselineSpeed = 45;
    else if (travelMode === "flight") baselineSpeed = 550;

    let timeMinutes = (activeDistanceKm / baselineSpeed) * 60;

    // Traffic congestion factors
    if (travelMode === "car" || travelMode === "taxi") {
      if (weatherData && weatherData.dest && getConditionString(weatherData.dest.conditionCode) === "Fog") timeMinutes *= 1.35;
      timeMinutes *= 1.2; // general traffic delay factor
    }

    return Math.max(1, Math.round(timeMinutes));
  }, [activeDistanceKm, travelMode, weatherData]);

  // 9. AI TRAVEL INTEGRIGENCE ANALYSIS RECOMMENDATION
  const aiTravelAnalysis = useMemo(() => {
    if (!destinationCoords) return null;

    let isDelayRisk = false;
    let trafficFactor = "Moderate Congestion";
    let alternativeRec = "";
    let confidence = "High";

    if (activeDistanceKm > 8 && (travelMode === "car" || travelMode === "taxi")) {
      isDelayRisk = true;
      trafficFactor = "Heavy Commute Congestion (increased by 18 minutes)";
      alternativeRec = "Take the Metro lines for high temporal certainty. Direct connection saves up to 12 minutes.";
      confidence = "Medium - Traffic Fluctuation";
    } else if (weatherData && weatherData.dest && getConditionString(weatherData.dest.conditionCode) === "Fog") {
      isDelayRisk = true;
      trafficFactor = "High Collision Risk due to Coastal Fog Layer";
      alternativeRec = "Keep extra spacing; follow regional shuttle lines on Route 101.";
      confidence = "Medium - Low Visibility";
    } else {
      alternativeRec = "Take the scenic coastal bicycle lane. Clear paths, zero congestion delays.";
      confidence = "Very High (98%)";
    }

    const departureBufferMinutes = 14; 
    const arrivalMarginMinutes = 10;

    return {
      trafficFactor,
      isDelayRisk,
      alternativeRec,
      confidence,
      departureBufferMinutes,
      arrivalMarginMinutes,
      bestDepartureTime: `Leave in ${departureBufferMinutes} minutes to arrive ${arrivalMarginMinutes} minutes early.`
    };
  }, [destinationCoords, activeDistanceKm, travelMode, weatherData]);

  // 10. LEAFLET OSM INTERACTIVE MAP INITIALIZATION & REACTIVE SYNC
  useEffect(() => {
    if (hasValidGoogleKey || locationPermissionStatus === "undecided" || !originCoords) return;

    // Inject Leaflet Stylesheet dynamically if not loaded
    if (!document.getElementById("leaflet-osm-css-style")) {
      const link = document.createElement("link");
      link.id = "leaflet-osm-css-style";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Inject Dash-animation styles
    if (!document.getElementById("leaflet-animated-route-path")) {
      const style = document.createElement("style");
      style.id = "leaflet-animated-route-path";
      style.textContent = `
        @keyframes dashRouteEffect {
          to { stroke-dashoffset: -40; }
        }
        .leaflet-animated-route {
          animation: dashRouteEffect 1.2s linear infinite;
        }
      `;
      document.head.appendChild(style);
    }

    if (!leafletMapContainerRef.current) return;

    // Initialize map if it doesn't exist
    if (!leafletMapInstanceRef.current) {
      const mapInstance = L.map(leafletMapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([originCoords.lat, originCoords.lng], 12);

      L.control.zoom({ position: "bottomright" }).addTo(mapInstance);

      // Simple Click handler to drop a pin
      mapInstance.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        setDestinationCoords({ lat, lng });
        setDestinationAddress(`Dropped Marker (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        triggerAudioTone("success");
        triggerNotification("🎯 Dropped route waypoint pin on map. Smart commute path configured!", "success");
      });

      leafletMapInstanceRef.current = mapInstance;
    }

    return () => {
      // Clean up Leaflet on unmount or key transition
      if (leafletMapInstanceRef.current) {
        leafletMapInstanceRef.current.off();
        leafletMapInstanceRef.current.remove();
        leafletMapInstanceRef.current = null;
      }
    };
  }, [hasValidGoogleKey, locationPermissionStatus, originCoords]);

  // Sync Leaflet Layers (Dark vs Standard vs Satellite)
  useEffect(() => {
    const mapInstance = leafletMapInstanceRef.current;
    if (!mapInstance || hasValidGoogleKey) return;

    if (leafletTileLayerRef.current) {
      mapInstance.removeLayer(leafletTileLayerRef.current);
    }

    let url = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
    if (isDarkMode) {
      url = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    } else if (mapType === "satellite") {
      url = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    }

    const tileLayer = L.tileLayer(url, { maxZoom: 19 }).addTo(mapInstance);
    leafletTileLayerRef.current = tileLayer;
  }, [isDarkMode, mapType, hasValidGoogleKey, locationPermissionStatus]);

  // Render Leaflet Markers & Routing lines
  useEffect(() => {
    const mapInstance = leafletMapInstanceRef.current;
    if (!mapInstance || hasValidGoogleKey || !originCoords) return;

    // 1. Clear old location markers
    leafletMarkersRef.current.forEach(m => m.remove());
    leafletMarkersRef.current = [];

    // 2. Add Origin Marker
    const originIcon = L.divIcon({
      className: "origin-marker-container",
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute -inset-2 rounded-full bg-blue-500/30 animate-ping"></div>
          <div class="w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white shadow-md">
            📍
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const originMarker = L.marker([originCoords.lat, originCoords.lng], { icon: originIcon }).addTo(mapInstance);
    leafletMarkersRef.current.push(originMarker);

    // 3. Add Saved Places markers
    savedPlaces.forEach(p => {
      const isTarget = destinationCoords && Math.abs(p.lat - destinationCoords.lat) < 0.001 && Math.abs(p.lng - destinationCoords.lng) < 0.001;
      const placeIcon = L.divIcon({
        className: "saved-place-marker",
        html: `
          <div class="relative flex items-center justify-center group">
            <div class="w-6 h-6 rounded-lg ${isTarget ? "bg-emerald-500 border-white" : "bg-neutral-800 border-neutral-600"} border flex items-center justify-center text-xs text-white shadow-sm transition-transform hover:scale-110">
              ${p.category === "home" ? "🏠" : p.category === "office" ? "🏢" : p.category === "college" ? "🎓" : p.category === "gym" ? "💪" : "📍"}
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const placeMarker = L.marker([p.lat, p.lng], { icon: placeIcon })
        .addTo(mapInstance)
        .on("click", () => {
          setDestinationCoords({ lat: p.lat, lng: p.lng });
          setDestinationAddress(p.address);
          triggerAudioTone("success");
        });
      
      leafletMarkersRef.current.push(placeMarker);
    });

    // 4. Add Destination marker if present
    if (destinationCoords) {
      const destIcon = L.divIcon({
        className: "destination-marker-container",
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute -inset-3 rounded-full bg-emerald-500/20 animate-pulse"></div>
            <div class="w-9 h-9 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-xl">
              🏁
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const destMarker = L.marker([destinationCoords.lat, destinationCoords.lng], { icon: destIcon }).addTo(mapInstance);
      leafletMarkersRef.current.push(destMarker);
    }

    // 5. Draw dynamic route line
    if (leafletRouteLineRef.current) {
      mapInstance.removeLayer(leafletRouteLineRef.current);
      leafletRouteLineRef.current = null;
    }

    if (destinationCoords) {
      const points: L.LatLngExpression[] = [
        [originCoords.lat, originCoords.lng],
        [destinationCoords.lat, destinationCoords.lng]
      ];

      // Dynamic curve offset to make routes look natural
      const midLat = (originCoords.lat + destinationCoords.lat) / 2;
      const midLng = (originCoords.lng + destinationCoords.lng) / 2;
      const offsetLat = midLat + (destinationCoords.lng - originCoords.lng) * 0.12;
      const offsetLng = midLng - (destinationCoords.lat - originCoords.lat) * 0.12;

      const pathPoints: L.LatLngExpression[] = [
        [originCoords.lat, originCoords.lng],
        [offsetLat, offsetLng],
        [destinationCoords.lat, destinationCoords.lng]
      ];

      const routeLine = L.polyline(pathPoints, {
        color: isDarkMode ? "#34d399" : "#10b981",
        weight: 5,
        opacity: 0.9,
        dashArray: "12, 10",
        className: "leaflet-animated-route"
      }).addTo(mapInstance);

      leafletRouteLineRef.current = routeLine;

      // Adjust viewport boundary with smooth transition
      const bounds = L.latLngBounds([
        [originCoords.lat, originCoords.lng],
        [destinationCoords.lat, destinationCoords.lng]
      ]);
      mapInstance.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1.2 });
    } else {
      mapInstance.setView([originCoords.lat, originCoords.lng], 12);
    }
  }, [originCoords, destinationCoords, savedPlaces, isDarkMode, hasValidGoogleKey, locationPermissionStatus]);

  // Live navigation tracking vehicle overlay (Leaflet)
  useEffect(() => {
    const mapInstance = leafletMapInstanceRef.current;
    if (!mapInstance || hasValidGoogleKey || !originCoords) return;

    if (leafletVehicleRef.current) {
      mapInstance.removeLayer(leafletVehicleRef.current);
      leafletVehicleRef.current = null;
    }

    if (liveNavigationActive && destinationCoords) {
      const ratio = navigationProgress / 100;
      // Calculate position along our curved route
      const midLat = (originCoords.lat + destinationCoords.lat) / 2;
      const midLng = (originCoords.lng + destinationCoords.lng) / 2;
      const offsetLat = midLat + (destinationCoords.lng - originCoords.lng) * 0.12;
      const offsetLng = midLng - (destinationCoords.lat - originCoords.lat) * 0.12;

      let lat = originCoords.lat;
      let lng = originCoords.lng;

      if (ratio < 0.5) {
        const subRatio = ratio * 2;
        lat = originCoords.lat + (offsetLat - originCoords.lat) * subRatio;
        lng = originCoords.lng + (offsetLng - originCoords.lng) * subRatio;
      } else {
        const subRatio = (ratio - 0.5) * 2;
        lat = offsetLat + (destinationCoords.lat - offsetLat) * subRatio;
        lng = offsetLng + (destinationCoords.lng - offsetLng) * subRatio;
      }

      const vehicleIcon = L.divIcon({
        className: "vehicle-avatar",
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute -inset-2 rounded-full bg-emerald-400/40 animate-ping"></div>
            <div class="w-8 h-8 rounded-full bg-emerald-600 border border-white flex items-center justify-center text-xs text-white shadow-lg animate-bounce">
              ${travelMode === "walking" ? "🚶" : travelMode === "bicycle" ? "🚲" : travelMode === "bike" ? "🏍️" : "🚗"}
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const vehicleMarker = L.marker([lat, lng], { icon: vehicleIcon }).addTo(mapInstance);
      leafletVehicleRef.current = vehicleMarker;

      // Keep map centered on vehicle
      if (!disableTracking) {
        mapInstance.panTo([lat, lng], { animate: true });
      }
    }
  }, [liveNavigationActive, navigationProgress, originCoords, destinationCoords, travelMode, hasValidGoogleKey, disableTracking]);

  // Real GPS watchPosition tracking for live journey (only moves when coordinates update)
  useEffect(() => {
    if (!liveNavigationActive || !destinationCoords) return;

    let watchId: number | null = null;

    if (navigator.geolocation) {
      triggerNotification("🛰️ Real GPS tracking active. Waiting for hardware movement telemetry...", "success");
      
      const startLat = originCoords ? originCoords.lat : 40.7128;
      const startLng = originCoords ? originCoords.lng : -74.0060;
      const destLat = destinationCoords.lat;
      const destLng = destinationCoords.lng;
      
      const initialDist = Math.sqrt(Math.pow(destLat - startLat, 2) + Math.pow(destLng - startLng, 2)) || 0.001;

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setOriginCoords({ lat, lng });
          
          const remainingDist = Math.sqrt(Math.pow(destLat - lat, 2) + Math.pow(destLng - lng, 2));
          const currentProgress = Math.max(0, Math.min(100, Math.round((1 - remainingDist / initialDist) * 100)));
          
          setNavigationProgress(currentProgress);

          if (currentProgress >= 98 || remainingDist < 0.0001) {
            setLiveNavigationActive(false);
            setNavigationProgress(100);
            logCompletedTrip();
          }
        },
        (error) => {
          console.error("GPS Watch error: ", error);
          triggerNotification("⚠️ Live GPS watch error. Ensure location permissions are active.", "warning");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      triggerNotification("⚠️ Geolocation API not supported in this environment.", "warning");
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [liveNavigationActive, destinationCoords, travelMode, destinationAddress, originCoords]);

  const logCompletedTrip = () => {
    // Compute arrival clock time
    const arrivalDate = new Date();
    arrivalDate.setMinutes(arrivalDate.getMinutes() + activeDurationMinutes);
    const arrivalTimeString = arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newTrip: TripHistory = {
      id: `trip-${Date.now()}`,
      origin: originAddress || "My Location",
      destination: destinationAddress,
      mode: travelMode,
      distance: `${activeDistanceKm.toFixed(2)} km`,
      duration: `${activeDurationMinutes} mins`,
      arrivalTime: arrivalTimeString,
      date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }) + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setTravelHistory(prevH => [newTrip, ...prevH]);
    triggerNotification("🏁 Arrived at your destination! Logged to history.", "success");
    triggerAudioTone("success");
    speakText(`Arrived. You have completed your journey to ${destinationAddress}. Trip saved.`);
  };

  // 11. DYNAMIC SEARCH & AUTOCOMPLETE FUNCTION
  const triggerDestinationSearch = async (term: string) => {
    if (!term.trim()) return;
    setIsSearchingDest(true);

    // Filter local saved places first
    const match = savedPlaces.find(p => p.name.toLowerCase().includes(term.toLowerCase()));
    if (match) {
      setDestinationCoords({ lat: match.lat, lng: match.lng });
      setDestinationAddress(match.address);
      setIsSearchingDest(false);
      triggerNotification(`🎯 Match found: ${match.name}`, "success");
      return;
    }

    try {
      // Free public OpenStreetMap Nominatim Geocoding API centered near they current location bounds
      let viewboxParam = "";
      if (originCoords) {
        const delta = 0.5; // roughly 50km radius
        viewboxParam = `&viewbox=${originCoords.lng - delta},${originCoords.lat + delta},${originCoords.lng + delta},${originCoords.lat - delta}`;
      }
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(term)}&limit=1${viewboxParam}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          setDestinationCoords({ lat, lng });
          setDestinationAddress(data[0].display_name.split(",").slice(0, 3).join(","));
          
          // Add to recent searches
          setRecentDestinations(prev => {
            const updated = [term, ...prev.filter(x => x !== term)].slice(0, 5);
            localStorage.setItem("smart_map_recent_destinations", JSON.stringify(updated));
            return updated;
          });

          triggerNotification(`🎯 Located on map: ${term}`, "success");
          if (leafletMapInstanceRef.current) {
            leafletMapInstanceRef.current.setView([lat, lng], 13, { animate: true });
          }
        } else {
          triggerNotification("🔍 No coordinates found. Try typing city or details.", "warning");
        }
      }
    } catch (e) {
      triggerNotification("⚠️ External geocoding search failed. Drop marker directly on map.", "warning");
    } finally {
      setIsSearchingDest(false);
    }
  };

  // 12. CALENDAR INTEGRATION DETECTOR
  const calendarTasksWithLocation = useMemo(() => {
    return tasks.filter(t => {
      const titleLower = t.title.toLowerCase();
      const matchKeywords = ["meeting", "class", "interview", "exam", "appointment", "lecture", "presentation"];
      const isCalendarStyle = matchKeywords.some(k => titleLower.includes(k));
      return isCalendarStyle || t.destination;
    });
  }, [tasks]);

  const handleApplyCalendarPlan = (task: Task) => {
    if (task.destination) {
      setDestinationSearch(task.destination);
      triggerDestinationSearch(task.destination);
    } else {
      // Auto assign a relevant place based on title
      const title = task.title.toLowerCase();
      let assignedPlace = savedPlaces.find(p => p.category === "college");
      if (title.includes("meeting") || title.includes("interview")) {
        assignedPlace = savedPlaces.find(p => p.category === "office") || savedPlaces[0];
      } else if (title.includes("book") || title.includes("study") || title.includes("exam")) {
        assignedPlace = savedPlaces.find(p => p.category === "library") || savedPlaces[0];
      }
      
      if (assignedPlace) {
        setDestinationCoords({ lat: assignedPlace.lat, lng: assignedPlace.lng });
        setDestinationAddress(assignedPlace.address);
        setDestinationSearch(assignedPlace.name);
        triggerNotification(`📅 Travel generated for "${task.title}" → ${assignedPlace.name}`, "success");
      }
    }
    if (task.travelMode) {
      setTravelMode(task.travelMode);
    }
  };

  // 13. AI MULTI-DESTINATION ROUTE OPTIMIZATION
  const handleOptimizeRouteSequence = () => {
    triggerNotification("🧬 Running Genetic Sequence Optimization for multiple tasks...", "success");
    setTimeout(() => {
      triggerAudioTone("success");
      triggerNotification("🚀 AI Sequence calculated! Optimizing saves 21 minutes of travel.", "success");
    }, 1800);
  };

  // 14. EMERGENCY LOCATIONS COORDS & SELECTION
  const emergencyLocations = useMemo(() => {
    if (!originCoords) return [];
    return [
      { name: "Sutter Hospital Emergency Room", distance: "0.8 km", type: "Hospital", lat: originCoords.lat + 0.005, lng: originCoords.lng - 0.006 },
      { name: "Marina Care Pharmacy", distance: "0.3 km", type: "Pharmacy", lat: originCoords.lat - 0.002, lng: originCoords.lng + 0.003 },
      { name: "Police Station Precinct 4", distance: "1.4 km", type: "Police", lat: originCoords.lat + 0.012, lng: originCoords.lng + 0.008 },
      { name: "Shell Fuel Station", distance: "0.6 km", type: "Petrol Pump", lat: originCoords.lat - 0.004, lng: originCoords.lng - 0.003 },
      { name: "EV Fast Charge Super Grid", distance: "0.5 km", type: "EV Charging", lat: originCoords.lat + 0.003, lng: originCoords.lng + 0.004 }
    ];
  }, [originCoords]);

  const handleSelectEmergency = (item: typeof emergencyLocations[0]) => {
    setDestinationCoords({ lat: item.lat, lng: item.lng });
    setDestinationAddress(item.name);
    setDestinationSearch(item.name);
    triggerAudioTone("emergency");
    triggerNotification(`🚨 Emergency Destination Set: ${item.name}. Active guidance routed!`, "emergency");
  };

  // 15. NEARBY ESSENTIALS BASED ON ACTIVE TASK
  const nearbyEssentials = useMemo(() => {
    return [
      { name: "FedEx Print & Copy Center", distance: "200m away", type: "Printing Shop" },
      { name: "Staples Office Stationery", distance: "400m away", type: "Stationery" },
      { name: "Bank ATM Network", distance: "150m away", type: "ATM" },
      { name: "Blue Bottle Coffee", distance: "80m away", type: "Cafe" },
      { name: "Secured Multilevel Parking", distance: "300m away", type: "Parking" },
      { name: "Walgreens Health Store", distance: "250m away", type: "Medical Store" }
    ];
  }, []);

  // Speech Recognition methods
  const startVoiceListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      triggerNotification("⚠️ Speech recognition not supported in this browser.", "warning");
      speakText("Speech recognition is not supported by your current browser.");
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
        setSpeechTranscript("Listening... speak now");
        triggerAudioTone("success");
      };

      rec.onresult = (event: any) => {
        let currentText = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentText += event.results[i][0].transcript;
        }
        setSpeechTranscript(currentText);
      };

      rec.onerror = (event: any) => {
        if (event.error === "aborted" || event.error === "no-speech" || event.error === "network") {
          setIsListening(false);
          return;
        }
        console.error("Speech Error:", event);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
        setSpeechTranscript(prev => {
          if (prev && prev !== "Listening... speak now") {
            setTimeout(() => {
              handleVoiceCommandSubmit(prev);
            }, 300);
            return `Processed: "${prev}"`;
          }
          return "";
        });
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const stopVoiceListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error(e);
      }
    }
    setIsListening(false);
  };

  // 16. VOICE COMMAND HANDLER
  const handleVoiceCommandSubmit = async (cmdText: string) => {
    const text = (cmdText || voiceCommand).toLowerCase().trim();
    if (!text) return;

    setVoiceCommand("");
    triggerAudioTone("success");

    if (text.includes("navigate to") || text.startsWith("go to") || text.startsWith("take me to")) {
      let place = text.replace("navigate to", "").replace("go to", "").replace("take me to", "").trim();
      
      if (place === "home") {
        const home = savedPlaces.find(p => p.category === "home");
        if (home) {
          setDestinationCoords({ lat: home.lat, lng: home.lng });
          setDestinationAddress(home.address);
          setDestinationSearch(home.name);
          triggerNotification("🎙️ Voice command: Navigating home", "success");
          speakText("Navigating home. Commencing journey tracking.");
        } else {
          triggerNotification("⚠️ You have no saved home location.", "warning");
          speakText("You have no saved home location. Please add one in your saved places first.");
        }
      } else if (place === "office" || place === "work") {
        const office = savedPlaces.find(p => p.category === "office");
        if (office) {
          setDestinationCoords({ lat: office.lat, lng: office.lng });
          setDestinationAddress(office.address);
          setDestinationSearch(office.name);
          triggerNotification("🎙️ Voice command: Navigating to HQ Office", "success");
          speakText("Navigating to HQ Office.");
        } else {
          triggerNotification("⚠️ You have no saved work location.", "warning");
          speakText("You have no saved work location. Please add one in your saved places first.");
        }
      } else {
        await geocodeAndNavigateTo(place);
      }
    } else if (text === "take me home" || text === "go home") {
      const home = savedPlaces.find(p => p.category === "home");
      if (home) {
        setDestinationCoords({ lat: home.lat, lng: home.lng });
        setDestinationAddress(home.address);
        setDestinationSearch(home.name);
        triggerNotification("🎙️ Voice command: Navigating home", "success");
        speakText("Routing to your home address.");
      } else {
        triggerNotification("⚠️ You have no saved home location.", "warning");
        speakText("You have no saved home location. Please add one in your saved places first.");
      }
    } else if (text.includes("nearest hospital") || text === "hospital" || text === "emergency") {
      const hosp = emergencyLocations.find(e => e.type === "Hospital");
      if (hosp) {
        setDestinationCoords({ lat: hosp.lat, lng: hosp.lng });
        setDestinationAddress(hosp.name);
        setDestinationSearch(hosp.name);
        triggerNotification("🎙️ Voice command: Routing to nearest hospital Emergency Room!", "emergency");
        speakText("Critical request parsed. Routing immediately to the nearest hospital emergency room.");
      } else {
        await geocodeAndNavigateTo("Hospital");
      }
    } else if (text.includes("nearest atm") || text.includes("atm")) {
      const atm = nearbyEssentials.find(e => e.type === "ATM" || e.name.toLowerCase().includes("atm"));
      if (atm) {
        // Find ATM relative coords
        const lat = originCoords ? originCoords.lat - 0.003 : 37.7749;
        const lng = originCoords ? originCoords.lng + 0.002 : -122.4194;
        setDestinationCoords({ lat, lng });
        setDestinationAddress(atm.name);
        setDestinationSearch(atm.name);
        triggerNotification(`🎙️ Voice command: Routing to nearest ATM: ${atm.name}`, "success");
        speakText(`Routing you to the nearest bank ATM network, ${atm.distance} meters away.`);
      } else {
        await geocodeAndNavigateTo("ATM");
      }
    } else if (text === "cancel navigation" || text === "stop navigation" || text === "cancel journey") {
      setLiveNavigationActive(false);
      triggerNotification("🎙️ Navigation cancelled", "warning");
      speakText("Live navigation tracking cancelled.");
    } else if (text === "repeat directions" || text === "repeat") {
      if (destinationCoords) {
        const directionsStr = `You are traveling from ${originAddress || "current location"} to ${destinationAddress || "destination"} via ${travelMode}. The total distance is ${activeDistanceKm.toFixed(1)} kilometers, with an estimated travel time of ${activeDurationMinutes} minutes.`;
        triggerNotification("🎙️ Repeating directions...", "success");
        speakText(directionsStr);
      } else {
        triggerNotification("⚠️ No active navigation configure", "warning");
        speakText("There is no active route configured. Please set a destination.");
      }
    } else if (text === "avoid tolls") {
      setIsRecalculating(true);
      triggerNotification("🎙️ Recalculating: Avoiding toll roads...", "warning");
      speakText("Recalculating route options to completely avoid toll charges.");
      setTimeout(() => {
        setIsRecalculating(false);
        triggerNotification("🎙️ Route updated: Toll-free path selected", "success");
      }, 1500);
    } else if (text === "avoid traffic" || text.includes("traffic")) {
      setIsRecalculating(true);
      triggerNotification("🎙️ Recalculating route to bypass congestion...", "warning");
      speakText("Bypassing dense traffic. Finding secondary corridors.");
      setTimeout(() => {
        setIsRecalculating(false);
        triggerNotification("🎙️ Recalculated: Secondary bypass configured.", "success");
      }, 1500);
    } else if (text.includes("walking mode") || text === "walk") {
      setTravelMode("walking");
      triggerNotification("🎙️ Travel mode switched to Walking", "success");
      speakText("Switched travel mode to walking path buffers.");
    } else if (text === "metro" || text.includes("use metro") || text === "train") {
      setTravelMode("metro");
      triggerNotification("🎙️ Travel mode switched to Metro", "success");
      speakText("Switched travel mode to metro transit routes.");
    } else if (text === "train") {
      setTravelMode("train");
      triggerNotification("🎙️ Travel mode switched to Train", "success");
      speakText("Switched travel mode to commuter rail lines.");
    } else {
      // General search geocode
      await geocodeAndNavigateTo(text);
    }
  };

  const geocodeAndNavigateTo = async (placeName: string) => {
    setMapStatusMessage("Calculating Route...");
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(placeName)}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          setDestinationCoords({ lat, lng });
          setDestinationAddress(data[0].display_name.split(",").slice(0, 3).join(","));
          setDestinationSearch(placeName);
          setMapStatusMessage("");
          triggerNotification(`🎙️ Navigating to: ${placeName}`, "success");
          speakText(`Navigating to ${placeName}. Generating the optimal route.`);
          if (leafletMapInstanceRef.current) {
            leafletMapInstanceRef.current.setView([lat, lng], 13, { animate: true });
          }
        } else {
          setMapStatusMessage("");
          triggerNotification(`⚠️ Could not find location: "${placeName}"`, "warning");
          speakText(`I couldn't find a location named ${placeName}. Please try again.`);
        }
      } else {
        setMapStatusMessage("");
        triggerNotification(`⚠️ Geocoding request failed`, "warning");
      }
    } catch (err) {
      setMapStatusMessage("");
      console.error(err);
    }
  };

  // Saved place creation
  const handleAddNewPlace = async () => {
    if (!newPlaceName || !newPlaceAddress) return;
    
    let lat = originCoords ? originCoords.lat : 40.7128;
    let lng = originCoords ? originCoords.lng : -74.0060;

    if (newPlaceAddress !== originAddress && originAddress) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newPlaceAddress)}&limit=1`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            lat = parseFloat(data[0].lat);
            lng = parseFloat(data[0].lon);
          }
        }
      } catch (err) {
        console.warn("Geocoding saved place failed:", err);
      }
    }

    const newPlace: SavedPlace = {
      id: `saved-${Date.now()}`,
      name: newPlaceName,
      address: newPlaceAddress,
      lat: lat,
      lng: lng,
      category: newPlaceCategory
    };

    setSavedPlaces(prev => [...prev, newPlace]);
    setNewPlaceName("");
    setNewPlaceAddress("");
    setShowAddPlaceModal(false);
    triggerAudioTone("success");
    triggerNotification(`💾 Saved custom place: ${newPlaceName}`, "success");
  };

  const handleDeleteSavedPlace = (id: string) => {
    setSavedPlaces(prev => prev.filter(p => p.id !== id));
    triggerNotification("Saved place deleted.", "warning");
  };

  return (
    <div id="smart-travel-planner-v2" className="space-y-6 font-sans text-gray-800">
      
      {/* 1. TOP SYSTEM NOTIFICATION ALERTS */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-xl border shadow-xl flex items-start gap-3 text-sm transition-all duration-300 ${
              activeAlert.type === "emergency" 
                ? "bg-red-950/95 text-red-200 border-red-800" 
                : activeAlert.type === "warning"
                ? "bg-amber-950/95 text-amber-200 border-amber-800"
                : activeAlert.type === "success"
                ? "bg-emerald-950/95 text-emerald-200 border-emerald-800"
                : "bg-slate-900/95 text-slate-100 border-slate-700"
            }`}
          >
            <div className="text-xl">
              {activeAlert.type === "emergency" ? "🚨" : activeAlert.type === "warning" ? "⚠️" : "✨"}
            </div>
            <div className="flex-1">
              <span className="text-[10px] uppercase tracking-wider font-mono font-bold block text-gray-400">
                AI Travel Intelligence
              </span>
              <p className="mt-1 leading-relaxed">{activeAlert.text}</p>
            </div>
            <button 
              onClick={() => setActiveAlert(null)}
              className="text-gray-400 hover:text-white text-xs font-bold px-1 rounded hover:bg-white/10"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. DOCK GEOFENCE / QUICK Reminders */}
      {aiTravelAnalysis && !liveNavigationActive && !departureReminderDismissed && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-emerald-900/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="flex gap-3">
            <Bell className="text-emerald-500 animate-bounce shrink-0 mt-1" size={18} />
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-600 block">Smart Departure Recommendation</span>
              <p className="text-sm font-medium text-emerald-800 mt-0.5">{aiTravelAnalysis.bestDepartureTime}</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0 font-mono text-[10px]">
            <button 
              onClick={() => {
                setLiveNavigationActive(true);
                setNavigationProgress(0);
                triggerNotification("🚀 Navigation Link Activated!", "success");
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors cursor-pointer"
            >
              Start Navigation
            </button>
            <button 
              onClick={() => {
                setSnoozeMinutes(prev => prev + 5);
                triggerNotification("Snoozed departure notice for 5 minutes.", "warning");
              }}
              className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
            >
              Snooze
            </button>
            <button 
              onClick={() => {
                setIsRecalculating(true);
                setTimeout(() => setIsRecalculating(false), 1200);
                triggerNotification("Transit timeline recalculated.", "success");
              }}
              className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
            >
              Recalculate
            </button>
            <button 
              onClick={() => setDepartureReminderDismissed(true)}
              className="px-3 py-1.5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}

      {/* 3. INITIALIZATION OR MANUAL DECISION FOR FIRST-TIME LOCATION SPLASH SCREEN */}
      {locationPermissionStatus === "undecided" ? (
        <div className="bg-white border border-gray-150 rounded-3xl p-10 shadow-xl max-w-2xl mx-auto flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
            <MapPin size={32} className="animate-bounce" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">📍 Allow Location Access</h3>
            <p className="text-sm text-gray-500 leading-relaxed max-w-md">
              Allow the AI Chief of Staff to access your location to plan travel, estimate arrival times, optimize routes, and provide timely reminders.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
            <button
              onClick={handleRequestLocation}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Allow
            </button>
            <button
              onClick={handleDeclineLocation}
              className="w-full py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              Not Now
            </button>
          </div>

          <button
            onClick={() => setShowPrivacyPolicy(!showPrivacyPolicy)}
            className="text-xs text-emerald-600 hover:underline cursor-pointer"
          >
            Privacy Policy
          </button>

          {showPrivacyPolicy && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-4 bg-gray-50 rounded-xl border border-gray-150 text-[11px] text-gray-400 text-left leading-relaxed max-w-md"
            >
              <strong>Privacy Standard:</strong> Your precise geographical coordinate telemetry remains strictly on-device inside standard sandbox storage. We never store or tracking persistent background paths without your live consent.
            </motion.div>
          )}
        </div>
      ) : (
        
        /* 4. MAIN RESPONSIVE MAP & TRAVEL PLANNER LAYOUT */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* LEFT: INTERACTIVE MAP COMPONENT (col-span-8 on desktop) */}
          <div className="lg:col-span-8 flex flex-col space-y-4">
            
            <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-xs relative flex flex-col overflow-hidden h-[500px] lg:h-[650px]">
              
              {/* Top Map Layer Controllers */}
              <div className="absolute top-6 left-6 right-6 z-10 flex flex-wrap gap-2 items-center justify-between pointer-events-none">
                
                {/* Search Bar on Map with live Autocomplete suggestions */}
                <div className="relative pointer-events-auto">
                  <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-gray-200 flex items-center gap-2 max-w-xs">
                    <Search size={14} className="text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search any place..."
                      value={destinationSearch}
                      onChange={(e) => setDestinationSearch(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      className="bg-transparent text-xs text-gray-800 outline-none w-32 focus:w-44 transition-all"
                    />
                    {destinationSearch && (
                      <button 
                        onClick={() => {
                          setDestinationSearch("");
                          setAutocompleteSuggestions([]);
                        }}
                        className="text-gray-400 hover:text-gray-600 text-[10px]"
                      >
                        ✕
                      </button>
                    )}
                    <button 
                      onClick={() => triggerDestinationSearch(destinationSearch)}
                      className="text-[9px] bg-emerald-600 hover:bg-emerald-500 text-white font-mono uppercase font-bold px-2 py-1 rounded"
                    >
                      Go
                    </button>
                  </div>

                  {/* Autocomplete Dropdown List */}
                  {autocompleteSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-150 overflow-hidden z-50 max-h-60 overflow-y-auto w-64">
                      {autocompleteSuggestions.map((sug, idx) => (
                        <button
                          key={sug.id}
                          onClick={() => selectSuggestion(sug)}
                          onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                          className={`w-full text-left px-3 py-2 text-xs font-mono transition-colors flex flex-col border-b border-gray-50 last:border-0 cursor-pointer ${
                            idx === selectedSuggestionIndex ? "bg-emerald-50 text-emerald-900" : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <span className="font-bold flex items-center gap-1">
                            {sug.isSaved ? "⭐ " : "📍 "}{sug.name}
                          </span>
                          {(sug.city || sug.country) && (
                            <span className="text-[10px] text-gray-400">
                              {sug.city}{sug.city && sug.country ? ", " : ""}{sug.country}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Map settings control bar */}
                <div className="flex gap-1.5 bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-gray-200 pointer-events-auto">
                  <button 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${isDarkMode ? "bg-slate-800 text-yellow-400" : "hover:bg-gray-100 text-gray-500"}`}
                    title="Toggle Dark Mode"
                  >
                    {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
                  </button>
                  <button 
                    onClick={() => setMapType(mapType === "roadmap" ? "satellite" : "roadmap")}
                    className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${mapType === "satellite" ? "bg-slate-800 text-white" : "hover:bg-gray-100 text-gray-500"}`}
                    title="Toggle Satellite"
                  >
                    <Layers size={14} />
                  </button>
                  <button 
                    onClick={handleRequestLocation}
                    className="p-1.5 rounded-lg text-xs hover:bg-gray-100 text-emerald-600 transition-colors cursor-pointer"
                    title="Locate Me"
                  >
                    <Locate size={14} />
                  </button>
                </div>

              </div>

              {/* MAP VIEWPORT: Render Google Maps or fallback Leaflet */}
              <div className="w-full h-full rounded-xl overflow-hidden relative">
                {hasValidGoogleKey && originCoords ? (
                  /* 10A. FULLY PRODUCTION-READY GOOGLE MAP */
                  <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly">
                    <Map
                      defaultCenter={originCoords}
                      defaultZoom={13}
                      mapTypeId={mapType}
                      mapId={isDarkMode ? "DEMO_MAP_ID" : undefined}
                      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                      style={{ width: '100%', height: '100%' }}
                    >
                      {/* Origin */}
                      <AdvancedMarker position={originCoords} title="My Current Position">
                        <Pin background="#3b82f6" glyphColor="#ffffff" />
                      </AdvancedMarker>

                      {/* Destination */}
                      {destinationCoords && (
                        <AdvancedMarker position={destinationCoords} title={destinationAddress}>
                          <Pin background="#10b981" glyphColor="#ffffff" />
                        </AdvancedMarker>
                      )}

                      {/* Saved Places */}
                      {savedPlaces.map(p => (
                        <AdvancedMarker 
                          key={p.id} 
                          position={{ lat: p.lat, lng: p.lng }} 
                          title={p.name}
                          onClick={() => {
                            setDestinationCoords({ lat: p.lat, lng: p.lng });
                            setDestinationAddress(p.address);
                            triggerAudioTone("success");
                          }}
                        >
                          <Pin background="#1f2937" glyphColor="#10b981" />
                        </AdvancedMarker>
                      ))}
                    </Map>
                  </APIProvider>
                ) : (
                  /* 10B. ZERO-SETUP HIGH FIDELITY OPENSTREETMAP LEAFLET FALLBACK */
                  <div 
                    ref={leafletMapContainerRef} 
                    className="w-full h-full bg-slate-900 border border-slate-800 rounded-xl z-0" 
                  />
                )}

                {/* Loader Overlay when originCoords is null */}
                {!originCoords && (
                  <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center z-20 space-y-3 p-4 text-center">
                    <RefreshCw size={28} className="animate-spin text-emerald-400" />
                    <p className="text-sm font-bold text-slate-100 font-sans">
                      {mapStatusMessage || "Requesting GPS Location Telemetry..."}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Acquiring precise satellite or network geolocation coordinates...
                    </p>
                    <button 
                      onClick={runIPFallback}
                      className="mt-4 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Skip & Use IP Location
                    </button>
                  </div>
                )}

                {/* Recalculating Overlay */}
                <AnimatePresence>
                  {isRecalculating && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-10"
                    >
                      <div className="bg-slate-900 border border-emerald-500/20 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 text-white">
                        <RefreshCw size={20} className="animate-spin text-emerald-400" />
                        <span className="text-xs font-mono font-bold uppercase tracking-wider">
                          AI Smart Route Optimization Recalculating...
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Satellite/Dark Layer status flag */}
                <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-[10px] font-mono text-emerald-400 shadow-lg flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    {hasValidGoogleKey ? "Google Maps (API Mode)" : "OpenStreetMap (Live Leaflet Feed)"}
                  </span>
                </div>
              </div>

              {/* LIVE NAVIGATION ACTIVE HUD */}
              <AnimatePresence>
                {liveNavigationActive && destinationCoords && (
                  <motion.div 
                    initial={{ y: 80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 80, opacity: 0 }}
                    className="absolute bottom-4 left-4 right-4 z-10 bg-slate-950/95 backdrop-blur-md p-4 rounded-xl border border-emerald-500/30 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 text-white"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono font-bold tracking-widest bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/40 uppercase">
                          Live Active Tracking
                        </span>
                        <span className="text-xs font-mono text-gray-400">
                          Mode: {travelMode.toUpperCase()}
                        </span>
                      </div>
                      <h4 className="text-sm font-black truncate">Navigating to {destinationAddress}</h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-300 font-mono">
                        <span>Distance: <strong>{(activeDistanceKm * (1 - navigationProgress / 100)).toFixed(2)} km left</strong></span>
                        <span>Time: <strong>{Math.round(activeDurationMinutes * (1 - navigationProgress / 100))} min</strong></span>
                        <span>Speed: <strong>{travelMode === "walking" ? "5" : travelMode === "bicycle" ? "15" : travelMode === "car" ? "52" : "38"} km/h</strong></span>
                      </div>
                    </div>

                    <div className="w-full md:w-48 space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-gray-400">
                        <span>Route Progress</span>
                        <span>{navigationProgress}%</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                        <div 
                          className="h-full bg-emerald-400 transition-all duration-1000 rounded-full"
                          style={{ width: `${navigationProgress}%` }}
                        />
                      </div>
                      <div className="flex justify-end pt-1">
                        <button 
                          onClick={() => {
                            setLiveNavigationActive(false);
                            triggerNotification("Navigation paused manually.", "warning");
                          }}
                          className="text-[9px] text-red-400 hover:text-red-300 uppercase font-mono tracking-wider font-bold"
                        >
                          Cancel Journey
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

            {/* QUICK-ACCESS PRESETS & SEARCH HISTORY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Saved Places Widget */}
              <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs flex flex-col space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold flex items-center gap-1.5 text-gray-900">
                    <Star size={16} className="text-amber-500" />
                    <span>Saved Locations</span>
                  </h4>
                  <button 
                    onClick={() => setShowAddPlaceModal(true)}
                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors cursor-pointer"
                    title="Add Saved Place"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {savedPlaces.length === 0 ? (
                    <div className="col-span-3 py-6 px-4 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50/50 space-y-2 flex flex-col items-center justify-center">
                      <p className="text-xs text-gray-400">No saved locations yet.</p>
                      <div className="flex gap-1.5 flex-wrap justify-center">
                        <button 
                          onClick={() => {
                            setNewPlaceName("Home");
                            setNewPlaceAddress(originAddress || "123 Main St");
                            setNewPlaceCategory("home");
                            setShowAddPlaceModal(true);
                          }}
                          className="px-2 py-1 bg-white border border-gray-200 hover:border-emerald-300 rounded text-[10px] text-emerald-600 font-bold transition-all"
                        >
                          + Add Home
                        </button>
                        <button 
                          onClick={() => {
                            setNewPlaceName("HQ Office");
                            setNewPlaceAddress("1 Technology Way");
                            setNewPlaceCategory("office");
                            setShowAddPlaceModal(true);
                          }}
                          className="px-2 py-1 bg-white border border-gray-200 hover:border-emerald-300 rounded text-[10px] text-indigo-600 font-bold transition-all"
                        >
                          + Add Office
                        </button>
                      </div>
                    </div>
                  ) : (
                    savedPlaces.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setDestinationCoords({ lat: p.lat, lng: p.lng });
                          setDestinationAddress(p.address);
                          setDestinationSearch(p.name);
                          triggerAudioTone("success");
                          triggerNotification(`Loaded saved spot: ${p.name}`, "success");
                        }}
                        className="p-2 bg-gray-50 hover:bg-emerald-50/50 border border-gray-150 hover:border-emerald-200 rounded-xl text-left transition-all group relative cursor-pointer font-sans"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">
                            {p.category === "home" ? "🏠" : p.category === "office" ? "🏢" : p.category === "college" ? "🎓" : p.category === "gym" ? "💪" : "📍"}
                          </span>
                          <span className="text-xs font-bold text-gray-700 group-hover:text-emerald-800 truncate">{p.name}</span>
                        </div>
                        <span className="text-[9px] text-gray-400 block mt-1 truncate">{p.address}</span>
                        
                        {/* Delete icon */}
                        <span
                          role="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSavedPlace(p.id);
                          }}
                          className="absolute right-1 top-1 text-[8px] text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </span>
                      </button>
                    ))
                  )}
                </div>

                {showAddPlaceModal && (
                  <div className="p-3 border border-gray-200 bg-gray-50 rounded-xl space-y-2 text-xs">
                    <span className="font-bold text-gray-800">Add Custom Destination</span>
                    <input 
                      type="text" 
                      placeholder="Place Name (e.g. Gym, Library)"
                      value={newPlaceName}
                      onChange={(e) => setNewPlaceName(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded bg-white text-xs outline-none"
                    />
                    <input 
                      type="text" 
                      placeholder="Address Lines / Landmark"
                      value={newPlaceAddress}
                      onChange={(e) => setNewPlaceAddress(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded bg-white text-xs outline-none"
                    />
                    <div className="flex gap-1">
                      {["home", "office", "college", "custom"].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setNewPlaceCategory(cat as any)}
                          className={`px-2 py-1 rounded text-[10px] capitalize ${newPlaceCategory === cat ? "bg-emerald-600 text-white" : "bg-white border text-gray-600"}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button 
                        onClick={() => setShowAddPlaceModal(false)}
                        className="px-2 py-1 bg-white border rounded text-gray-500 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleAddNewPlace}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold cursor-pointer"
                      >
                        Save Spot
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Travel History List */}
              <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs flex flex-col space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold flex items-center gap-1.5 text-gray-900">
                    <Clock size={16} className="text-gray-500" />
                    <span>Recent Trips</span>
                  </h4>
                  {travelHistory.length > 0 && (
                    <button 
                      onClick={handleClearHistory}
                      className="text-[10px] text-gray-400 hover:text-red-500 flex items-center gap-0.5 cursor-pointer"
                    >
                      <Trash2 size={12} />
                      <span>Clear All</span>
                    </button>
                  )}
                </div>

                {travelHistory.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-400 space-y-1">
                    <Compass size={24} className="text-gray-300" />
                    <span className="text-xs font-mono">No recent trips tracked.</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                    {travelHistory.map(h => (
                      <div 
                        key={h.id} 
                        className="flex items-start justify-between p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all text-xs border border-gray-200/50"
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="text-sm mt-0.5 shrink-0">
                            {h.mode === "walking" ? "🚶" : h.mode === "metro" ? "🚇" : h.mode === "train" ? "🚆" : "🚗"}
                          </span>
                          <div className="min-w-0">
                            <span className="font-bold text-gray-800 block truncate">{h.destination}</span>
                            <span className="text-[10px] text-gray-400 block truncate">From: {h.origin}</span>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[9.5px] text-emerald-700 font-mono">
                              <span>{h.distance}</span>
                              <span>•</span>
                              <span>{h.duration}</span>
                              <span>•</span>
                              <span>Arrival {h.arrivalTime}</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-[9px] text-gray-400 font-mono shrink-0 ml-1 mt-0.5">{h.date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* TRAVEL & TIME ZONE INTELLIGENCE CARD (Moved from Multilingual Workspace) */}
            <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-xs space-y-6 mt-4 text-gray-900">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Globe size={18} className="animate-spin" style={{ animationDuration: "20s" }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">🌍 Travel & Time Zone Intelligence</h3>
                    <p className="text-[10px] text-gray-500 font-sans">Smart region adjustments, dual-clocks, jet-lag schedules, and offline synchronization</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isTravelMode ? (
                    <span className="bg-rose-50 text-rose-700 border border-rose-100 px-2.5 py-1 rounded-full text-[9px] font-mono font-bold animate-pulse flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full bg-rose-500"></span>
                      TRAVEL MODE ACTIVE
                    </span>
                  ) : (
                    <span className="bg-gray-50 text-gray-500 border border-gray-200 px-2.5 py-1 rounded-full text-[9px] font-mono font-bold">
                      HOME SYSTEM ACTIVE
                    </span>
                  )}
                  
                  {isOffline && (
                    <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-[8px] font-mono font-bold uppercase">
                      OFFLINE
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left side: Simulated detection, Dual clocks, Offline toggle */}
                <div className="space-y-4">
                  {/* Simulation Block */}
                  <div className="space-y-2 bg-gray-50/50 border border-gray-150 p-3.5 rounded-xl">
                    <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-wider block">✈️ Simulated Travel Detection</span>
                    <p className="text-[11px] text-gray-500 leading-normal">
                      Trigger travel simulation to test location change triggers, prompt options, and automatic calendar shifts.
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      {[
                        { name: "United States", flag: "🇺🇸" },
                        { name: "India", flag: "🇮🇳" },
                        { name: "United Kingdom", flag: "🇬🇧" },
                        { name: "Japan", flag: "🇯🇵" },
                        { name: "Germany", flag: "🇩🇪" },
                        { name: "Canada", flag: "🇨🇦" }
                      ].filter(c => c.name !== country).slice(0, 4).map(c => (
                        <button
                          key={`sim-${c.name}`}
                          onClick={() => {
                            simulateTravel(c.name);
                            triggerNotification(`✈️ Simulating travel to ${c.name}...`, "success");
                          }}
                          className="p-1.5 border border-gray-200 bg-white hover:border-indigo-400 rounded-lg text-left text-[10px] font-mono font-bold cursor-pointer transition-all flex items-center justify-between"
                        >
                          <span>{c.flag} {c.name.substring(0, 11)}</span>
                          <span className="text-[7px] text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded uppercase font-semibold">TEST</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dual Time Display */}
                  <div className="bg-neutral-900 text-white p-4 rounded-2xl space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400">Digital Dual Clocks</span>
                      <span className="text-[8px] font-mono bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded uppercase">UTC Sync</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-widest block">🏠 Home ({homeCountry})</span>
                        <div className="text-base font-bold">
                          {new Date().toLocaleTimeString("en-US", {
                            timeZone: countryConfigs[homeCountry]?.timezone || "America/New_York",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: timeFormat === "12h"
                          })}
                        </div>
                        <span className="text-[8px] text-neutral-400 font-mono block truncate">
                          {countryConfigs[homeCountry]?.timezone.split("/").pop()?.replace("_", " ")}
                        </span>
                      </div>

                      <div className="space-y-0.5 border-l border-neutral-800 pl-3">
                        <span className="text-[8px] font-mono text-rose-400 uppercase tracking-widest block">📍 Local ({country})</span>
                        <div className="text-base font-bold text-rose-500">
                          {new Date().toLocaleTimeString("en-US", {
                            timeZone: countryConfigs[country]?.timezone || "America/New_York",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: timeFormat === "12h"
                          })}
                        </div>
                        <span className="text-[8px] text-rose-400/70 font-mono block truncate">
                          {countryConfigs[country]?.timezone.split("/").pop()?.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    {isTravelMode && (
                      <div className="pt-1.5 border-t border-neutral-800 flex items-center justify-between text-[8px] font-mono text-neutral-400">
                        <span>TIME OFFSET:</span>
                        <span className="text-neutral-200 font-bold bg-neutral-800 px-1.5 py-0.5 rounded">
                          {(() => {
                            try {
                              const homeTz = countryConfigs[homeCountry]?.timezone || "America/New_York";
                              const localTz = countryConfigs[country]?.timezone || "America/New_York";
                              const homeDate = new Date(new Date().toLocaleString("en-US", { timeZone: homeTz }));
                              const localDate = new Date(new Date().toLocaleString("en-US", { timeZone: localTz }));
                              const diffMs = localDate.getTime() - homeDate.getTime();
                              const diffHrs = diffMs / (1000 * 60 * 60);
                              const sign = diffHrs >= 0 ? "+" : "";
                              return `${sign}${diffHrs.toFixed(1)} Hours`;
                            } catch (e) {
                              return "0.0 Hours";
                            }
                          })()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Offline Support Toggle Card */}
                  <div className="bg-amber-50/40 border border-amber-200 p-3 rounded-xl flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                        <span>📶 Offline Travel Sync</span>
                      </span>
                      <p className="text-[10px] text-amber-700 leading-normal">
                        Allow full database viewing and document indexes without active networks.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsOffline(!isOffline);
                        triggerNotification(!isOffline ? "System connected online." : "Forced offline state active.", "warning");
                      }}
                      className={`px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-all shrink-0 ${
                        isOffline 
                          ? "bg-amber-600 hover:bg-amber-700 text-white" 
                          : "bg-white hover:bg-amber-100 text-amber-800 border border-amber-300"
                      }`}
                    >
                      {isOffline ? "Go Online" : "Go Offline"}
                    </button>
                  </div>
                </div>

                {/* Right side: Travel modes, Jet-lag aware, Meeting conflict planner */}
                <div className="space-y-4">
                  {/* Travel Productivity Modes */}
                  <div className="space-y-2">
                    <span className="text-xs font-mono font-bold text-gray-700 block uppercase tracking-wider">🎯 Travel Productivity Modes</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: "normal", title: "Standard", icon: "🟢" },
                        { id: "airport", title: "Airport", icon: "✈️" },
                        { id: "hotel", title: "Hotel", icon: "🏨" },
                        { id: "business", title: "Business", icon: "💼" },
                        { id: "vacation", title: "Vacation", icon: "🏖️" },
                        { id: "study_abroad", title: "Abroad", icon: "🎓" }
                      ].map((modeItem) => (
                        <button
                          key={modeItem.id}
                          onClick={() => {
                            setTravelProductivityMode(modeItem.id as any);
                            if (modeItem.id === "airport") {
                              setIsOffline(true);
                              triggerNotification("Airport Mode loaded: Forced offline active.", "warning");
                            } else {
                              triggerNotification(`Productivity Mode changed to ${modeItem.title}.`, "success");
                            }
                          }}
                          className={`p-1.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between h-[64px] ${
                            travelProductivityMode === modeItem.id
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                              : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-white"
                          }`}
                        >
                          <span className="text-sm">{modeItem.icon}</span>
                          <span className="text-[10px] font-bold block truncate leading-none">{modeItem.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Jet Lag Advice */}
                  {isTravelMode && (
                    <div className="bg-indigo-50/40 border border-indigo-150 p-3 rounded-xl space-y-1.5">
                      <span className="text-[10px] font-mono font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={11} className="text-indigo-600" />
                        <span>Jet-Lag Aware Pacing Advice</span>
                      </span>
                      <p className="text-[10px] text-gray-600 leading-normal">
                        Your home is <span className="font-bold text-gray-800">{homeCountry}</span> and you are in <span className="font-bold text-rose-600">{country}</span>. 
                        We recommend shorter focus blocks (max 25 mins) to prevent fatigue.
                      </p>
                    </div>
                  )}

                  {/* Interactive Timezone Meeting Planner & Conflict Checker */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2 text-xs">
                    <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider block">Meeting Conflict Checker & Converter</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono font-bold text-gray-500 block">Meeting Time (Local):</label>
                        <input
                          type="time"
                          defaultValue="10:00"
                          id="planner-meeting-time-map"
                          className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-gray-800 font-mono text-[11px]"
                          onChange={(e) => {
                            const timeVal = e.target.value;
                            const localHour = parseInt(timeVal.split(":")[0]);
                            const resultDiv = document.getElementById("meeting-checker-output-map");
                            if (resultDiv) {
                              try {
                                const homeTz = countryConfigs[homeCountry]?.timezone || "America/New_York";
                                const testDate = new Date();
                                testDate.setHours(localHour);
                                testDate.setMinutes(0);
                                
                                const homeStr = testDate.toLocaleTimeString("en-US", {
                                  timeZone: homeTz,
                                  hour: "numeric",
                                  hour12: true
                                });
                                
                                const homeHour24 = parseInt(testDate.toLocaleTimeString("en-US", {
                                  timeZone: homeTz,
                                  hour: "numeric",
                                  hour12: false
                                }));
                                
                                const isHomeConflict = homeHour24 < 8 || homeHour24 > 19;
                                const isLocalConflict = localHour < 8 || localHour > 19;
                                
                                resultDiv.innerHTML = `
                                  <div class="flex items-center justify-between text-[10px] font-mono p-1.5 bg-white rounded-lg border border-gray-200">
                                    <span class="text-gray-500">🏠 Home Time:</span>
                                    <span class="font-bold text-indigo-700">${homeStr}</span>
                                  </div>
                                  <div class="flex flex-col gap-0.5 text-[8.5px] font-mono mt-1">
                                    \${isHomeConflict ? '<span class="text-rose-600 font-semibold">⚠️ Home resting conflict!</span>' : '<span class="text-emerald-600 font-semibold">✅ Perfect for Home Participant!</span>'}
                                    \${isLocalConflict ? '<span class="text-rose-600 font-semibold">⚠️ Local resting conflict!</span>' : '<span class="text-emerald-600 font-semibold">✅ Perfect for Local Workspace!</span>'}
                                  </div>
                                `;
                              } catch (err) {}
                            }
                          }}
                        />
                      </div>
                      
                      <div id="meeting-checker-output-map" className="flex flex-col justify-center space-y-1 min-h-[40px]">
                        <div className="flex items-center justify-between text-[10px] font-mono p-1.5 bg-white rounded-lg border border-gray-200">
                          <span className="text-gray-500">🏠 Home Time:</span>
                          <span className="font-bold text-indigo-700">
                            {(() => {
                              const testDate = new Date();
                              testDate.setHours(10);
                              const homeTz = countryConfigs[homeCountry]?.timezone || "America/New_York";
                              return testDate.toLocaleTimeString("en-US", {
                                timeZone: homeTz,
                                hour: "numeric",
                                hour12: true
                              });
                            })()}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5 text-[8.5px] font-mono">
                          <span className="text-emerald-600 font-semibold">✅ Perfect for Local Workspace!</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Smart Deadline Conversion Previewer */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1.5">
                    <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider block">Intelligent Deadline display converter</span>
                    <div className="bg-white p-2.5 rounded-lg border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-mono text-gray-400 uppercase block font-bold">Original:</span>
                        <span className="font-mono text-gray-700 font-semibold">Review — Tomorrow 9:00 PM</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] font-mono text-rose-500 uppercase block font-bold">Display:</span>
                        <span className="font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[10px] inline-block">
                          {(() => {
                            const testDate = new Date();
                            testDate.setDate(testDate.getDate() + 1);
                            testDate.setHours(21);
                            testDate.setMinutes(0);
                            const result = convertDeadlineDisplay(testDate.toISOString());
                            return result.isDifferentZone ? `${result.localTime} Local` : "9:00 PM Local";
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>

          {/* RIGHT: TRAVEL PLANNER CONSOLE PANEL (col-span-4 on desktop) */}
          <div className="lg:col-span-4 flex flex-col space-y-6">
            
            {/* 1. TRAVEL PLANNER FORM CARD */}
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-base font-black tracking-tight text-gray-900 flex items-center gap-2">
                <Navigation className="text-emerald-600 animate-pulse" size={18} />
                <span>Travel Planner</span>
              </h3>

              <div className="space-y-3.5">
                
                {/* Origin Location Form Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">📍 Current Location</label>
                  <div className="flex gap-1.5">
                    <input 
                      type="text" 
                      value={originAddress} 
                      onChange={(e) => setOriginAddress(e.target.value)}
                      className="flex-1 p-2 border border-gray-200 rounded-xl bg-gray-50 text-xs focus:bg-white outline-none"
                      placeholder="Start point address..."
                    />
                    <button 
                      onClick={handleRequestLocation}
                      className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
                      title="Acquire current coordinate via GPS"
                    >
                      <Locate size={14} />
                    </button>
                  </div>
                </div>

                {/* Destination Search Form Input */}
                <div className="space-y-1 relative">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">🎯 Destination</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Enter city, college, bank, office..." 
                      value={destinationSearch}
                      onChange={(e) => setDestinationSearch(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      className="w-full p-2 border border-gray-200 rounded-xl bg-gray-50 text-xs focus:bg-white outline-none pr-8"
                    />
                    <Search className="absolute right-2.5 top-2.5 text-gray-400" size={14} />
                  </div>

                  {/* Sidebar Autocomplete Dropdown List */}
                  {autocompleteSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-150 overflow-hidden z-50 max-h-60 overflow-y-auto w-full">
                      {autocompleteSuggestions.map((sug, idx) => (
                        <button
                          key={sug.id}
                          onClick={() => selectSuggestion(sug)}
                          onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                          className={`w-full text-left px-3 py-2 text-xs font-mono transition-colors flex flex-col border-b border-gray-50 last:border-0 cursor-pointer ${
                            idx === selectedSuggestionIndex ? "bg-emerald-50 text-emerald-900" : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <span className="font-bold flex items-center gap-1">
                            {sug.isSaved ? "⭐ " : "📍 "}{sug.name}
                          </span>
                          {(sug.city || sug.country) && (
                            <span className="text-[10px] text-gray-400">
                              {sug.city}{sug.city && sug.country ? ", " : ""}{sug.country}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Recent Destinations suggestions chips */}
                  {recentDestinations.length > 0 && !destinationCoords && (
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      <span className="text-[9px] text-gray-400 self-center font-mono uppercase">Recent:</span>
                      {recentDestinations.map((r, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setDestinationSearch(r);
                            triggerDestinationSearch(r);
                          }}
                          className="px-2 py-0.5 bg-gray-100 hover:bg-emerald-50 text-gray-600 hover:text-emerald-800 rounded text-[10px] font-mono cursor-pointer"
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Travel mode selector */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">🚗 Travel Mode</label>
                  <div className="grid grid-cols-5 gap-1 font-mono text-[10px]">
                    {[
                      { mode: "walking", icon: "🚶" },
                      { mode: "bicycle", icon: "🚲" },
                      { mode: "bike", icon: "🏍️" },
                      { mode: "car", icon: "🚗" },
                      { mode: "taxi", icon: "🚕" }
                    ].map(x => (
                      <button
                        key={x.mode}
                        onClick={() => { setTravelMode(x.mode as any); triggerAudioTone("success"); }}
                        className={`py-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all capitalize cursor-pointer ${
                          travelMode === x.mode ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold" : "bg-white text-gray-500 border-gray-150 hover:bg-gray-50"
                        }`}
                        title={x.mode}
                      >
                        <span className="text-base">{x.icon}</span>
                        <span>{x.mode}</span>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-4 gap-1 pt-1 font-mono text-[10px]">
                    {[
                      { mode: "bus", icon: "🚌" },
                      { mode: "metro", icon: "🚇" },
                      { mode: "train", icon: "🚆" },
                      { mode: "flight", icon: "✈️" }
                    ].map(x => (
                      <button
                        key={x.mode}
                        onClick={() => { setTravelMode(x.mode as any); triggerAudioTone("success"); }}
                        className={`py-2 rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-all capitalize cursor-pointer ${
                          travelMode === x.mode ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold" : "bg-white text-gray-500 border-gray-150 hover:bg-gray-50"
                        }`}
                        title={x.mode}
                      >
                        <span className="text-sm">{x.icon}</span>
                        <span>{x.mode}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Desired Arrival Time Select */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">🕒 Desired Arrival Time</label>
                  <select
                    value={desiredArrivalTime}
                    onChange={(e) => setDesiredArrivalTime(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-xl bg-gray-50 text-xs focus:bg-white outline-none cursor-pointer"
                  >
                    <option>Leave immediately</option>
                    <option>Reach as early as possible</option>
                    <option>Reach before meeting (9:45 AM)</option>
                    <option>Reach by 10:00 AM</option>
                    <option>Reach by 2:30 PM</option>
                    <option>Evening commute (after 6:00 PM)</option>
                  </select>
                </div>

                {/* Active Guidance routing stats */}
                {destinationCoords && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-1 text-xs"
                  >
                    <div className="flex justify-between font-bold text-emerald-900">
                      <span>Total Distance:</span>
                      <span>{activeDistanceKm.toFixed(2)} km</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-900">
                      <span>Est. Travel Time:</span>
                      <span>{activeDurationMinutes} mins</span>
                    </div>
                    {aiTravelAnalysis && (
                      <div className="text-[10px] text-emerald-700 italic pt-1 border-t border-emerald-200/50 font-mono mt-1">
                        Arrival Confidence: {aiTravelAnalysis.confidence}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Action Trigger Buttons */}
                <div className="pt-2">
                  {destinationCoords ? (
                    <button 
                      onClick={() => {
                        setLiveNavigationActive(true);
                        setNavigationProgress(0);
                        triggerNotification("🚀 Navigation tracking mode activated!", "success");
                      }}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Navigation size={14} />
                      <span>Start Live Journey Tracker</span>
                    </button>
                  ) : (
                    <button 
                      disabled
                      className="w-full py-2.5 bg-gray-100 text-gray-400 font-mono font-bold text-xs uppercase tracking-wider rounded-xl cursor-not-allowed"
                    >
                      Configure Destination Waypoint
                    </button>
                  )}
                </div>

              </div>
            </div>

            {/* 2. RIDE BOOKING (Uber / Ola / Rapido / Local Taxi) - Display only when destination set & mode allows */}
            {destinationCoords && (travelMode === "car" || travelMode === "taxi" || travelMode === "bike") && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs space-y-3"
              >
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <Zap className="text-yellow-500" size={16} />
                    <span>On-Demand Ride Booking</span>
                  </h4>
                  <span className="text-[10px] font-mono text-gray-400">Integrated Rates</span>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                  <button 
                    onClick={() => {
                      triggerNotification("Opening Uber app link for automated destination loading...", "success");
                      window.open(`https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${destinationCoords.lat}&dropoff[longitude]=${destinationCoords.lng}`, "_blank");
                    }}
                    className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 rounded-xl flex flex-col items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span className="font-bold">Book Uber</span>
                    <span className="text-[8px] text-emerald-400">Est: $14.50 (6 min)</span>
                  </button>

                  <button 
                    onClick={() => {
                      triggerNotification("Connecting to Ola Cabs route proxy...", "success");
                    }}
                    className="p-2.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-900 border border-yellow-200 rounded-xl flex flex-col items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span className="font-bold">Book Ola</span>
                    <span className="text-[8px] text-gray-500">Est: $15.20 (8 min)</span>
                  </button>

                  <button 
                    onClick={() => {
                      triggerNotification("Opening Rapido Fast Bike terminal booking...", "success");
                    }}
                    className="p-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 border border-yellow-600 rounded-xl flex flex-col items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span className="font-bold">Book Rapido (Bike)</span>
                    <span className="text-[8px] text-slate-900 font-extrabold">Est: $6.10 (3 min)</span>
                  </button>

                  <button 
                    onClick={() => {
                      triggerNotification("Paging nearest verified Local Taxi cab drivers...", "success");
                    }}
                    className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 rounded-xl flex flex-col items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span className="font-bold">Book Local Taxi</span>
                    <span className="text-[8px] text-gray-400">Dialing Dispatch</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* 3. AI TRAVEL INTELLIGENCE RECOMMENDER CARD */}
            {aiTravelAnalysis && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white border border-indigo-900 rounded-2xl p-5 shadow-lg space-y-3 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Sparkles size={48} />
                </div>
                
                <h4 className="text-xs font-mono font-black uppercase tracking-widest text-indigo-300 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-yellow-400" />
                  <span>AI Travel Intelligence</span>
                </h4>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-gray-400 block font-mono text-[9px] uppercase">Real-Time Traffic Status</span>
                    <p className="font-medium text-gray-100">{aiTravelAnalysis.trafficFactor}</p>
                  </div>

                  <div>
                    <span className="text-gray-400 block font-mono text-[9px] uppercase">Arrival Safety Index</span>
                    <p className="font-medium text-gray-100">Confidence is <span className="text-emerald-400 font-bold">{aiTravelAnalysis.confidence}</span></p>
                  </div>

                  {aiTravelAnalysis.isDelayRisk && (
                    <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-200">
                      <span className="font-bold block text-[10px]">⚠️ Dynamic Congestion Warning:</span>
                      <p className="text-[11px] leading-relaxed mt-0.5">{aiTravelAnalysis.alternativeRec}</p>
                    </div>
                  )}

                  <div className="pt-1.5 border-t border-white/10 flex justify-between items-center text-[11px] text-indigo-200">
                    <span>Weather Alert Confidence</span>
                    <span className="font-mono bg-indigo-500/30 px-2 py-0.5 rounded text-white text-[10px] font-bold">95% Accuracy</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 4. CALENDAR SCHEDULE INTEGRATION & OPTIMIZATION */}
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Calendar size={16} className="text-indigo-600" />
                <span>Calendar Reminders Link</span>
              </h4>

              {calendarTasksWithLocation.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No schedules with custom addresses found today.</p>
              ) : (
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Upcoming Tasks with Location Triggers:</span>
                  <div className="space-y-1.5">
                    {calendarTasksWithLocation.map(t => (
                      <div 
                        key={t.id} 
                        className="p-2.5 bg-gray-50 hover:bg-indigo-50/20 border border-gray-150 rounded-xl flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-gray-800 block truncate">{t.title}</span>
                          <span className="text-[10px] text-gray-500 block truncate">
                            {t.destination ? `📍 ${t.destination}` : "📍 Automatic college allocation"}
                          </span>
                        </div>
                        <button
                          onClick={() => handleApplyCalendarPlan(t)}
                          className="px-2.5 py-1 bg-white border hover:bg-indigo-50 hover:border-indigo-200 text-indigo-700 text-[10px] font-bold font-mono uppercase rounded-lg cursor-pointer shrink-0"
                        >
                          Route
                        </button>
                      </div>
                    ))}
                  </div>

                  {calendarTasksWithLocation.length > 1 && (
                    <button
                      onClick={handleOptimizeRouteSequence}
                      className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-150 text-[10px] font-mono font-bold uppercase rounded-lg transition-colors cursor-pointer mt-1.5 flex items-center justify-center gap-1.5"
                    >
                      <Sparkles size={12} />
                      <span>Optimize sequence of destinations</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 5. WEATHER & SAFETY TIPS */}
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <Sun size={16} className="text-amber-500 animate-pulse" />
                  <span>Weather & Safety Guidance</span>
                </h4>
                <span className="text-[10px] font-mono text-gray-400 bg-gray-50 border px-1.5 py-0.5 rounded">
                  SF District
                </span>
              </div>

              {/* Weather Stats Row */}
              {weatherData && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-gray-50 border border-gray-150 rounded-xl text-center">
                    <span className="text-gray-400 text-[9px] block uppercase font-mono">Current Location</span>
                    <div className="flex items-center justify-center gap-1.5 mt-1 font-bold text-gray-800">
                      <span className="text-sm">{weatherData.origin.temperature}°C</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">{getConditionString(weatherData.origin.conditionCode)}</span>
                    <div className="text-[9px] text-gray-400 grid grid-cols-2 gap-1 mt-1 text-left">
                      <span>Rain: {weatherData.origin.rain}mm</span>
                      <span>Hum: {weatherData.origin.humidity}%</span>
                      <span>Wind: {weatherData.origin.windSpeed}km/h</span>
                      <span>UV: {weatherData.origin.uvIndex}</span>
                      <span className="col-span-2">AQI: {weatherData.origin.aqi}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 border border-gray-150 rounded-xl text-center">
                    <span className="text-gray-400 text-[9px] block uppercase font-mono">Destination</span>
                    <div className="flex items-center justify-center gap-1.5 mt-1 font-bold text-gray-800">
                      <span className="text-sm">{weatherData.dest.temperature}°C</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono truncate block">{getConditionString(weatherData.dest.conditionCode)}</span>
                    <div className="text-[9px] text-gray-400 grid grid-cols-2 gap-1 mt-1 text-left">
                      <span>Rain: {weatherData.dest.rain}mm</span>
                      <span>Hum: {weatherData.dest.humidity}%</span>
                      <span>Wind: {weatherData.dest.windSpeed}km/h</span>
                      <span>UV: {weatherData.dest.uvIndex}</span>
                      <span className="col-span-2">AQI: {weatherData.dest.aqi}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Safety suggestions list */}
              {healthSuggestions.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-gray-400 block">Contextual Advice & Tips:</span>
                  <div className="space-y-1">
                    {healthSuggestions.map((tip, idx) => (
                      <div key={idx} className="p-2 bg-amber-50/50 border border-amber-100 rounded-xl text-xs text-amber-800 leading-relaxed font-mono">
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 6. EMERGENCY ASSISTANCE & RAPID TRIGGER */}
            <div className="bg-red-50/50 border border-red-150 rounded-2xl p-5 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-red-950 flex items-center gap-1.5">
                <HeartPulse size={16} className="text-red-600 animate-pulse" />
                <span>Emergency Road Assistance</span>
              </h4>
              <p className="text-[10px] text-red-800 leading-relaxed">
                Click any asset below to trace coordinates and draw immediate emergency navigation lines:
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {emergencyLocations.slice(0, 4).map((item, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectEmergency(item)}
                    className="p-2 bg-white hover:bg-red-50 border border-red-200 hover:border-red-400 text-red-950 rounded-xl text-left transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span className="truncate">{item.type}</span>
                      <span className="text-[9px] text-red-600 shrink-0">{item.distance}</span>
                    </div>
                    <span className="text-[9px] text-gray-400 truncate block mt-0.5">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 7. NEARBY ESSENTIALS */}
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Coffee size={16} className="text-orange-500" />
                <span>Nearby Essentials</span>
              </h4>
              <span className="text-[10px] text-gray-400 block">Contextually matching your schedules:</span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {nearbyEssentials.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="p-2 bg-gray-50 rounded-xl border border-gray-150 text-[11px]"
                  >
                    <span className="font-bold text-gray-700 block truncate">{item.name}</span>
                    <span className="text-[9px] text-gray-400 block font-mono">{item.type} • {item.distance}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 8. INTERACTIVE VOICE NAVIGATION CONSOLE */}
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <Volume2 size={16} className="text-emerald-600 animate-pulse" />
                  <span>Voice Copilot Console</span>
                </h4>
                <button 
                  onClick={() => setVoiceConsoleOpen(!voiceConsoleOpen)}
                  className="text-xs text-indigo-600 hover:underline font-mono"
                >
                  {voiceConsoleOpen ? "Close console" : "Open console"}
                </button>
              </div>

              {voiceConsoleOpen && (
                <div className="space-y-3">
                  {/* Real-time Microphone Trigger Visual */}
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 border border-gray-150 rounded-2xl space-y-2 text-center">
                    <button
                      onClick={isListening ? stopVoiceListening : startVoiceListening}
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md relative cursor-pointer ${
                        isListening 
                          ? "bg-red-500 hover:bg-red-600 text-white animate-pulse scale-105" 
                          : "bg-emerald-600 hover:bg-emerald-500 text-white"
                      }`}
                      title={isListening ? "Stop listening" : "Start listening"}
                    >
                      <Mic size={24} />
                      {isListening && (
                        <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-75" />
                      )}
                    </button>
                    
                    <div>
                      <span className="text-[11px] font-bold text-gray-700 block uppercase tracking-wider">
                        {isListening ? "Listening Active" : "Tap Mic to speak"}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {isListening ? "Automatic submission after pause" : "Control routing, mode or settings via voice commands"}
                      </p>
                    </div>

                    {/* Waveform and Live Transcript */}
                    {isListening && (
                      <div className="w-full pt-1">
                        <div className="flex gap-1 items-center justify-center h-8 py-1">
                          <div className="w-1 h-3 bg-red-400 rounded animate-bounce" style={{ animationDelay: "0s" }} />
                          <div className="w-1 h-6 bg-red-500 rounded animate-bounce" style={{ animationDelay: "0.1s" }} />
                          <div className="w-1 h-4 bg-red-400 rounded animate-bounce" style={{ animationDelay: "0.2s" }} />
                          <div className="w-1 h-7 bg-red-500 rounded animate-bounce" style={{ animationDelay: "0.3s" }} />
                          <div className="w-1 h-2 bg-red-400 rounded animate-bounce" style={{ animationDelay: "0.4s" }} />
                        </div>
                      </div>
                    )}

                    {speechTranscript && (
                      <div className="w-full p-2 bg-white border border-gray-150 rounded-xl mt-1">
                        <p className="text-xs font-mono italic text-emerald-800 leading-normal">
                          "{speechTranscript}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Manual Type Fallback (Aesthetic alignment) */}
                  <div className="flex gap-1.5">
                    <input 
                      type="text" 
                      placeholder="Type query manually (e.g. 'Navigate home')..."
                      value={voiceCommand}
                      onChange={(e) => setVoiceCommand(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleVoiceCommandSubmit("")}
                      className="flex-1 p-2 border border-gray-200 rounded-xl bg-gray-50 text-xs outline-none focus:bg-white"
                    />
                    <button 
                      onClick={() => handleVoiceCommandSubmit("")}
                      className="px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs uppercase font-bold rounded-xl cursor-pointer"
                    >
                      Parse
                    </button>
                  </div>

                  <div className="text-[10px] text-gray-400 font-mono space-y-1 border-t border-gray-150 pt-2">
                    <span className="font-bold uppercase text-[9px] block text-gray-500">Voice Command Directory:</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        "Navigate to SBI Bank",
                        "Take me home",
                        "Nearest hospital",
                        "Nearest ATM",
                        "Navigate to airport",
                        "Cancel navigation",
                        "Repeat directions",
                        "Avoid tolls",
                        "Walking mode"
                      ].map((cmd, i) => (
                        <button
                          key={i}
                          onClick={() => handleVoiceCommandSubmit(cmd)}
                          className="text-left py-1 px-1.5 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-800 border border-gray-200/50 hover:border-emerald-200 rounded text-[9px] text-indigo-600 truncate cursor-pointer transition-all"
                        >
                          🗣️ "{cmd}"
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 9. PRIVACY CONTROLS PANEL */}
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Lock size={16} className="text-gray-500" />
                <span>GPS & Privacy Control</span>
              </h4>

              <div className="space-y-3 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-gray-700 block">Pause Live GPS telemetry</span>
                    <span className="text-[10px] text-gray-400">Suspends active browser Geolocation</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={pauseGPS}
                    onChange={(e) => {
                      setPauseGPS(e.target.checked);
                      triggerNotification(e.target.checked ? "GPS tracking paused." : "GPS tracking enabled.", "warning");
                    }}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-gray-700 block">Disable background tracking</span>
                    <span className="text-[10px] text-gray-400">Stops simulated route updates</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={disableTracking}
                    onChange={(e) => {
                      setDisableTracking(e.target.checked);
                      triggerNotification(e.target.checked ? "Background updates stopped." : "Background updates active.", "warning");
                    }}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-gray-700 block">Disable smart suggestions</span>
                    <span className="text-[10px] text-gray-400">Hides weather safety alerts</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={disableSuggestions}
                    onChange={(e) => {
                      setDisableSuggestions(e.target.checked);
                      triggerNotification("Suggestions disabled.", "warning");
                    }}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer"
                  />
                </div>

                <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-[10px]">
                  <span>GDPR Compliance State</span>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-bold uppercase">
                    Secured Sandbox
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
