export type EstadoPedido =
  | "CREADO"
  | "EN_PREPARACION"
  | "EN_CAMINO"
  | "ENTREGADO"
  | "CANCELADO";

export type TipoTamano = "PEQUENO" | "MEDIANO" | "GRANDE";

export type TipoCobro = "CONTRA_ENTREGA" | "WEB" | "PAGO_WEB";
export type EstadoPago = "PENDIENTE" | "PAGADO" | "FALLIDO";
export type TipoVehiculo = "MOTO" | "CAMION";

export interface RutaVehiculoParada {
  id: number;
  lat: number;
  lng: number;
  label: string;
  subLabel?: string | null;
  prioritario: boolean;
  peso?: number | null;
  fragil?: boolean | null;
  tiempoEstimadoMinutos?: number | null;
}

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
  costoDomicilio?: number | null;
  estadoPago?: EstadoPago | null;
  clienteEmail: string | null;
  repartidorEmail: string | null;
  fechaAsignacion?: string | null;
  fechaEntrega?: string | null;
  tiempoEstimadoMinutos?: number | null;
  alertaRetraso?: boolean | null;
  motivoAlerta?: string | null;
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
  tiempoEstimadoMinutos?: number | null;
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

export interface RutaVehiculoPedido {
  vehiculo: string;
  tipo: TipoVehiculo;
  repartidor: string | null;
  capacidadMaxima: number;
  capacidadKg: number;
  cargaKg: number;
  pedidosAsignados: Pedido[];
  paradas?: RutaVehiculoParada[];
  routeGeometry?: [number, number][];
  distanciaEstimada: number;
}

export interface RutasOptimizadasPedido {
  base: string;
  rutas: RutaVehiculoPedido[];
}
