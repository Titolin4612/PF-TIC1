import type { EstadoPedido, Pedido } from "../types/pedido";

export interface DriverEstadoAction {
  estado: EstadoPedido;
  label: string;
  helper: string;
  tone: "primary" | "danger";
}

export const DRIVER_STATUS_FLOW: EstadoPedido[] = [
  "CREADO",
  "EN_PREPARACION",
  "EN_CAMINO",
  "ENTREGADO",
];

const TERMINAL_ESTADOS: EstadoPedido[] = ["ENTREGADO", "CANCELADO"];

const STATUS_SCORE: Record<EstadoPedido, number> = {
  EN_CAMINO: 400,
  EN_PREPARACION: 280,
  CREADO: 220,
  ENTREGADO: 80,
  CANCELADO: 0,
};

const getPedidoTimestamp = (pedido: Pedido): number => {
  const parsed = Date.parse(pedido.fechaCreacion);
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
};

export const isDriverTerminalEstado = (estado: EstadoPedido): boolean =>
  TERMINAL_ESTADOS.includes(estado);

export const isDriverActionablePedido = (pedido: Pedido): boolean =>
  !isDriverTerminalEstado(pedido.estado);

export const sortDriverPedidos = (pedidos: Pedido[]): Pedido[] =>
  [...pedidos].sort((left, right) => {
    const leftScore =
      STATUS_SCORE[left.estado] +
      (left.prioritario ? 60 : 0) +
      (left.fragil ? 10 : 0) +
      (left.tipoCobro === "CONTRA_ENTREGA" ? 8 : 0);
    const rightScore =
      STATUS_SCORE[right.estado] +
      (right.prioritario ? 60 : 0) +
      (right.fragil ? 10 : 0) +
      (right.tipoCobro === "CONTRA_ENTREGA" ? 8 : 0);

    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    const timeDifference = getPedidoTimestamp(left) - getPedidoTimestamp(right);

    if (timeDifference !== 0) {
      return timeDifference;
    }

    return left.id - right.id;
  });

export const getDriverPrimaryPedido = (pedidos: Pedido[]): Pedido | null => {
  const sortedPedidos = sortDriverPedidos(pedidos);
  return sortedPedidos.find(isDriverActionablePedido) ?? sortedPedidos[0] ?? null;
};

export const getDriverActionLabel = (pedido: Pedido): string => {
  switch (pedido.estado) {
    case "CREADO":
      return "Confirmar salida";
    case "EN_PREPARACION":
      return "Salir a entrega";
    case "EN_CAMINO":
      return "Marcar entregado";
    case "ENTREGADO":
      return "Entrega cerrada";
    case "CANCELADO":
      return "Entrega cancelada";
  }
};

export const getDriverActionCopy = (pedido: Pedido): string => {
  switch (pedido.estado) {
    case "CREADO":
      return "Confirma que tomas este pedido para moverlo al frente de tu jornada.";
    case "EN_PREPARACION":
      return "Todo apunta a salida. Marca el inicio cuando tomes camino hacia la entrega.";
    case "EN_CAMINO":
      return "La entrega ya va en curso. Confirma el cierre apenas completes la parada.";
    case "ENTREGADO":
      return "Este pedido ya quedo cerrado y no requiere mas acciones operativas.";
    case "CANCELADO":
      return "La entrega se cerro como cancelada y sale de tu frente activo.";
  }
};

export const getDriverPriorityMessage = (pedido: Pedido): string => {
  if (pedido.estado === "EN_CAMINO" && pedido.prioritario) {
    return "Entrega en curso con prioridad alta.";
  }

  if (pedido.estado === "EN_CAMINO") {
    return "Entrega activa en calle.";
  }

  if (pedido.prioritario && pedido.fragil) {
    return "Prioridad alta y manejo delicado.";
  }

  if (pedido.prioritario) {
    return "Muevela al frente del turno.";
  }

  if (pedido.fragil) {
    return "Requiere cuidado durante la entrega.";
  }

  if (pedido.tipoCobro === "CONTRA_ENTREGA") {
    return "Recuerda el cobro contra entrega.";
  }

  return "Entrega programada en tu cola activa.";
};

export const getDriverAllowedEstadoActions = (pedido: Pedido): DriverEstadoAction[] => {
  switch (pedido.estado) {
    case "CREADO":
      return [
        {
          estado: "EN_PREPARACION",
          label: "Confirmar salida",
          helper: "Indica que ya tomaste este pedido para prepararlo.",
          tone: "primary",
        },
        {
          estado: "CANCELADO",
          label: "Cancelar entrega",
          helper: "Usalo solo si esta entrega ya no va a continuar en este turno.",
          tone: "danger",
        },
      ];
    case "EN_PREPARACION":
      return [
        {
          estado: "EN_CAMINO",
          label: "Salir a entrega",
          helper: "Marca que ya iniciaste el recorrido de esta entrega.",
          tone: "primary",
        },
        {
          estado: "CANCELADO",
          label: "Cancelar entrega",
          helper: "Usalo solo si esta entrega ya no va a continuar en este turno.",
          tone: "danger",
        },
      ];
    case "EN_CAMINO":
      return [
        {
          estado: "ENTREGADO",
          label: "Marcar entregado",
          helper: "Cierra la parada actual cuando completes la entrega.",
          tone: "primary",
        },
        {
          estado: "CANCELADO",
          label: "Cancelar entrega",
          helper: "Usalo solo si el pedido no pudo completarse y debe cerrarse hoy.",
          tone: "danger",
        },
      ];
    case "ENTREGADO":
    case "CANCELADO":
      return [];
  }
};

export const getDriverSuccessMessage = (estado: EstadoPedido): string => {
  switch (estado) {
    case "CREADO":
      return "La entrega volvio a estado creado.";
    case "EN_PREPARACION":
      return "La entrega quedo lista para salir.";
    case "EN_CAMINO":
      return "La entrega ya quedo en camino.";
    case "ENTREGADO":
      return "La entrega se marco como completada.";
    case "CANCELADO":
      return "La entrega se marco como cancelada.";
  }
};
