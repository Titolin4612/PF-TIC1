import { apiFetch } from "./apiFetch";
import type { GeoStop } from "../utils/tsp";

export interface RouteOptimizationResponse {
  stops: GeoStop[];
  totalDistanceKm: number;
  routeGeometry: [number, number][] | null;
}

export const optimizeRoute = (stops: GeoStop[]): Promise<RouteOptimizationResponse> =>
  apiFetch<RouteOptimizationResponse>("/api/routes/optimize", {
    method: "POST",
    auth: true,
    skipAuthResetOn401: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(stops),
  });
