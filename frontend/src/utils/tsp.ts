export interface GeoStop {
  id: number;
  lat: number;
  lng: number;
  label: string;
  subLabel?: string;
  prioritario?: boolean;
}

function haversineKm(a: GeoStop, b: GeoStop): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/**
 * Nearest-neighbor TSP heuristic.
 * Prioritarios always go first, then nearest unvisited.
 */
export function nearestNeighborTSP(stops: GeoStop[]): GeoStop[] {
  if (stops.length <= 1) return [...stops];

  const prioritarios = stops.filter((s) => s.prioritario);
  const normales = stops.filter((s) => !s.prioritario);

  const ordered = [...prioritarios, ...normales];
  const unvisited = ordered.slice(1);
  const route: GeoStop[] = [ordered[0]];

  while (unvisited.length > 0) {
    const current = route[route.length - 1];
    let nearestIdx = 0;
    let nearestDist = haversineKm(current, unvisited[0]);

    for (let i = 1; i < unvisited.length; i++) {
      const d = haversineKm(current, unvisited[i]);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }

    route.push(unvisited.splice(nearestIdx, 1)[0]);
  }

  return route;
}

export function totalDistanceKm(stops: GeoStop[]): number {
  let total = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    total += haversineKm(stops[i], stops[i + 1]);
  }
  return Math.round(total * 10) / 10;
}
