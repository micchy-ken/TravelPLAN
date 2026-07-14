import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { TimelineItem, Spot } from "../types";

interface LeafletMapProps {
  items?: TimelineItem[];
  spots?: Spot[];
  activeId?: string | null;
  height?: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  items = [],
  spots = [],
  activeId = null,
  height = "320px",
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);

  // Helper to create beautiful Tailwind-based custom div icons
  const createMarkerIcon = (label: string, category: string, isActive: boolean) => {
    let colorClass = "bg-indigo-600 text-white ring-4 ring-indigo-100";
    if (label === "S") {
      colorClass = "bg-emerald-600 text-white ring-4 ring-emerald-100 font-bold scale-115";
    } else if (label === "G") {
      colorClass = "bg-rose-600 text-white ring-4 ring-rose-100 font-bold scale-115";
    } else if (category === "食事") {
      colorClass = "bg-amber-500 text-white ring-4 ring-amber-100";
    } else if (category === "温泉") {
      colorClass = "bg-cyan-500 text-white ring-4 ring-cyan-100";
    } else if (category === "宿泊") {
      colorClass = "bg-purple-600 text-white ring-4 ring-purple-100";
    } else if (category === "移動") {
      colorClass = "bg-sky-500 text-white ring-4 ring-sky-100";
    }

    if (isActive) {
      colorClass += " ring-indigo-400 scale-125 z-50 shadow-lg";
    }

    return L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          ${isActive || label === "S" ? `<span class="absolute w-10 h-10 bg-indigo-400/20 rounded-full animate-ping pointer-events-none"></span>` : ""}
          <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border border-white shadow-md transition-all duration-200 ${colorClass}">
            ${label}
          </div>
        </div>
      `,
      className: "custom-leaflet-icon",
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    });
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // 1. Initialize Map if not already initialized
    if (!mapInstanceRef.current) {
      // Default center (Japan Hakon/Mt Fuji area or Tokyo if nothing provided)
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([35.6812, 139.7671], 10);

      // Add elegant light-themed tile layer (CartoDB Positron is extremely elegant and professional)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    // 2. Clear previous markers & polylines
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    // 3. Collect valid coordinates
    const locations: { lat: number; lng: number; label: string; name: string; category: string; description: string; isActive: boolean }[] = [];

    if (spots && spots.length > 0) {
      // Renders recommended spots selection
      spots.forEach((spot, idx) => {
        if (typeof spot.lat === "number" && typeof spot.lng === "number") {
          locations.push({
            lat: spot.lat,
            lng: spot.lng,
            label: String(idx + 1),
            name: spot.name,
            category: spot.category,
            description: spot.description,
            isActive: activeId === spot.id,
          });
        }
      });
    } else if (items && items.length > 0) {
      // Renders itinerary timeline route
      items.forEach((item, idx) => {
        if (typeof item.lat === "number" && typeof item.lng === "number") {
          const isFirst = idx === 0;
          const isLast = idx === items.length - 1;
          const label = isFirst ? "S" : isLast ? "G" : String(idx + 1);
          locations.push({
            lat: item.lat,
            lng: item.lng,
            label,
            name: item.activity,
            category: item.category,
            description: item.memo || item.location || "",
            isActive: activeId === `${item.time}-${item.activity}`,
          });
        }
      });
    }

    // 4. Plot Markers
    const latLngs: L.LatLngTuple[] = [];
    locations.forEach((loc) => {
      const marker = L.marker([loc.lat, loc.lng], {
        icon: createMarkerIcon(loc.label, loc.category, loc.isActive),
      }).addTo(map);

      // Elegant Popup markup
      const popupContent = `
        <div class="p-2.5 font-sans max-w-[200px]">
          <div class="flex items-center gap-1.5 mb-1.5">
            <span class="px-1.5 py-0.5 text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md">
              ${loc.category}
            </span>
            <span class="text-xs font-bold text-slate-800">${loc.name}</span>
          </div>
          <p class="text-[10px] text-slate-500 font-medium leading-relaxed m-0">
            ${loc.description}
          </p>
        </div>
      `;

      marker.bindPopup(popupContent, { closeButton: false });
      
      if (loc.isActive) {
        marker.openPopup();
      }

      markersRef.current.push(marker);
      latLngs.push([loc.lat, loc.lng]);
    });

    // 5. Plot Route Polyline
    if (latLngs.length > 1) {
      const polyline = L.polyline(latLngs, {
        color: "#4f46e5",
        weight: 3.5,
        dashArray: "6, 6",
        opacity: 0.8,
      }).addTo(map);
      polylineRef.current = polyline;
    }

    // 6. Auto-zoom map to fit all bounds
    if (latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }

    // Handle container resize nicely
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [items, spots, activeId]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: "200px" }} />
      
      {/* Small aesthetic corner element for Leaflet credits */}
      <div className="absolute bottom-1 right-2 bg-white/70 backdrop-blur-xs px-2 py-0.5 rounded-md text-[8px] font-bold text-slate-400 z-500 pointer-events-none">
        Leaflet | OSM Voyager
      </div>
    </div>
  );
};
