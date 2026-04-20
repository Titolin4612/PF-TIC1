import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Pedido } from "../types/pedido";
import { geocodeMany } from "../utils/geocoding";
import type { GeoStop } from "../utils/tsp";

export interface GeocodingState {
  stops: GeoStop[];
  geocoding: boolean;
  progress: number;
  total: number;
}

export function useGeocodedPedidos(pedidos: Pedido[]): GeocodingState {
  const [stops, setStops] = useState<GeoStop[]>([]);
  const [geocoding, setGeocoding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const abortRef = useRef(false);

  // Use a stable key based on IDs so the effect only re-runs when pedidos actually change
  const pedidoKey = useMemo(
    () => pedidos.map((p) => p.id).sort().join(","),
    [pedidos]
  );

  const run = useCallback(async (list: Pedido[]) => {
    if (!list.length) {
      setStops([]);
      setGeocoding(false);
      return;
    }

    abortRef.current = false;
    setGeocoding(true);
    setProgress(0);
    setTotal(list.length);

    const addresses = list.map((p) => p.direccionEntrega);

    const coordMap = await geocodeMany(addresses, (done, tot) => {
      if (!abortRef.current) setProgress(done / tot);
    });

    if (abortRef.current) return;

    const result: GeoStop[] = list
      .filter((p) => coordMap.has(p.direccionEntrega))
      .map((p) => {
        const [lat, lng] = coordMap.get(p.direccionEntrega)!;
        return {
          id: p.id,
          lat,
          lng,
          label: p.direccionEntrega,
          subLabel: `#${p.id} · ${p.zona ?? "Sin zona"}`,
          prioritario: p.prioritario,
        };
      });

    setStops(result);
    setGeocoding(false);
  }, []);

  useEffect(() => {
    void run(pedidos);
    return () => {
      abortRef.current = true;
    };
    // pedidoKey guarantees stable identity — avoids infinite re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoKey, run]);

  return { stops, geocoding, progress, total };
}
