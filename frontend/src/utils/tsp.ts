export interface GeoStop {
  id: number;
  lat: number;
  lng: number;
  label: string;
  subLabel?: string;
  prioritario?: boolean;
  tamano?: "PEQUENO" | "MEDIANO" | "GRANDE";
  peso?: number;
  zona?: string;
}

export type TipoVehiculo = "MOTO" | "CAMION";

export interface RutaVehiculo {
  vehiculo: string;
  tipo: TipoVehiculo;
  repartidor?: string | null;
  capacidadMaxima: number;
  pedidosAsignados: GeoStop[];
  distanciaEstimada: number;
}

export interface RutasOptimizadas {
  base: string;
  rutas: RutaVehiculo[];
}

const BASE_DIRECCION = "Cq. 1 #70-01";
const BASE_STOP: GeoStop = {
  id: 0,
  lat: 6.2442,
  lng: -75.5906,
  label: BASE_DIRECCION,
};

const CAPACIDAD_MOTO = 3;
const CAPACIDAD_CAMION = 10;
const PESO_MAXIMO_MOTO = 5;

const ZONE_COORDS: Record<string, Pick<GeoStop, "lat" | "lng">> = {
  medellin: { lat: 6.2442, lng: -75.5812 },
  itagui: { lat: 6.1849, lng: -75.5993 },
  envigado: { lat: 6.1752, lng: -75.5849 },
  sabaneta: { lat: 6.1513, lng: -75.6169 },
  bello: { lat: 6.3367, lng: -75.5577 },
};

const MEDELLIN_SECTOR_COORDS: Record<string, Pick<GeoStop, "lat" | "lng">> = {
  laureles: { lat: 6.2442, lng: -75.5906 },
  upb: { lat: 6.2442, lng: -75.5906 },
  belen: { lat: 6.2255, lng: -75.5986 },
  poblado: { lat: 6.2088, lng: -75.5672 },
  "el poblado": { lat: 6.2088, lng: -75.5672 },
};

function normalizeZone(zona?: string): string | null {
  if (!zona) return null;

  return zona
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizedStopText(stop: GeoStop): string {
  return `${stop.label} ${stop.subLabel ?? ""} ${stop.zona ?? ""}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function inferMedellinAddressPoint(text: string): Pick<GeoStop, "lat" | "lng"> | null {
  if (/(calle|cl|c)\s*33\b/.test(text) || /(carrera|cra|kr|cr)\s*7[0-6]\b/.test(text)) {
    return MEDELLIN_SECTOR_COORDS.laureles;
  }

  if (/(carrera|cra|kr|cr)\s*43[a-z]?\b/.test(text) || /(calle|cl|c)\s*10\b/.test(text)) {
    return MEDELLIN_SECTOR_COORDS.poblado;
  }

  if (/(calle|cl|c)\s*\d+\s*sur\b/.test(text) || /(carrera|cra|kr|cr)\s*8[0-9]\b/.test(text)) {
    return MEDELLIN_SECTOR_COORDS.belen;
  }

  return null;
}

function routePoint(stop: GeoStop): GeoStop {
  const zone = normalizeZone(stop.zona);
  const inferredMedellinPoint =
    zone === "medellin" ? inferMedellinAddressPoint(normalizedStopText(stop)) : null;

  if (inferredMedellinPoint) {
    return {
      ...stop,
      lat: inferredMedellinPoint.lat,
      lng: inferredMedellinPoint.lng,
    };
  }

  const zoneCoords = zone ? ZONE_COORDS[zone] : undefined;

  if (!zoneCoords) {
    return stop;
  }

  return {
    ...stop,
    lat: zoneCoords.lat,
    lng: zoneCoords.lng,
  };
}

function initialRoutePoint(stop: GeoStop): GeoStop {
  const text = normalizedStopText(stop);
  const inferredMedellinPoint = inferMedellinAddressPoint(text);

  if (inferredMedellinPoint) {
    return {
      ...stop,
      lat: inferredMedellinPoint.lat,
      lng: inferredMedellinPoint.lng,
    };
  }

  const sector = Object.entries(MEDELLIN_SECTOR_COORDS).find(([name]) => text.includes(name));

  if (sector) {
    const [, coords] = sector;
    return {
      ...stop,
      lat: coords.lat,
      lng: coords.lng,
    };
  }

  return routePoint(stop);
}

function distancePoint(stop: GeoStop): GeoStop {
  if (stop.id === BASE_STOP.id && stop.label === BASE_STOP.label) {
    return stop;
  }

  const zone = normalizeZone(stop.zona);
  const zoneCoords = zone ? ZONE_COORDS[zone] : undefined;
  const hasValidCoordinates = Number.isFinite(stop.lat) && Number.isFinite(stop.lng);

  if (hasValidCoordinates && (!zoneCoords || !samePoint(stop, zoneCoords))) {
    return stop;
  }

  if (!zoneCoords) {
    return stop;
  }

  const offset = deterministicOffset(`${stop.label}-${stop.id}`);
  return {
    ...stop,
    lat: zoneCoords.lat + offset.lat,
    lng: zoneCoords.lng + offset.lng,
  };
}

function samePoint(a: Pick<GeoStop, "lat" | "lng">, b: Pick<GeoStop, "lat" | "lng">): boolean {
  return Math.abs(a.lat - b.lat) < 0.0001 && Math.abs(a.lng - b.lng) < 0.0001;
}

function deterministicOffset(seed: string): Pick<GeoStop, "lat" | "lng"> {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  const angle = ((hash % 360) * Math.PI) / 180;
  const radius = 0.006 + ((hash % 1000) / 1000) * 0.018;

  return {
    lat: Math.cos(angle) * radius,
    lng: Math.sin(angle) * radius,
  };
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

function nearestNeighborFromBase(stops: GeoStop[]): GeoStop[] {
  const unvisited = [...stops];
  const route: GeoStop[] = [];
  let current = BASE_STOP;

  while (unvisited.length > 0) {
    const fromBase = route.length === 0;
    let nearestIdx = 0;
    let nearestDist = haversineKm(
      routePoint(current),
      fromBase ? initialRoutePoint(unvisited[0]) : routePoint(unvisited[0])
    );

    for (let i = 1; i < unvisited.length; i++) {
      const d = haversineKm(
        routePoint(current),
        fromBase ? initialRoutePoint(unvisited[i]) : routePoint(unvisited[i])
      );
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }

    const [next] = unvisited.splice(nearestIdx, 1);
    route.push(next);
    current = next;
  }

  return route;
}

export function optimizeMultiVehicleRoutes(stops: GeoStop[]): RutasOptimizadas {
  const prioritarios = stops.filter((stop) => stop.prioritario).sort((a, b) => a.id - b.id);
  const noPrioritarios = stops.filter((stop) => !stop.prioritario).sort((a, b) => a.id - b.id);

  const motos: RutaVehiculo[] = [];
  const camiones: RutaVehiculo[] = [];

  prioritarios.forEach((stop) => {
    if (canGoOnMoto(stop)) {
      assignStop(motos, "MOTO", CAPACIDAD_MOTO, stop);
    } else {
      assignStop(camiones, "CAMION", CAPACIDAD_CAMION, stop);
    }
  });

  noPrioritarios.forEach((stop) => {
    if (mustGoOnTruck(stop) || !assignToExistingMoto(motos, stop)) {
      assignStop(camiones, "CAMION", CAPACIDAD_CAMION, stop);
    }
  });

  const rutas = [...motos, ...camiones].map((ruta) => {
    const pedidosAsignados = nearestNeighborFromBase(ruta.pedidosAsignados);
    return {
      ...ruta,
      pedidosAsignados,
      distanciaEstimada: totalDistanceFromBaseKm(pedidosAsignados),
    };
  });

  return {
    base: BASE_DIRECCION,
    rutas,
  };
}

function assignStop(
  rutas: RutaVehiculo[],
  tipo: TipoVehiculo,
  capacidadMaxima: number,
  stop: GeoStop
): void {
  const route =
    rutas.find((item) => item.pedidosAsignados.length < item.capacidadMaxima) ??
    createRoute(rutas, tipo, capacidadMaxima);

  route.pedidosAsignados.push(stop);
}

function assignToExistingMoto(rutas: RutaVehiculo[], stop: GeoStop): boolean {
  if (!canGoOnMoto(stop)) {
    return false;
  }

  const route = rutas.find((item) => item.pedidosAsignados.length < item.capacidadMaxima);
  if (!route) {
    return false;
  }

  route.pedidosAsignados.push(stop);
  return true;
}

function createRoute(
  rutas: RutaVehiculo[],
  tipo: TipoVehiculo,
  capacidadMaxima: number
): RutaVehiculo {
  const route: RutaVehiculo = {
    vehiculo: `${tipo}-${rutas.length + 1}`,
    tipo,
    repartidor: null,
    capacidadMaxima,
    pedidosAsignados: [],
    distanciaEstimada: 0,
  };
  rutas.push(route);
  return route;
}

function canGoOnMoto(stop: GeoStop): boolean {
  return stop.tamano === "PEQUENO" && typeof stop.peso === "number" && stop.peso <= PESO_MAXIMO_MOTO;
}

function mustGoOnTruck(stop: GeoStop): boolean {
  return (
    stop.tamano === "MEDIANO" ||
    stop.tamano === "GRANDE" ||
    typeof stop.peso !== "number" ||
    stop.peso > PESO_MAXIMO_MOTO
  );
}

export function totalDistanceKm(stops: GeoStop[]): number {
  let total = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    total += haversineKm(distancePoint(stops[i]), distancePoint(stops[i + 1]));
  }
  return Math.round(total * 10) / 10;
}

export function totalDistanceFromBaseKm(stops: GeoStop[]): number {
  return totalDistanceKm([BASE_STOP, ...stops]);
}
