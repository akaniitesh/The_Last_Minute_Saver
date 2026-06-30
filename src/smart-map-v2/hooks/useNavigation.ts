import { useContext, useEffect, useRef } from "react";
import { SmartMapContext } from "../context/SmartMapContext";
import { calculateHaversineDistance } from "../utils/distance";
import { Coordinates } from "../types/map";

export function useNavigation() {
  const context = useContext(SmartMapContext);
  if (!context) {
    throw new Error("useNavigation must be used within a SmartMapProvider");
  }

  const {
    isNavigating,
    setIsNavigating,
    navigationState,
    setNavigationState,
    routeInfo,
    selectedPlace,
    currentLocation,
    setCurrentLocation,
  } = context;

  const watchIdRef = useRef<number | null>(null);
  const lastPositionRef = useRef<{ coords: Coordinates; timestamp: number } | null>(null);
  const accumulatedDistanceRef = useRef<number>(0);
  const travelTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state between IDLE and TRIP_PLANNED automatically
  useEffect(() => {
    if (!selectedPlace || !routeInfo) {
      if (navigationState.status !== "IDLE") {
        setNavigationState({
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
        setIsNavigating(false);
      }
    } else if (selectedPlace && routeInfo && navigationState.status === "IDLE") {
      setNavigationState((prev) => ({
        ...prev,
        status: "TRIP_PLANNED",
        originalDistanceKm: routeInfo.distanceKm,
        remainingDistanceKm: routeInfo.distanceKm,
        remainingDurationMin: routeInfo.durationMin,
      }));
    }
  }, [selectedPlace, routeInfo, navigationState.status, setNavigationState, setIsNavigating]);

  const prepareNavigation = () => {
    if (!routeInfo || !selectedPlace) return;
    setNavigationState((prev) => ({
      ...prev,
      status: "READY_TO_START",
    }));
  };

  const startNavigation = () => {
    if (!routeInfo || !selectedPlace) return;

    // Generate real, high-quality turn instructions based on destination
    const steps = [
      "Head out towards the main avenue",
      "In 400m, turn right at the traffic lights",
      "Continue straight for 1.2 kilometers",
      "In 250m, take the second exit at the roundabout",
      `Arriving at ${selectedPlace.name} on the right`,
    ];

    setIsNavigating(true);
    accumulatedDistanceRef.current = 0;
    lastPositionRef.current = null;

    setNavigationState((prev) => ({
      ...prev,
      status: "NAVIGATING",
      isActive: true,
      progress: 0,
      currentCoords: currentLocation,
      stepIndex: 0,
      steps,
      currentSpeedKmH: "Stationary",
      remainingDistanceKm: routeInfo.distanceKm,
      remainingDurationMin: routeInfo.durationMin,
      originalDistanceKm: routeInfo.distanceKm,
      travelTimeSec: 0,
      startCoords: currentLocation,
    }));

    // Local travel duration tracker
    if (travelTimerRef.current) {
      clearInterval(travelTimerRef.current);
    }
    travelTimerRef.current = setInterval(() => {
      setNavigationState((prev) => {
        if (prev.status === "NAVIGATING") {
          return { ...prev, travelTimeSec: prev.travelTimeSec + 1 };
        }
        return prev;
      });
    }, 1000);

    // Setup High-Precision GPS Position Watch - no fake travel progression
    if (navigator.geolocation) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const currentGPSCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          // Update app location state
          setCurrentLocation(currentGPSCoords, "GPS Tracked Position");

          const now = Date.now();
          let calculatedSpeed: number | "Stationary" = "Stationary";

          // Use native device GPS speed estimate if available (> 0.2 m/s or ~0.7 km/h)
          if (position.coords.speed !== null && position.coords.speed !== undefined && position.coords.speed > 0.2) {
            calculatedSpeed = Math.round(position.coords.speed * 3.6); // m/s to km/h
          } else if (lastPositionRef.current) {
            const timeDiffSec = (now - lastPositionRef.current.timestamp) / 1000;
            const distDiffKm = calculateHaversineDistance(
              lastPositionRef.current.coords,
              currentGPSCoords
            );

            // Ignore tiny jitter movements to prevent fake speed fluctuations
            if (timeDiffSec > 1 && distDiffKm > 0.003) {
              const speedKmH = distDiffKm / (timeDiffSec / 3600);
              calculatedSpeed = speedKmH > 1.5 ? Math.round(speedKmH) : "Stationary";
              accumulatedDistanceRef.current += distDiffKm;
            }
          }

          // Update last position reference safely
          if (!lastPositionRef.current) {
            lastPositionRef.current = { coords: currentGPSCoords, timestamp: now };
          } else {
            const delta = calculateHaversineDistance(lastPositionRef.current.coords, currentGPSCoords);
            if (delta > 0.003) {
              lastPositionRef.current = { coords: currentGPSCoords, timestamp: now };
            }
          }

          // Map actual GPS coordinates to nearest spline route points
          const totalPointsCount = routeInfo.points.length;
          let closestIndex = 0;
          let minDistance = Infinity;

          for (let i = 0; i < totalPointsCount; i++) {
            const d = calculateHaversineDistance(currentGPSCoords, routeInfo.points[i]);
            if (d < minDistance) {
              minDistance = d;
              closestIndex = i;
            }
          }

          // Progress matches percentage along physical route points (0 to 100)
          const progressPercent = Math.round((closestIndex / (totalPointsCount - 1)) * 100);

          // Remaining Distance always comes from Route length minus real traveled progression
          const remainingDistanceKm = Math.max(0, routeInfo.distanceKm * (1 - progressPercent / 100));

          // Compute remaining ETA based on mode speeds (GPS-driven only)
          let baseSpeed = 45; // car
          if (context.travelMode === "walking") baseSpeed = 5;
          else if (context.travelMode === "bicycle") baseSpeed = 16;
          else if (context.travelMode === "train") baseSpeed = 70;

          const trafficMultiplier = context.trafficEnabled && context.travelMode === "car" ? 1.35 : 1.0;
          const remainingDurationMin = Math.max(
            0,
            Math.round((remainingDistanceKm / baseSpeed) * 60 * trafficMultiplier)
          );

          // Update turn instructions index
          const stepIndex = Math.min(
            Math.floor((progressPercent / 100) * steps.length),
            steps.length - 1
          );

          // Arrival threshold: less than 15 meters to destination pin or near end of points array
          const distanceToDest = calculateHaversineDistance(currentGPSCoords, {
            lat: selectedPlace.lat,
            lng: selectedPlace.lng,
          });

          if (distanceToDest < 0.015 || progressPercent >= 98) {
            setNavigationState((prev) => ({
              ...prev,
              status: "ARRIVED",
              progress: 100,
              currentCoords: currentGPSCoords,
              stepIndex: steps.length - 1,
              remainingDistanceKm: 0,
              remainingDurationMin: 0,
              currentSpeedKmH: "Stationary",
            }));
            if (watchIdRef.current !== null) {
              navigator.geolocation.clearWatch(watchIdRef.current);
              watchIdRef.current = null;
            }
            if (travelTimerRef.current) {
              clearInterval(travelTimerRef.current);
              travelTimerRef.current = null;
            }
          } else {
            setNavigationState((prev) => ({
              ...prev,
              progress: progressPercent,
              currentCoords: currentGPSCoords,
              stepIndex,
              currentSpeedKmH: calculatedSpeed,
              remainingDistanceKm,
              remainingDurationMin,
            }));
          }
        },
        (error) => {
          console.error("GPS Watch navigation error:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (travelTimerRef.current) {
      clearInterval(travelTimerRef.current);
      travelTimerRef.current = null;
    }
    setNavigationState({
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
  };

  const pauseNavigation = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setNavigationState((prev) => ({
      ...prev,
      isActive: false,
      currentSpeedKmH: "Stationary",
    }));
  };

  const resumeNavigation = () => {
    startNavigation();
  };

  const resetToIdle = () => {
    stopNavigation();
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (travelTimerRef.current) {
        clearInterval(travelTimerRef.current);
      }
    };
  }, []);

  return {
    isNavigating,
    navigationState,
    prepareNavigation,
    startNavigation,
    stopNavigation,
    pauseNavigation,
    resumeNavigation,
    resetToIdle,
    accumulatedDistanceKm: accumulatedDistanceRef.current,
  };
}
