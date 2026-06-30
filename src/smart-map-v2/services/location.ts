import { Coordinates } from "../types/map";
import { DEFAULT_COORDS } from "../utils/constants";

/**
 * Service to handle client-side GPS location fetching with high precision and safe fallbacks.
 */
export class LocationService {
  static async getCurrentLocation(): Promise<{ coords: Coordinates; address: string }> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ coords: DEFAULT_COORDS, address: "New York, NY" });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          
          try {
            // Reverse geocode to get city/area name
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=14`
            );
            if (res.ok) {
              const data = await res.json();
              const shortAddr = data.display_name.split(",").slice(0, 2).join(", ").trim();
              resolve({ coords, address: shortAddr || "Current Location" });
              return;
            }
          } catch (err) {
            console.error("Reverse geocoding failed, returning raw coords", err);
          }
          
          resolve({ coords, address: "My Location" });
        },
        (error) => {
          console.warn("Geolocation denied or timed out, using default coordinates.", error);
          resolve({ coords: DEFAULT_COORDS, address: "New York, NY" });
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    });
  }
}
