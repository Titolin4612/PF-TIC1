export type EstadoPedido =
  | "CREADO"
  | "EN_PREPARACION"
  | "EN_CAMINO"
  | "ENTREGADO"
  | "CANCELADO";

export type TipoTamano = "PEQUENO" | "MEDIANO" | "GRANDE";

export type TipoCobro = "CONTRA_ENTREGA" | "WEB";

export interface Pedido {
  id: number;
  direccionEntrega: string;
  estado: EstadoPedido;
  fechaCreacion: string;
  zona: string;
  peso: number;
  tamano: TipoTamano;
  fragil: boolean;
  tipoCobro: TipoCobro;
  prioritario: boolean;
}

export interface PedidoInput {
  direccionEntrega: string;
  estado: EstadoPedido;
  zona: string;
  peso: number;
  tamano: TipoTamano;
  fragil: boolean;
  tipoCobro: TipoCobro;
  prioritario: boolean;
}

const API_URL = "http://localhost:8080/api/pedidos";

type BackendError = {
  mensaje?: string;
  message?: string;
  error?: string;
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (response.ok) {
    return response.json() as Promise<T>;
  }

  let backendMessage = "Error en la solicitud";
  try {
    const data = (await response.json()) as BackendError;
    backendMessage =
      data.mensaje || data.message || data.error || `Error HTTP ${response.status}`;
  } catch {
    const rawText = await response.text();
    backendMessage = rawText || `Error HTTP ${response.status}`;
  }

  throw new Error(backendMessage);
};

export const obtenerPedidos = async (): Promise<Pedido[]> => {
  const response = await fetch(API_URL);
  return handleResponse<Pedido[]>(response);
};

export const crearPedido = async (pedido: PedidoInput): Promise<Pedido> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pedido),
  });

  return handleResponse<Pedido>(response);
};

export const actualizarEstado = async (
  id: number,
  estado: EstadoPedido
): Promise<Pedido> => {
  const response = await fetch(`${API_URL}/${id}/estado?estado=${estado}`, {
    method: "PUT",
  });
  return handleResponse<Pedido>(response);
};

export const eliminarPedido = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  if (!response.ok) {
    await handleResponse<unknown>(response);
  }
};
