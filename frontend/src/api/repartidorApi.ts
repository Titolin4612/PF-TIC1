import { apiFetch } from "./apiFetch";
import type { Repartidor, RepartidorOperacionInput } from "../types/repartidor";

const API_URL = "/api/repartidores";

export const obtenerRepartidores = (): Promise<Repartidor[]> =>
  apiFetch<Repartidor[]>(API_URL, {
    auth: true,
    skipAuthResetOn401: true,
  });

export const actualizarOperacionRepartidor = (
  email: string,
  payload: RepartidorOperacionInput
): Promise<Repartidor> =>
  apiFetch<Repartidor>(`${API_URL}/${encodeURIComponent(email)}/operacion`, {
    method: "PATCH",
    auth: true,
    skipAuthResetOn401: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
