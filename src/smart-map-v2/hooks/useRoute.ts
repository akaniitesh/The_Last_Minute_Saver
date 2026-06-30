import { useContext, useEffect, useCallback } from "react";
import { SmartMapContext } from "../context/SmartMapContext";
import { RoutingService } from "../services/routing";

export function useRoute() {
  const context = useContext(SmartMapContext);
  if (!context) {
    throw new Error("useRoute must be used within a SmartMapProvider");
  }

  const {
    currentLocation,
    selectedPlace,
    routeInfo,
    setRouteInfo,
    travelMode,
    setTravelMode,
    trafficEnabled,
    setTrafficEnabled,
  } = context;

  const calculateRoute = useCallback(() => {
    if (!selectedPlace) {
      setRouteInfo(null);
      return;
    }

    const route = RoutingService.calculateRoute(
      currentLocation,
      { lat: selectedPlace.lat, lng: selectedPlace.lng },
      travelMode,
      trafficEnabled
    );
    setRouteInfo(route);
  }, [currentLocation, selectedPlace, travelMode, trafficEnabled, setRouteInfo]);

  useEffect(() => {
    calculateRoute();
  }, [calculateRoute]);

  const toggleTraffic = () => {
    setTrafficEnabled(!trafficEnabled);
  };

  return {
    routeInfo,
    travelMode,
    setTravelMode,
    trafficEnabled,
    toggleTraffic,
    recalculate: calculateRoute,
  };
}
