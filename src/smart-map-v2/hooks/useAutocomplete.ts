import { useContext, useState, useEffect } from "react";
import { SmartMapContext } from "../context/SmartMapContext";
import { GeocodingService } from "../services/geocoding";
import { SearchSuggestion } from "../types/map";

export function useAutocomplete() {
  const context = useContext(SmartMapContext);
  if (!context) {
    throw new Error("useAutocomplete must be used within a SmartMapProvider");
  }

  const {
    searchQuery,
    setSearchQuery,
    selectedPlace,
    setSelectedPlace,
    currentLocation,
    recentSearches,
    setRecentSearches,
    savedPlaces,
  } = context;

  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Debounced search trigger
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await GeocodingService.searchLocations(searchQuery, currentLocation);
        
        // Enrich with saved places and calendar places where names match
        const enriched = results.map((res) => {
          const matchSaved = savedPlaces.find(
            (sp) => Math.abs(sp.lat - res.lat) < 0.0001 && Math.abs(sp.lng - res.lng) < 0.0001
          );
          if (matchSaved) {
            return {
              ...res,
              isSaved: true,
              category: matchSaved.category,
              name: matchSaved.name,
            };
          }
          return res;
        });

        setSuggestions(enriched);
      } catch (err) {
        console.error("Autocomplete search failed", err);
      } finally {
        setIsLoading(false);
      }
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, currentLocation, savedPlaces]);

  const selectPlace = (place: SearchSuggestion | null) => {
    setSelectedPlace(place);
    if (place) {
      setSearchQuery(place.name);
      addRecentSearch(place.name);
    }
    setSuggestions([]);
  };

  const addRecentSearch = (query: string) => {
    if (!query || query.trim().length === 0) return;
    const sanitized = query.trim();
    
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== sanitized.toLowerCase());
      const updated = [sanitized, ...filtered].slice(0, 5); // Max 5 items
      localStorage.setItem("smart_map_recent_searches", JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("smart_map_recent_searches");
  };

  return {
    searchQuery,
    setSearchQuery,
    suggestions,
    selectedPlace,
    selectPlace,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    isLoading,
  };
}
