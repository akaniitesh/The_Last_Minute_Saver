import { Coordinates } from "./map";

export type ReminderType =
  | "time"
  | "location"
  | "calendar"
  | "planner"
  | "traffic"
  | "weather"
  | "ai";

export type ReminderCategory =
  | "leave_home"
  | "reach_destination"
  | "meeting"
  | "class"
  | "medicine"
  | "assignment"
  | "exam"
  | "shopping"
  | "custom";

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  type: ReminderType;
  category: ReminderCategory;
  
  // Schedule/Trigger conditions
  targetTime?: string; // ISO string
  locationName?: string;
  coords?: Coordinates;
  triggerDistanceMeters?: number; // Geofencing threshold
  trafficDelayMinutesThreshold?: number; // Trigger if traffic delay exceeds this
  weatherRainProbabilityThreshold?: number; // Trigger if rain probability exceeds this
  
  // Trip details (associated trip metrics)
  tripDetails?: {
    distanceKm: number;
    durationMin: number;
    expectedTrafficDelayMin: number;
    recommendedDepartureTime: string; // ISO or local time string
    estimatedArrivalTime: string; // ISO or local time string
    bufferMinutes: number;
  };

  status: "upcoming" | "completed" | "dismissed";
  isSilent?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationHistoryItem {
  id: string;
  title: string;
  body: string;
  timestamp: string; // ISO string
  isRead: boolean;
  category: ReminderCategory;
  reminderId?: string;
  isSilent?: boolean;
}

export interface ReminderSettings {
  enableBrowserNotifications: boolean;
  enableWeatherAlerts: boolean;
  enableTrafficAlerts: boolean;
  enableAISuggestions: boolean;
  defaultBufferMinutes: number;
  notificationVolume: number; // 0 to 1
}
