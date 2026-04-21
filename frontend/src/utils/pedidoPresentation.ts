import type { EstadoPedido, Pedido, TipoCobro, TipoTamano } from "../types/pedido";

export const ESTADO_OPTIONS: EstadoPedido[] = [
  "CREADO",
  "EN_PREPARACION",
  "EN_CAMINO",
  "ENTREGADO",
  "CANCELADO",
];

export const ESTADO_LABELS: Record<EstadoPedido, string> = {
  CREADO: "Creado",
  EN_PREPARACION: "En preparacion",
  EN_CAMINO: "En camino",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export const ESTADO_TONE_CLASS: Record<EstadoPedido, string> = {
  CREADO: "status-neutral",
  EN_PREPARACION: "status-info",
  EN_CAMINO: "status-warning",
  ENTREGADO: "status-success",
  CANCELADO: "status-danger",
};

export const TAMANO_LABELS: Record<TipoTamano, string> = {
  PEQUENO: "Pequeno",
  MEDIANO: "Mediano",
  GRANDE: "Grande",
};

export const TIPO_COBRO_LABELS: Record<TipoCobro, string> = {
  CONTRA_ENTREGA: "Contra entrega",
  WEB: "Web",
  PAGO_WEB: "Pago web",
};

export const formatDateTime = (value: string): string => {
  const parsed = Date.parse(value);

  if (Number.isNaN(parsed)) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
};

export const formatBoolean = (value: boolean): string => (value ? "Si" : "No");

export const getPriorityLabel = (value: boolean): string => (value ? "Alta" : "Normal");

export const getPriorityHelper = (pedido: Pedido): string => {
  if (pedido.prioritario && pedido.fragil) {
    return "Alta prioridad y manejo delicado";
  }

  if (pedido.prioritario) {
    return "Alta prioridad";
  }

  if (pedido.fragil) {
    return "Requiere cuidado";
  }

  return "Atencion estandar";
};

export const getClienteLabel = (clienteEmail: string | null): string =>
  clienteEmail?.trim() ? clienteEmail : "Cliente sin correo";

export const getRepartidorLabel = (repartidorEmail: string | null): string =>
  repartidorEmail?.trim() ? repartidorEmail : "Sin asignar";

export const formatZona = (value: string): string => {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : "Sin zona";
};

export const getDispatcherActionLabel = (pedido: Pedido): string => {
  if (!pedido.repartidorEmail && pedido.estado !== "ENTREGADO" && pedido.estado !== "CANCELADO") {
    return "Asignar reparto";
  }

  switch (pedido.estado) {
    case "CREADO":
      return "Preparar salida";
    case "EN_PREPARACION":
      return "Coordinar despacho";
    case "EN_CAMINO":
      return "Hacer seguimiento";
    case "ENTREGADO":
      return "Entrega completada";
    case "CANCELADO":
      return "Pedido cerrado";
  }
};

export const sortPedidosByUrgency = (pedidos: Pedido[]): Pedido[] =>
  [...pedidos].sort((left, right) => {
    const leftPriorityScore = Number(left.prioritario) * 10;
    const rightPriorityScore = Number(right.prioritario) * 10;
    const statusWeight = (pedido: Pedido) => {
      switch (pedido.estado) {
        case "CREADO":
          return 4;
        case "EN_PREPARACION":
          return 3;
        case "EN_CAMINO":
          return 2;
        case "ENTREGADO":
          return 1;
        case "CANCELADO":
          return 0;
      }
    };

    return (
      rightPriorityScore +
      statusWeight(right) -
      (leftPriorityScore + statusWeight(left)) ||
      right.id - left.id
    );
  });
