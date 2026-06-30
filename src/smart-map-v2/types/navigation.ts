import { Coordinates } from "./map";

export type TravelMode = "walking" | "bicycle" | "car" | "train";

export interface RouteInfo {
  distanceKm: number;
  durationMin: number;
  suggestedLeaveTime: string;
  points: Coordinates[];
}

export type NavigationStatus = "IDLE" | "TRIP_PLANNED" | "READY_TO_START" | "NAVIGATING" | "ARRIVED";

export interface NavigationState {
  status: NavigationStatus;
  isActive: boolean;
  progress: number; // 0 to 100
  currentCoords: Coordinates | null;
  stepIndex: number;
  steps: string[];
  currentSpeedKmH: number | "Stationary";
  remainingDistanceKm: number;
  remainingDurationMin: number;
  originalDistanceKm: number;
  travelTimeSec: number; // Actual travel duration counter
  startCoords: Coordinates | null;
}

