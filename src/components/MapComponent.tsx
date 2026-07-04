import { useEffect, useRef } from "react";
import { Issue } from "../types";

interface MapComponentProps {
  issues: Issue[];
  onViewIssue: (id: string) => void;
}

export default function MapComponent({ issues, onViewIssue }: MapComponentProps) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const L = (window as any).L;

  useEffect(() => {
    if (!containerRef.current || !L) return;

    // Destroy existing map if any
    if (mapRef.current) {
      try {
        mapRef.current.remove();
      } catch (e) {
        console.error("Error removing map:", e);
      }
      mapRef.current = null;
    }

    try {
      // Centered around Madurai center (9.9252, 78.1198)
      const map = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([9.9252, 78.1198], 13);
      mapRef.current = map;

      // Beautiful light map tile layer (Voyager by CARTO)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 20,
      }).addTo(map);

      // Color mapper for priority markers
      const getMarkerColor = (level: string) => {
        if (level === "Critical") return "#ef4444"; // Red
        if (level === "High") return "#f97316";     // Orange
        if (level === "Medium") return "#eab308";   // Yellow
        return "#22c55e";                           // Green
      };

      // Add circle markers
      issues.forEach((issue) => {
        if (!issue.latitude || !issue.longitude) return;

        const color = getMarkerColor(issue.priority_level);

        const marker = L.circleMarker([issue.latitude, issue.longitude], {
          radius: 10,
          fillColor: color,
          color: "#ffffff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85,
        }).addTo(map);

        const popupContainer = document.createElement("div");
        popupContainer.className = "p-1 font-sans text-xs w-48";
        popupContainer.innerHTML = `
          <div style="margin-bottom: 6px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; margin-bottom: 2px;">
              <span style="font-weight: 700; font-size: 13px; color: #0f172a;">${issue.category}</span>
              <span style="
                font-size: 9px;
                font-weight: 700;
                padding: 1px 5px;
                border-radius: 4px;
                background-color: ${color}20;
                color: ${color};
                border: 1px solid ${color}40;
              ">${issue.priority_level.toUpperCase()}</span>
            </div>
            <p style="font-weight: 500; color: #64748b; font-size: 10px; margin: 0;">${issue.location}</p>
          </div>
          <p style="color: #334155; font-size: 11px; margin: 0 0 8px 0; line-height: 1.3;">
            ${issue.translated_summary.substring(0, 80)}${issue.translated_summary.length > 80 ? "..." : ""}
          </p>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; font-size: 9px; color: #64748b;">
            <span>Affected: <strong>${issue.people_affected}</strong></span>
            <span>Reports: <strong>${issue.duplicate_count}</strong></span>
          </div>
          <button id="view-btn-${issue.id}" style="
            width: 100%;
            padding: 5px 0;
            background-color: #1e3a8a;
            color: #ffffff;
            font-weight: 600;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            text-align: center;
            font-size: 10px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          ">
            View Issue File
          </button>
        `;

        marker.bindPopup(popupContainer, {
          closeButton: true,
          offset: [0, -5],
        });

        // Set up click handler inside the popup
        marker.on("popupopen", () => {
          const btn = document.getElementById(`view-btn-${issue.id}`);
          if (btn) {
            btn.onclick = (e) => {
              e.preventDefault();
              onViewIssue(issue.id);
            };
          }
        });
      });
    } catch (e) {
      console.error("Error drawing map layers:", e);
    }

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          console.error("Error cleanup map:", e);
        }
        mapRef.current = null;
      }
    };
  }, [issues, onViewIssue, L]);

  return (
    <div className="relative w-full h-full min-h-[480px] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200/80 shadow-md">
      {!L && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-500 z-10 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
          <span className="font-semibold text-sm tracking-wide">Loading Leaflet Georeference System...</span>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full min-h-[480px] z-0" />
    </div>
  );
}
