const CACHE_KEY = "smartroute_geocache_v1";

// Coordenadas aproximadas por zona del area metropolitana de Medellin.
const ZONE_FALLBACK: Record<string, [number, number]> = {
  medellin: [6.2442, -75.5812],
  envigado: [6.1752, -75.5849],
  bello: [6.3367, -75.5577],
  itagui: [6.1849, -75.5993],
  sabaneta: [6.1513, -75.6169],
  caldas: [6.0938, -75.6346],
  copacabana: [6.351, -75.507],
  girardota: [6.3774, -75.4462],
};

// Bounding box aproximado del Valle de Aburra.
const METRO_BOUNDS = {
  minLat: 6.05,
  maxLat: 6.42,
  minLng: -75.72,
  maxLng: -75.45,
};

// Variacion aleatoria pequena para que los marcadores no se solapen.
function jitter(): number {
  return (Math.random() - 0.5) * 0.015;
}

function fallbackByZoneOrCity(address: string): [number, number] | null {
  const lower = address.toLowerCase();
  for (const [key, coords] of Object.entries(ZONE_FALLBACK)) {
    if (lower.includes(key)) {
      return [coords[0] + jitter(), coords[1] + jitter()];
    }
  }
  // If no explicit zone/city is present, keep the stop in the optimization
  // by anchoring it near Medellin.
  const medellin = ZONE_FALLBACK.medellin;
  return [medellin[0] + jitter(), medellin[1] + jitter()];
}

function inMetroBounds(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= METRO_BOUNDS.minLat &&
    lat <= METRO_BOUNDS.maxLat &&
    lng >= METRO_BOUNDS.minLng &&
    lng <= METRO_BOUNDS.maxLng
  );
}

function loadCache(): Map<string, [number, number]> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return new Map();
    return new Map(JSON.parse(raw) as [string, [number, number]][]);
  } catch {
    return new Map();
  }
}

function saveCache(cache: Map<string, [number, number]>): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify([...cache]));
  } catch {}
}

const memCache = loadCache();

export async function geocodeAddress(address: string): Promise<[number, number] | null> {
  const key = address.trim().toLowerCase();
  if (memCache.has(key)) {
    const cached = memCache.get(key)!;
    if (inMetroBounds(cached[0], cached[1])) return cached;
    memCache.delete(key);
    saveCache(memCache);
  }

  try {
    const localQuery = `${address}, Medellin, Antioquia, Colombia`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(localQuery)}&format=json&limit=1&addressdetails=0`;
    const res = await fetch(url, {
      headers: { "User-Agent": "SmartRoute-TIC1/1.0 (university project)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error("bad response");

    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (data.length) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);

      if (inMetroBounds(lat, lng)) {
        const coords: [number, number] = [lat, lng];
        memCache.set(key, coords);
        saveCache(memCache);
        return coords;
      }
    }
  } catch {
    // Nominatim failed: continue with fallback.
  }

  const fallback = fallbackByZoneOrCity(address);
  if (fallback) {
    memCache.set(key, fallback);
    saveCache(memCache);
  }
  return fallback;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function geocodeMany(
  addresses: string[],
  onProgress?: (done: number, total: number) => void
): Promise<Map<string, [number, number]>> {
  const result = new Map<string, [number, number]>();
  const unique = [...new Set(addresses.map((a) => a.trim()).filter(Boolean))];

  for (let i = 0; i < unique.length; i++) {
    const address = unique[i];
    const cached = memCache.get(address.toLowerCase());

    if (cached && inMetroBounds(cached[0], cached[1])) {
      result.set(address, cached);
      onProgress?.(i + 1, unique.length);
    } else {
      const coords = await geocodeAddress(address);
      if (coords) result.set(address, coords);
      onProgress?.(i + 1, unique.length);
      await sleep(1100);
    }
  }

  return result;
}
