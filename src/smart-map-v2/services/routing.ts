import { Coordinates } from "../types/map";
import { TravelMode, RouteInfo } from "../types/navigation";
import { calculateHaversineDistance } from "../utils/distance";

/**
 * Service to handle travel route calculation and ETA estimations.
 */
export class RoutingService {
  /**
   * Calculates route metrics and path segments between an origin and destination coordinate.
   */
  static calculateRoute(
    origin: Coordinates,
    destination: Coordinates,
    mode: TravelMode,
    trafficEnabled: boolean = false
  ): RouteInfo {
    const directDistance = calculateHaversineDistance(origin, destination);
    
    // Road distance is typically ~1.2x to 1.3x straight-line distance
    const roadDistanceKm = directDistance * 1.25;

    // Speeds in km/h
    let baseSpeed = 45; // car default
    if (mode === "walking") baseSpeed = 5;
    else if (mode === "bicycle") baseSpeed = 16;
    else if (mode === "train") baseSpeed = 70;

    let travelTimeHrs = roadDistanceKm / baseSpeed;

    // Apply traffic multipliers for automotive modes
    if (trafficEnabled && (mode === "car")) {
      travelTimeHrs *= 1.35; // 35% delay in heavy traffic
    }

    const durationMin = Math.max(1, Math.round(travelTimeHrs * 60));

    // Calculate suggested leave-by time (local time representation)
    const now = new Date();
    const leaveTime = new Date(now.getTime() - durationMin * 60 * 1000);
    const suggestedLeaveTime = leaveTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Generate high-fidelity curved spline intermediate route points
    const points: Coordinates[] = [];
    const segmentsCount = 20;

    // Standard quadratic bezier calculation for high-fidelity path visual
    const midLat = (origin.lat + destination.lat) / 2;
    const midLng = (origin.lng + destination.lng) / 2;
    
    // Perpendicular offset for spline arc
    const dx = destination.lng - origin.lng;
    const dy = destination.lat - origin.lat;
    const controlLat = midLat - dx * 0.15;
    const controlLng = midLng + dy * 0.15;

    for (let i = 0; i <= segmentsCount; i++) {
      const t = i / segmentsCount;
      const lat =
        (1 - t) * (1 - t) * origin.lat +
        2 * (1 - t) * t * controlLat +
        t * t * destination.lat;
      const lng =
        (1 - t) * (1 - t) * origin.lng +
        2 * (1 - t) * t * controlLng +
        t * t * destination.lng;
      points.push({ lat, lng });
    }

    return {
      distanceKm: roadDistanceKm,
      durationMin,
      suggestedLeaveTime,
      points,
    };
  }
}
