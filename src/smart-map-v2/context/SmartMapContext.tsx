import React, { createContext, useState, useEffect, ReactNode } from "react";
import { Coordinates, SavedPlace, SearchSuggestion, MapConfig } from "../types/map";
import { TravelMode, RouteInfo, NavigationState } from "../types/navigation";
import { TravelRecommendation } from "../services/planner";
import { DEFAULT_COORDS } from "../utils/constants";

// Reminder and Notification integrations
import { Reminder, ReminderSettings, ReminderType, ReminderCategory, NotificationHistoryItem } from "../types/reminder";
import { ReminderService } from "../services/reminder";
import { NotificationService } from "../services/notification";

export interface SmartMapContextValue {
  currentLocation: Coordinates;
  currentAddress: string;
  setCurrentLocation: (coords: Coordinates, address: string) => void;
  
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  
  selectedPlace: SearchSuggestion | null;
  setSelectedPlace: (place: SearchSuggestion | null) => void;
  
  routeInfo: RouteInfo | null;
  setRouteInfo: (route: RouteInfo | null) => void;
  
  travelMode: TravelMode;
  setTravelMode: (mode: TravelMode) => void;
  
  trafficEnabled: boolean;
  setTrafficEnabled: (enabled: boolean) => void;
  
  isNavigating: boolean;
  setIsNavigating: (active: boolean) => void;
  
  navigationState: NavigationState;
  setNavigationState: React.Dispatch<React.SetStateAction<NavigationState>>;
  
  savedPlaces: SavedPlace[];
  setSavedPlaces: React.Dispatch<React.SetStateAction<SavedPlace[]>>;
  
  recentSearches: string[];
  setRecentSearches: React.Dispatch<React.SetStateAction<string[]>>;
  
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  
  plannerRecommendations: TravelRecommendation[];
  setPlannerRecommendations: (recs: TravelRecommendation[]) => void;
  
  selectedRecommendation: TravelRecommendation | null;
  setSelectedRecommendation: (rec: TravelRecommendation | null) => void;
  
  mapConfig: MapConfig;
  setMapConfig: React.Dispatch<React.SetStateAction<MapConfig>>;

  // Reminder System states
  reminders: Reminder[];
  notifications: NotificationHistoryItem[];
  reminderSettings: ReminderSettings;
  updateReminderSettings: (settings: ReminderSettings) => void;
  createReminder: (
    title: string,
    type: ReminderType,
    category: ReminderCategory,
    details: {
      description?: string;
      targetTime?: string;
      locationName?: string;
      coords?: Coordinates;
      triggerDistanceMeters?: number;
      trafficDelayMinutesThreshold?: number;
      weatherRainProbabilityThreshold?: number;
      isSilent?: boolean;
    }
  ) => Reminder;
  deleteReminder: (id: string) => void;
  updateReminderStatus: (id: string, status: "upcoming" | "completed" | "dismissed") => void;
  clearNotificationHistory: () => void;
  markNotificationsAsRead: () => void;
}

export const SmartMapContext = createContext<SmartMapContextValue | null>(null);

interface SmartMapProviderProps {
  children: ReactNode;
}

export const SmartMapProvider: React.FC<SmartMapProviderProps> = ({ children }) => {
  const [currentLocation, setCurrentLocationState] = useState<Coordinates>(DEFAULT_COORDS);
  const [currentAddress, setCurrentAddress] = useState<string>("Locating...");
  
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPlace, setSelectedPlace] = useState<SearchSuggestion | null>(null);
  
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>("car");
  const [trafficEnabled, setTrafficEnabled] = useState<boolean>(false);
  
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [navigationState, setNavigationState] = useState<NavigationState>({
    status: "IDLE",
    isActive: false,
    progress: 0,
    currentCoords: null,
    stepIndex: 0,
    steps: [],
    currentSpeedKmH: "Stationary",
    remainingDistanceKm: 0,
    remainingDurationMin: 0,
    originalDistanceKm: 0,
    travelTimeSec: 0,
    startCoords: null,
  });

  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  
  const [plannerRecommendations, setPlannerRecommendations] = useState<TravelRecommendation[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState<TravelRecommendation | null>(null);

  const [mapConfig, setMapConfig] = useState<MapConfig>({
    isDarkMode: false,
    showTraffic: false,
    zoom: 14,
    center: DEFAULT_COORDS,
  });

  // Reminder & Notification States
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notifications, setNotifications] = useState<NotificationHistoryItem[]>([]);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(ReminderService.getSettings());

  // Load saved places, recent searches, reminders, and notifications on mount
  useEffect(() => {
    const saved = localStorage.getItem("smart_map_saved_places");
    if (saved) {
      try {
        setSavedPlaces(JSON.parse(saved));
      } catch (err) {
        console.error("Failed to parse saved places", err);
      }
    } else {
      // Default saved places
      const defaults: SavedPlace[] = [
        { id: "1", name: "Home", address: "Central Park West, New York, NY", lat: 40.785091, lng: -73.968285, category: "home" },
        { id: "2", name: "College Library", address: "Butler Library, Columbia University, NY", lat: 40.806290, lng: -73.963005, category: "library" },
      ];
      setSavedPlaces(defaults);
      localStorage.setItem("smart_map_saved_places", JSON.stringify(defaults));
    }

    const recents = localStorage.getItem("smart_map_recent_searches");
    if (recents) {
      try {
        setRecentSearches(JSON.parse(recents));
      } catch (err) {
        console.error("Failed to parse recent searches", err);
      }
    }

    // Load Reminders & Notifications
    setReminders(ReminderService.getReminders());
    setNotifications(NotificationService.getNotificationHistory());

    // Recover missed reminders immediately on startup
    ReminderService.recoverMissedReminders();
    setReminders(ReminderService.getReminders());
    setNotifications(NotificationService.getNotificationHistory());

    // Set up active reminders checks (every 5 seconds)
    const interval = setInterval(() => {
      ReminderService.checkActiveReminders(currentLocation);
    }, 5000);

    // Sync state between components or storage changes
    const syncReminders = () => setReminders(ReminderService.getReminders());
    const syncNotifications = () => setNotifications(NotificationService.getNotificationHistory());
    const syncSettings = () => setReminderSettings(ReminderService.getSettings());

    window.addEventListener("smart_map_reminders_updated", syncReminders);
    window.addEventListener("smart_map_notifications_updated", syncNotifications);
    window.addEventListener("smart_map_settings_updated", syncSettings);

    return () => {
      clearInterval(interval);
      window.removeEventListener("smart_map_reminders_updated", syncReminders);
      window.removeEventListener("smart_map_notifications_updated", syncNotifications);
      window.removeEventListener("smart_map_settings_updated", syncSettings);
    };
  }, [currentLocation]);

  const setCurrentLocation = (coords: Coordinates, address: string) => {
    setCurrentLocationState(coords);
    setCurrentAddress(address);
    setMapConfig((prev) => ({ ...prev, center: coords }));
  };

  // Reminder and Notification Actions
  const updateReminderSettings = (settings: ReminderSettings) => {
    ReminderService.saveSettings(settings);
    setReminderSettings(settings);
  };

  const createReminder = (
    title: string,
    type: ReminderType,
    category: ReminderCategory,
    details: {
      description?: string;
      targetTime?: string;
      locationName?: string;
      coords?: Coordinates;
      triggerDistanceMeters?: number;
      trafficDelayMinutesThreshold?: number;
      weatherRainProbabilityThreshold?: number;
      isSilent?: boolean;
    }
  ) => {
    const reminder = ReminderService.createReminder(title, type, category, details);
    setReminders(ReminderService.getReminders());
    return reminder;
  };

  const deleteReminder = (id: string) => {
    ReminderService.deleteReminder(id);
    setReminders(ReminderService.getReminders());
  };

  const updateReminderStatus = (id: string, status: "upcoming" | "completed" | "dismissed") => {
    ReminderService.updateReminderStatus(id, status);
    setReminders(ReminderService.getReminders());
  };

  const clearNotificationHistory = () => {
    NotificationService.clearHistory();
    setNotifications([]);
  };

  const markNotificationsAsRead = () => {
    NotificationService.markAllAsRead();
    setNotifications(NotificationService.getNotificationHistory());
  };

  return (
    <SmartMapContext.Provider
      value={{
        currentLocation,
        currentAddress,
        setCurrentLocation,
        searchQuery,
        setSearchQuery,
        selectedPlace,
        setSelectedPlace,
        routeInfo,
        setRouteInfo,
        travelMode,
        setTravelMode,
        trafficEnabled,
        setTrafficEnabled,
        isNavigating,
        setIsNavigating,
        navigationState,
        setNavigationState,
        savedPlaces,
        setSavedPlaces,
        recentSearches,
        setRecentSearches,
        isMobileOpen,
        setIsMobileOpen,
        plannerRecommendations,
        setPlannerRecommendations,
        selectedRecommendation,
        setSelectedRecommendation,
        mapConfig,
        setMapConfig,
        // Reminders & Notifications
        reminders,
        notifications,
        reminderSettings,
        updateReminderSettings,
        createReminder,
        deleteReminder,
        updateReminderStatus,
        clearNotificationHistory,
        markNotificationsAsRead,
      }}
    >
      {children}
    </SmartMapContext.Provider>
  );
};
