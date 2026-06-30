export interface Coordinates {
  lat: number;
  lng: number;
}

export type PlaceCategory =
  | "home"
  | "college"
  | "office"
  | "library"
  | "gym"
  | "hospital"
  | "custom";

export interface SavedPlace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: PlaceCategory;
}

export interface SearchSuggestion {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  isSaved?: boolean;
  isCalendar?: boolean;
  category?: PlaceCategory;
}

export interface MapConfig {
  isDarkMode: boolean;
  showTraffic: boolean;
  zoom: number;
  center: Coordinates;
}
