import { apiFetch } from "./apiFetch";
import type { PedidoInput } from "../types/pedido";

const API_URL = "/api/pagos";

export interface CheckoutResponse {
  url: string;
}

export const crearCheckout = async (
  payload: PedidoInput
): Promise<CheckoutResponse> => {
  return apiFetch<CheckoutResponse>(`${API_URL}/checkout`, {
    method: "POST",
    auth: true,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
};
