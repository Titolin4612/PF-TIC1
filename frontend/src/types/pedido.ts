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
  clienteEmail: string | null;
  repartidorEmail: string | null;
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

export interface PedidoUpdateInput {
  direccionEntrega: string;
  estado: EstadoPedido;
  zona: string;
  peso: number;
  tamano: TipoTamano;
  fragil: boolean;
  tipoCobro: TipoCobro;
  prioritario: boolean;
  clienteEmail: string | null;
  repartidorEmail: string | null;
}
