import { useContext } from "react";
import { SmartMapContext } from "../context/SmartMapContext";
import { SavedPlace, PlaceCategory } from "../types/map";

export function useSavedPlaces() {
  const context = useContext(SmartMapContext);
  if (!context) {
    throw new Error("useSavedPlaces must be used within a SmartMapProvider");
  }

  const { savedPlaces, setSavedPlaces } = context;

  const savePlace = (name: string, address: string, lat: number, lng: number, category: PlaceCategory) => {
    const newPlace: SavedPlace = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      address,
      lat,
      lng,
      category,
    };

    setSavedPlaces((prev) => {
      const updated = [...prev, newPlace];
      localStorage.setItem("smart_map_saved_places", JSON.stringify(updated));
      return updated;
    });
  };

  const removePlace = (id: string) => {
    setSavedPlaces((prev) => {
      const updated = prev.filter((place) => place.id !== id);
      localStorage.setItem("smart_map_saved_places", JSON.stringify(updated));
      return updated;
    });
  };

  return {
    savedPlaces,
    savePlace,
    removePlace,
  };
}
