import React, { useState, useContext } from "react";
import { SmartMapContext } from "../context/SmartMapContext";
import { useSavedPlaces } from "../hooks/useSavedPlaces";
import { PlaceCategory, SavedPlace } from "../types/map";
import { CATEGORIES } from "../utils/constants";
import { Plus, Trash, MapPin, X } from "lucide-react";

export const SavedPlaces: React.FC = () => {
  const context = useContext(SmartMapContext);
  if (!context) return null;

  const { setSelectedPlace } = context;
  const { savedPlaces, savePlace, removePlace } = useSavedPlaces();

  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [category, setCategory] = useState<PlaceCategory>("custom");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address) return;

    // Use input coordinates or generate slightly random offset near central NYC if left blank
    const finalLat = lat ? parseFloat(lat) : 40.7128 + (Math.random() - 0.5) * 0.05;
    const finalLng = lng ? parseFloat(lng) : -74.0060 + (Math.random() - 0.5) * 0.05;

    savePlace(name, address, finalLat, finalLng, category);
    
    // Reset state
    setName("");
    setAddress("");
    setLat("");
    setLng("");
    setCategory("custom");
    setIsAdding(false);
  };

  const handleSelectPlace = (place: SavedPlace) => {
    setSelectedPlace({
      id: place.id,
      name: place.name,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      category: place.category,
    });
  };

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-neutral-100 shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
          Saved Places
        </h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center justify-center p-1 hover:bg-neutral-50 rounded-full text-indigo-500 transition-colors"
          title="Add saved place"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {/* A. Adding Saved Location Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-3 bg-neutral-50 rounded-xl border border-neutral-100/50">
          <input
            type="text"
            placeholder="Place Name (e.g. My Cafe)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-2.5 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-800 focus:outline-none focus:border-indigo-500"
          />
          <input
            type="text"
            placeholder="Address/Details"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            className="w-full px-2.5 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-800 focus:outline-none focus:border-indigo-500"
          />
          <div className="grid grid-cols-2 gap-1.5">
            <input
              type="number"
              step="any"
              placeholder="Latitude (Optional)"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-800 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude (Optional)"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap gap-1 my-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`px-2 py-1 text-[10px] rounded-full border transition-all ${
                  category === cat.id
                    ? "bg-indigo-50 text-indigo-600 border-indigo-200 font-semibold"
                    : "bg-white text-neutral-500 border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                {cat.emoji} {cat.name}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="w-full py-1.5 mt-1 text-xs text-white bg-indigo-600 hover:bg-indigo-700 font-semibold rounded-lg transition-colors"
          >
            Save Location
          </button>
        </form>
      )}

      {/* B. Saved Places Listing */}
      <div className="flex flex-col space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
        {savedPlaces.map((place) => {
          const categoryMeta = CATEGORIES.find((c) => c.id === place.category) || CATEGORIES[6];

          return (
            <div
              key={place.id}
              className="group flex items-center justify-between p-2 hover:bg-neutral-50 rounded-xl transition-all"
            >
              <button
                onClick={() => handleSelectPlace(place)}
                className="flex items-center text-left truncate grow mr-2"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-100 shrink-0 text-base mr-3">
                  {categoryMeta.emoji}
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-neutral-700 group-hover:text-indigo-600 transition-colors">
                    {place.name}
                  </p>
                  <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                    {place.address}
                  </p>
                </div>
              </button>

              <button
                onClick={() => removePlace(place.id)}
                className="p-1 hover:bg-red-50 text-neutral-400 hover:text-red-500 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                title="Delete saved place"
              >
                <Trash className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default SavedPlaces;
