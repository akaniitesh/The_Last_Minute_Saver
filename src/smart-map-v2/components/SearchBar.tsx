import React, { useState, useRef, useEffect } from "react";
import { useAutocomplete } from "../hooks/useAutocomplete";
import { Search, X, Clock, MapPin } from "lucide-react";

export const SearchBar: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    suggestions,
    selectPlace,
    recentSearches,
    clearRecentSearches,
    isLoading,
  } = useAutocomplete();

  const [isFocused, setIsFocused] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div id="smart-search-container" ref={containerRef} className="relative w-full max-w-md z-30">
      {/* Search Input Box */}
      <div className="flex items-center w-full h-12 px-4 rounded-full bg-white shadow-lg border border-neutral-100 transition-all focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500">
        <Search className="w-5 h-5 text-neutral-400 shrink-0 mr-3" />
        
        <input
          id="map-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search address, college, hospital, ATM..."
          className="w-full h-full bg-transparent text-sm text-neutral-800 focus:outline-none placeholder-neutral-400"
        />

        {isLoading && (
          <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin shrink-0 ml-2"></div>
        )}

        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("");
              selectPlace(null);
            }}
            className="p-1 hover:bg-neutral-100 rounded-full transition-colors shrink-0 ml-2"
          >
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        )}
      </div>

      {/* Autocomplete & Recents Dropdown */}
      {isFocused && (
        <div className="absolute top-14 left-0 w-full bg-white rounded-2xl shadow-xl border border-neutral-100 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* A. Showing Search Suggestions */}
          {suggestions.length > 0 && (
            <div className="flex flex-col">
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    selectPlace(item);
                    setIsFocused(false);
                  }}
                  className="flex items-start px-4 py-3 hover:bg-neutral-50 text-left transition-colors"
                >
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5 mr-3" />
                  <div className="truncate">
                    <p className="text-sm font-medium text-neutral-800">{item.name}</p>
                    <p className="text-xs text-neutral-400 truncate">{item.address}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* B. Showing Recent Searches when Input is empty */}
          {!searchQuery && recentSearches.length > 0 && (
            <div className="flex flex-col">
              <div className="flex items-center justify-between px-4 pb-1 pt-1.5 border-b border-neutral-100 mb-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Recent Searches
                </span>
                <button
                  onClick={clearRecentSearches}
                  className="text-[10px] text-indigo-500 hover:text-indigo-600 font-semibold"
                >
                  Clear All
                </button>
              </div>
              {recentSearches.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSearchQuery(item);
                    setIsFocused(true);
                  }}
                  className="flex items-center px-4 py-2.5 hover:bg-neutral-50 text-left transition-colors"
                >
                  <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0 mr-3" />
                  <span className="text-xs font-medium text-neutral-700 truncate">{item}</span>
                </button>
              ))}
            </div>
          )}

          {/* C. Empty State inside Suggestions list */}
          {searchQuery && suggestions.length === 0 && !isLoading && (
            <div className="px-4 py-6 text-center">
              <MapPin className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-xs text-neutral-400 font-medium">No locations found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default SearchBar;
