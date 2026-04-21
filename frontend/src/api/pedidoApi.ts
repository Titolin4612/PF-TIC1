import { apiFetch } from "./apiFetch";
import type {
  EstadoPedido,
  Pedido,
  PedidoInput,
  PedidoUpdateInput,
} from "../types/pedido";

export type {
  EstadoPedido,
  Pedido,
  PedidoInput,
  PedidoUpdateInput,
  TipoCobro,
  TipoTamano,
} from "../types/pedido";

const API_URL = "/api/pedidos";

export const obtenerPedidos = async (): Promise<Pedido[]> => {
  return apiFetch<Pedido[]>(API_URL, { auth: true });
};

export const obtenerPedido = async (id: number): Promise<Pedido> => {
  return apiFetch<Pedido>(`${API_URL}/${id}`, { auth: true });
};

export const crearPedido = async (pedido: PedidoInput): Promise<Pedido> => {
  return apiFetch<Pedido>(API_URL, {
    method: "POST",
    auth: true,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pedido),
  });
};

export const actualizarEstado = async (
  id: number,
  estado: EstadoPedido
): Promise<Pedido> => {
  return apiFetch<Pedido>(`${API_URL}/${id}/estado?estado=${estado}`, {
    method: "PUT",
    auth: true,
  });
};

export const asignarRepartidor = async (
  id: number,
  repartidorEmail: string
): Promise<Pedido> => {
  const encodedEmail = encodeURIComponent(repartidorEmail.trim());

  return apiFetch<Pedido>(`${API_URL}/${id}/asignar?repartidorEmail=${encodedEmail}`, {
    method: "PUT",
    auth: true,
  });
};

export const actualizarPedido = async (
  id: number,
  pedido: PedidoUpdateInput
): Promise<Pedido> => {
  return apiFetch<Pedido>(`${API_URL}/${id}`, {
    method: "PUT",
    auth: true,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pedido),
  });
};

export const eliminarPedido = async (id: number): Promise<void> => {
  await apiFetch<void>(`${API_URL}/${id}`, {
    method: "DELETE",
    auth: true,
    parseAs: "void",
  });
};
