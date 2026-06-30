import { Coordinates, SearchSuggestion } from "../types/map";

/**
 * Service to handle geocoding (address to coordinates) and reverse geocoding using Nominatim.
 */
export class GeocodingService {
  /**
   * Search for locations matching a query, with optional geographic bounding bias around origin.
   */
  static async searchLocations(
    query: string,
    origin?: Coordinates | null
  ): Promise<SearchSuggestion[]> {
    if (!query || query.trim().length < 2) return [];

    try {
      let viewboxParam = "";
      if (origin) {
        // Bias results within a 0.4 degree bounding box (~40km) around user's location
        viewboxParam = `&viewbox=${origin.lng - 0.4},${origin.lat + 0.4},${origin.lng + 0.4},${origin.lat - 0.4}`;
      }

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5${viewboxParam}`
      );

      if (!res.ok) {
        throw new Error("Geocoding service error");
      }

      const data = await res.json();
      return data.map((item: any) => ({
        id: item.place_id.toString(),
        name: item.display_name.split(",")[0],
        address: item.display_name.split(",").slice(1, 4).join(",").trim(),
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }));
    } catch (error) {
      console.error("Geocoding search error:", error);
      return [];
    }
  }

  /**
   * Turn coordinates into a readable address string.
   */
  static async reverseGeocode(coords: Coordinates): Promise<string> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=16`
      );
      if (res.ok) {
        const data = await res.json();
        return data.display_name.split(",").slice(0, 3).join(", ").trim();
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
    }
    return `Location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
  }
}
