import { useContext } from "react";
import { SmartMapContext } from "../context/SmartMapContext";
import { Coordinates } from "../types/map";

export function useMap() {
  const context = useContext(SmartMapContext);
  if (!context) {
    throw new Error("useMap must be used within a SmartMapProvider");
  }

  const { mapConfig, setMapConfig } = context;

  const setCenter = (coords: Coordinates) => {
    setMapConfig((prev) => ({ ...prev, center: coords }));
  };

  const setZoom = (zoom: number) => {
    setMapConfig((prev) => ({ ...prev, zoom }));
  };

  const toggleDarkMode = () => {
    setMapConfig((prev) => ({ ...prev, isDarkMode: !prev.isDarkMode }));
  };

  return {
    config: mapConfig,
    setCenter,
    setZoom,
    toggleDarkMode,
  };
}
