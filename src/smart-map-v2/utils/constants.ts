import { Coordinates, PlaceCategory } from "../types/map";

export const DEFAULT_COORDS: Coordinates = {
  lat: 40.7128,
  lng: -74.0060,
};

export const TILE_URLS = {
  light: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
};

export interface PlaceCategoryOption {
  id: PlaceCategory;
  name: string;
  emoji: string;
  color: string;
}

export const CATEGORIES: PlaceCategoryOption[] = [
  { id: "home", name: "Home", emoji: "🏠", color: "bg-blue-500 text-white" },
  { id: "college", name: "College", emoji: "🎓", color: "bg-purple-500 text-white" },
  { id: "office", name: "Office", emoji: "🏢", color: "bg-amber-500 text-white" },
  { id: "library", name: "Library", emoji: "📚", color: "bg-emerald-500 text-white" },
  { id: "gym", name: "Gym", emoji: "💪", color: "bg-pink-500 text-white" },
  { id: "hospital", name: "Hospital", emoji: "🏥", color: "bg-red-500 text-white" },
  { id: "custom", name: "Custom", emoji: "📍", color: "bg-neutral-500 text-white" },
];
