import L from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import type { GeoStop } from "../utils/tsp";

function wazeUrl(lat: number, lng: number): string {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
}

function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

interface RouteMapProps {
  stops: GeoStop[];
  route?: GeoStop[];
  routeGeometry?: [number, number][];
  activeStopId?: number;
  height?: string;
}

export function RouteMap({
  stops,
  route,
  routeGeometry,
  activeStopId,
  height = "400px"
}: RouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const safeStops = useMemo(
    () =>
      stops.filter(
        (stop) => Number.isFinite(stop.lat) && Number.isFinite(stop.lng)
      ),
    [stops]
  );

  const safeRoute = useMemo(
    () =>
      (route ?? safeStops).filter(
        (stop) => Number.isFinite(stop.lat) && Number.isFinite(stop.lng)
      ),
    [route, safeStops]
  );

  const routeLine = safeRoute.length > 0 ? safeRoute : safeStops;
  const safeRouteGeometry = useMemo(
    () =>
      (routeGeometry ?? []).filter(
        ([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng)
      ),
    [routeGeometry]
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }
    if (safeStops.length === 0) {
      return;
    }

    const initialCenter: [number, number] = [safeStops[0].lat, safeStops[0].lng];
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: true,
      fadeAnimation: false,
      zoomAnimation: false,
      markerZoomAnimation: false,
    }).setView(initialCenter, 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapRef.current = map;
    layerGroupRef.current = L.layerGroup().addTo(map);

    return () => {
      layerGroupRef.current?.clearLayers();
      layerGroupRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [safeStops]);

  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) {
      return;
    }

    layerGroup.clearLayers();

    if (safeRouteGeometry.length > 1) {
      L.polyline(safeRouteGeometry, {
        color: "#2563eb",
        weight: 4,
        opacity: 0.8,
      }).addTo(layerGroup);
    } else if (routeLine.length > 1) {
      const latLngs = routeLine.map((s) => [s.lat, s.lng] as [number, number]);
      L.polyline(latLngs, {
        color: "#2563eb",
        weight: 4,
        opacity: 0.8,
      }).addTo(layerGroup);
    }

    routeLine.forEach((stop, index) => {
      const isActive = stop.id === activeStopId;
      const color = isActive ? "#0f172a" : stop.prioritario ? "#f59e0b" : "#2563eb";

      const marker = L.circleMarker([stop.lat, stop.lng], {
        radius: isActive ? 9 : 7,
        color,
        fillColor: color,
        fillOpacity: 0.9,
        weight: 2,
      }).addTo(layerGroup);

      const popup = `
        <div class="map-popup">
          <strong class="map-popup__title">Parada ${index + 1}${stop.prioritario ? " ⚡" : ""}</strong>
          <p class="map-popup__address">${stop.label}</p>
          ${stop.subLabel ? `<p class="map-popup__meta">${stop.subLabel}</p>` : ""}
          <div class="map-popup__nav">
            <a href="${wazeUrl(stop.lat, stop.lng)}" target="_blank" rel="noopener noreferrer" class="map-popup__nav-btn map-popup__nav-btn--waze">Waze</a>
            <a href="${googleMapsUrl(stop.lat, stop.lng)}" target="_blank" rel="noopener noreferrer" class="map-popup__nav-btn map-popup__nav-btn--gmaps">Google Maps</a>
          </div>
        </div>`;

      marker.bindPopup(popup);
    });

    const bounds = L.latLngBounds(routeLine.map((s) => [s.lat, s.lng] as [number, number]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
    }

    // Needed when parent layout changes size after render.
    window.requestAnimationFrame(() => map.invalidateSize());
  }, [routeLine, safeRouteGeometry, activeStopId]);

  if (safeStops.length === 0) {
    return (
      <div className="map-hint" style={{ height }}>
        No hay coordenadas validas para mostrar en el mapa.
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      style={{
        height,
        width: "100%",
        borderRadius: "0.75rem",
        overflow: "hidden",
        border: "1px solid rgba(15, 23, 42, 0.08)",
      }}
    />
  );
}
