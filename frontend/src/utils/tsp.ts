export interface GeoStop {
  id: number;
  lat: number;
  lng: number;
  label: string;
  subLabel?: string;
  prioritario?: boolean;
  peso?: number | null;
  fragil?: boolean | null;
  tiempoEstimadoMinutos?: number | null;
  tamano?: "PEQUENO" | "MEDIANO" | "GRANDE";
  zona?: string | null;
}

export type TipoVehiculo = "MOTO" | "CAMION";

export interface RutaVehiculo {
  vehiculo: string;
  tipo: TipoVehiculo;
  repartidor?: string | null;
  capacidadMaxima: number;
  capacidadKg?: number | null;
  cargaKg?: number | null;
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
const CAPACIDAD_KG_MOTO = 25;
const CAPACIDAD_KG_CAMION = 120;
const PESO_MAXIMO_MOTO = 5;

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

export function totalDistanceFromBaseKm(stops: GeoStop[]): number {
  return totalDistanceKm([BASE_STOP, ...stops]);
}

export function optimizeMultiVehicleRoutes(stops: GeoStop[]): RutasOptimizadas {
  const prioritarios = stops.filter((stop) => stop.prioritario).sort((a, b) => a.id - b.id);
  const normales = stops.filter((stop) => !stop.prioritario).sort((a, b) => a.id - b.id);

  const motos: RutaVehiculo[] = [];
  const camiones: RutaVehiculo[] = [];

  prioritarios.forEach((stop) => {
    if (canGoOnMoto(stop)) {
      assignStop(motos, "MOTO", CAPACIDAD_MOTO, CAPACIDAD_KG_MOTO, stop);
    } else {
      assignStop(camiones, "CAMION", CAPACIDAD_CAMION, CAPACIDAD_KG_CAMION, stop);
    }
  });

  normales.forEach((stop) => {
    if (mustGoOnTruck(stop) || !assignToExistingMoto(motos, stop)) {
      assignStop(camiones, "CAMION", CAPACIDAD_CAMION, CAPACIDAD_KG_CAMION, stop);
    }
  });

  const rutas = [...motos, ...camiones].map((ruta) => {
    const pedidosAsignados = nearestNeighborTSP(ruta.pedidosAsignados);
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
  capacidadKg: number,
  stop: GeoStop
): void {
  const route =
    rutas.find((item) => hasCapacityFor(item, stop)) ??
    createRoute(rutas, tipo, capacidadMaxima, capacidadKg);

  route.pedidosAsignados.push(stop);
  route.cargaKg = (route.cargaKg ?? 0) + (stop.peso ?? 0);
}

function assignToExistingMoto(rutas: RutaVehiculo[], stop: GeoStop): boolean {
  if (!canGoOnMoto(stop)) {
    return false;
  }

  const route = rutas.find((item) => hasCapacityFor(item, stop));
  if (!route) {
    return false;
  }

  route.pedidosAsignados.push(stop);
  route.cargaKg = (route.cargaKg ?? 0) + (stop.peso ?? 0);
  return true;
}

function createRoute(
  rutas: RutaVehiculo[],
  tipo: TipoVehiculo,
  capacidadMaxima: number,
  capacidadKg: number
): RutaVehiculo {
  const route: RutaVehiculo = {
    vehiculo: `${tipo}-${rutas.length + 1}`,
    tipo,
    repartidor: null,
    capacidadMaxima,
    capacidadKg,
    cargaKg: 0,
    pedidosAsignados: [],
    distanciaEstimada: 0,
  };
  rutas.push(route);
  return route;
}

function hasCapacityFor(route: RutaVehiculo, stop: GeoStop): boolean {
  return (
    route.pedidosAsignados.length < route.capacidadMaxima &&
    (route.cargaKg ?? 0) + (stop.peso ?? 0) <= (route.capacidadKg ?? Number.POSITIVE_INFINITY)
  );
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
