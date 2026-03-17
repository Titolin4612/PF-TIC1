export type EstadoPedido =
  | "CREADO"
  | "EN_PREPARACION"
  | "EN_CAMINO"
  | "ENTREGADO"
  | "CANCELADO";

export interface Pedido {
  id: number;
  direccionEntrega: string;
  estado: EstadoPedido;
  fechaCreacion: string;
}

export interface PedidoInput {
  direccionEntrega: string;
  estado: EstadoPedido;
}

const API_URL = "http://localhost:8080/api/pedidos";

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Error en la solicitud");
  }
  if (response.status === 204) return null;
  return response.json();
};

export const obtenerPedidos = async (): Promise<Pedido[]> => {
  const response = await fetch(API_URL);
  return handleResponse(response);
};

export const crearPedido = async (pedido: PedidoInput): Promise<Pedido> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pedido),
  });

  return handleResponse(response);
};

export const actualizarEstado = async (
  id: number,
  estado: EstadoPedido
): Promise<Pedido> => {
  const url = `${API_URL}/${id}/estado?estado=${estado}`;
  const response = await fetch(url, {
    method: "PUT",
  });

  return handleResponse(response);
};

export const eliminarPedido = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  await handleResponse(response);
};
