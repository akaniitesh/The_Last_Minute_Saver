import { useContext, useState } from "react";
import { SmartMapContext } from "../context/SmartMapContext";
import { LocationService } from "../services/location";

export function useLocation() {
  const context = useContext(SmartMapContext);
  if (!context) {
    throw new Error("useLocation must be used within a SmartMapProvider");
  }

  const [isLocating, setIsLocating] = useState<boolean>(false);
  const { currentLocation, currentAddress, setCurrentLocation } = context;

  const refreshLocation = async () => {
    setIsLocating(true);
    try {
      const result = await LocationService.getCurrentLocation();
      setCurrentLocation(result.coords, result.address);
    } catch (err) {
      console.error("Failed to fetch current location", err);
    } finally {
      setIsLocating(false);
    }
  };

  return {
    currentLocation,
    currentAddress,
    isLocating,
    refreshLocation,
  };
}
