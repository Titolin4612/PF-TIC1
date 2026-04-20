const CACHE_KEY = "smartroute_geocache_v1";

// Coordenadas aproximadas por zona del área metropolitana de Medellín
const ZONE_FALLBACK: Record<string, [number, number]> = {
  medellin:  [6.2442,  -75.5812],
  medellín:  [6.2442,  -75.5812],
  envigado:  [6.1752,  -75.5849],
  bello:     [6.3367,  -75.5577],
  itagui:    [6.1849,  -75.5993],
  itagüi:    [6.1849,  -75.5993],
  sabaneta:  [6.1513,  -75.6169],
  caldas:    [6.0938,  -75.6346],
  copacabana:[6.3510,  -75.5070],
  girardota: [6.3774,  -75.4462],
};

// Variación aleatoria pequeña para que los marcadores no se solapen
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
  return null;
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

export async function geocodeAddress(
  address: string
): Promise<[number, number] | null> {
  const key = address.trim().toLowerCase();
  if (memCache.has(key)) return memCache.get(key)!;

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=0`;
    const res = await fetch(url, {
      headers: { "User-Agent": "SmartRoute-TIC1/1.0 (university project)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error("bad response");
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;

    if (data.length) {
      const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      memCache.set(key, coords);
      saveCache(memCache);
      return coords;
    }
  } catch {
    // Nominatim failed — fall through to zone fallback
  }

  // Fallback: coordenadas por zona/ciudad mencionada en la dirección
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

    if (cached) {
      result.set(address, cached);
      onProgress?.(i + 1, unique.length);
    } else {
      const coords = await geocodeAddress(address);
      if (coords) result.set(address, coords);
      onProgress?.(i + 1, unique.length);
      // Nominatim usage policy: 1 req/s (solo si no era cache)
      await sleep(1100);
    }
  }

  return result;
}
