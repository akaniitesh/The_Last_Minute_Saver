import React, { useEffect, useRef, useContext } from "react";
import L from "leaflet";
import { SmartMapContext } from "../context/SmartMapContext";
import { TILE_URLS } from "../utils/constants";

export const MapCanvas: React.FC = () => {
  const context = useContext(SmartMapContext);
  if (!context) return null;

  const {
    currentLocation,
    selectedPlace,
    routeInfo,
    isNavigating,
    navigationState,
    savedPlaces,
    mapConfig,
    setSelectedPlace,
  } = context;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  
  // Keep track of layers to clean them up cleanly
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  // 1. Inject Leaflet CSS dynamically if not present
  useEffect(() => {
    if (typeof document === "undefined") return;
    const linkId = "leaflet-stylesheet-cdn";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
  }, []);

  // 2. Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([currentLocation.lat, currentLocation.lng], mapConfig.zoom);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Map click handler to geocode and select any place
    map.on("click", async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      
      // Basic reverse-geocode info representation on click
      setSelectedPlace({
        id: `clicked_${Math.random().toString(36).substring(2, 6)}`,
        name: `Dropped Pin`,
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        lat,
        lng,
      });
    });

    mapInstanceRef.current = map;
    markerGroupRef.current = L.layerGroup().addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 3. Tile Layer Sync (Light / Dark theme switching)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileUrl = mapConfig.isDarkMode ? TILE_URLS.dark : TILE_URLS.light;
    const tileLayer = L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);
    tileLayerRef.current = tileLayer;
  }, [mapConfig.isDarkMode]);

  // 4. Center & Zoom Synchronization
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setView([mapConfig.center.lat, mapConfig.center.lng], mapConfig.zoom);
  }, [mapConfig.center, mapConfig.zoom]);

  // 5. Markers & Route Synced Layers Rendering
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markerGroup = markerGroupRef.current;
    if (!map || !markerGroup) return;

    // Clear previous markers
    markerGroup.clearLayers();

    // A. Current Location Marker
    const locationIcon = L.divIcon({
      className: "custom-location-icon",
      html: `
        <div class="relative flex items-center justify-center w-5 h-5">
          <div class="absolute w-full h-full rounded-full bg-blue-500 opacity-40 animate-ping"></div>
          <div class="w-3.5 h-3.5 rounded-full bg-blue-600 border border-white shadow-md"></div>
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    // If navigating, show simulation vehicle, otherwise regular dot
    const locCoords = isNavigating && navigationState.currentCoords
      ? navigationState.currentCoords
      : currentLocation;

    const navIcon = L.divIcon({
      className: "custom-nav-icon",
      html: `
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white shadow-xl border-2 border-white transform transition-all animate-bounce">
          🚗
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    L.marker([locCoords.lat, locCoords.lng], {
      icon: isNavigating ? navIcon : locationIcon,
    }).addTo(markerGroup);

    // B. Destination / Selected Place Marker
    if (selectedPlace) {
      const destIcon = L.divIcon({
        className: "custom-dest-icon",
        html: `
          <div class="flex items-center justify-center w-7 h-7 rounded-full bg-rose-500 text-white shadow-lg border border-white">
            📍
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker([selectedPlace.lat, selectedPlace.lng], { icon: destIcon })
        .addTo(markerGroup)
        .bindPopup(`<b>${selectedPlace.name}</b><br/>${selectedPlace.address}`)
        .openPopup();
    }

    // C. Render Saved Places as subtle map indicators
    savedPlaces.forEach((sp) => {
      // Don't draw if it's currently selected as destination (avoid overlap)
      if (selectedPlace && Math.abs(selectedPlace.lat - sp.lat) < 0.0001 && Math.abs(selectedPlace.lng - sp.lng) < 0.0001) {
        return;
      }

      const spIcon = L.divIcon({
        className: "custom-sp-icon",
        html: `
          <div class="flex items-center justify-center w-6 h-6 rounded-full bg-neutral-100 hover:bg-white text-xs shadow-md border border-neutral-300 transition-transform hover:scale-110">
            📍
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker([sp.lat, sp.lng], { icon: spIcon })
        .addTo(markerGroup)
        .bindPopup(`<b>${sp.name}</b>`);
    });

    // D. Draw Route Polyline
    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    if (routeInfo && routeInfo.points.length > 0) {
      const latLngs = routeInfo.points.map((p) => [p.lat, p.lng] as L.LatLngTuple);
      const routeLine = L.polyline(latLngs, {
        color: "#4f46e5", // Indigo-600
        weight: 5,
        opacity: 0.85,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      routeLineRef.current = routeLine;

      // Fit map view to path coordinates comfortably
      if (!isNavigating) {
        map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
      }
    }
  }, [currentLocation, selectedPlace, savedPlaces, routeInfo, isNavigating, navigationState.currentCoords]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-neutral-100">
      <div id="map-canvas-div" ref={mapContainerRef} className="w-full h-full z-10" />
    </div>
  );
};
export default MapCanvas;
