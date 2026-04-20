const CACHE_KEY = "smartroute_geocache_v1";

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
  } catch {
    // storage might be full — silently skip
  }
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
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;

    const coords: [number, number] = [
      parseFloat(data[0].lat),
      parseFloat(data[0].lon),
    ];
    memCache.set(key, coords);
    saveCache(memCache);
    return coords;
  } catch {
    return null;
  }
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
    } else {
      const coords = await geocodeAddress(address);
      if (coords) result.set(address, coords);
      // Nominatim usage policy: max 1 req/s
      await sleep(1100);
    }

    onProgress?.(i + 1, unique.length);
  }

  return result;
}
