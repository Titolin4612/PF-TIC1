import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { useEffect, useRef } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { GeoStop } from "../utils/tsp";

// Fix Leaflet default icon paths broken by Vite bundling
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const activeIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [30, 46],
  iconAnchor: [15, 46],
  popupAnchor: [1, -38],
  className: "marker-active",
});

const priorityIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: "marker-priority",
});

function FitBounds({ stops }: { stops: GeoStop[] }) {
  const map = useMap();
  const prevLen = useRef(0);

  useEffect(() => {
    if (!stops.length || stops.length === prevLen.current) return;
    prevLen.current = stops.length;

    if (stops.length === 1) {
      map.setView([stops[0].lat, stops[0].lng], 15);
      return;
    }

    const bounds = L.latLngBounds(stops.map((s) => [s.lat, s.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [stops, map]);

  return null;
}

function wazeUrl(lat: number, lng: number): string {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
}

function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

interface RouteMapProps {
  stops: GeoStop[];
  route?: GeoStop[];
  activeStopId?: number;
  height?: string;
}

export function RouteMap({
  stops,
  route,
  activeStopId,
  height = "400px",
}: RouteMapProps) {
  const center: [number, number] =
    stops.length > 0 ? [stops[0].lat, stops[0].lng] : [6.2442, -75.5812];

  const routeLine = route ?? stops;

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height, width: "100%", borderRadius: "0.75rem" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds stops={stops} />

      {routeLine.length > 1 && (
        <Polyline
          positions={routeLine.map((s) => [s.lat, s.lng])}
          pathOptions={{ color: "#3b82f6", weight: 3, dashArray: "6 4" }}
        />
      )}

      {stops.map((stop, index) => {
        const isActive = stop.id === activeStopId;
        const icon = isActive ? activeIcon : stop.prioritario ? priorityIcon : undefined;
        const stopNumber = route
          ? route.findIndex((s) => s.id === stop.id) + 1
          : index + 1;

        return (
          <Marker key={stop.id} position={[stop.lat, stop.lng]} icon={icon}>
            <Popup>
              <div className="map-popup">
                <strong className="map-popup__title">
                  Parada {stopNumber}{stop.prioritario ? " ⚡" : ""}
                </strong>
                <p className="map-popup__address">{stop.label}</p>
                {stop.subLabel && (
                  <p className="map-popup__meta">{stop.subLabel}</p>
                )}
                <div className="map-popup__nav">
                  <a
                    href={wazeUrl(stop.lat, stop.lng)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="map-popup__nav-btn map-popup__nav-btn--waze"
                  >
                    Waze
                  </a>
                  <a
                    href={googleMapsUrl(stop.lat, stop.lng)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="map-popup__nav-btn map-popup__nav-btn--gmaps"
                  >
                    Google Maps
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
