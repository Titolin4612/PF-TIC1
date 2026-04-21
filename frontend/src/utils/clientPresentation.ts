import type { Pedido } from "../types/pedido";
import {
  ESTADO_LABELS,
  TIPO_COBRO_LABELS,
  TAMANO_LABELS,
  formatDateTime,
  formatZona,
  getPriorityLabel,
} from "./pedidoPresentation";

export const CLIENT_STATUS_FLOW = [
  "CREADO",
  "EN_PREPARACION",
  "EN_CAMINO",
  "ENTREGADO",
] as const;

export const getClientPrimaryPedido = (pedidos: Pedido[]): Pedido | null => {
  const sorted = [...pedidos].sort((left, right) => {
    const statusWeight = (pedido: Pedido) => {
      switch (pedido.estado) {
        case "EN_CAMINO":
          return 4;
        case "EN_PREPARACION":
          return 3;
        case "CREADO":
          return 2;
        case "ENTREGADO":
          return 1;
        case "CANCELADO":
          return 0;
      }
    };

    return (
      statusWeight(right) - statusWeight(left) ||
      Number(right.prioritario) - Number(left.prioritario) ||
      right.id - left.id
    );
  });

  return sorted[0] ?? null;
};

export const getClientHeadline = (pedido: Pedido): string => {
  switch (pedido.estado) {
    case "CREADO":
      return "Tu pedido fue registrado correctamente.";
    case "EN_PREPARACION":
      return "Tu pedido se esta preparando para salir.";
    case "EN_CAMINO":
      return "Tu pedido ya va en camino.";
    case "ENTREGADO":
      return "Tu pedido fue entregado.";
    case "CANCELADO":
      return "Tu pedido fue cancelado.";
  }
};

export const getClientSupportCopy = (pedido: Pedido): string => {
  switch (pedido.estado) {
    case "CREADO":
      return "Aun no ha salido a reparto. Cuando avance, aqui veras el siguiente cambio.";
    case "EN_PREPARACION":
      return "El pedido ya entro en proceso operativo y pronto pasara a entrega.";
    case "EN_CAMINO":
      return "Tu pedido se encuentra en recorrido hacia la direccion registrada.";
    case "ENTREGADO":
      return "La entrega ya fue cerrada exitosamente en el sistema.";
    case "CANCELADO":
      return "La entrega no continuara. Si necesitas ayuda, revisa el soporte del pedido.";
  }
};

export const getClientPedidoMeta = (pedido: Pedido) => [
  {
    label: "Estado",
    value: ESTADO_LABELS[pedido.estado],
  },
  {
    label: "Zona",
    value: formatZona(pedido.zona),
  },
  {
    label: "Cobro",
    value: TIPO_COBRO_LABELS[pedido.tipoCobro],
  },
  {
    label: "Tamano",
    value: `${TAMANO_LABELS[pedido.tamano]} - ${pedido.peso} kg`,
  },
  {
    label: "Prioridad",
    value: getPriorityLabel(pedido.prioritario),
  },
  {
    label: "Registro",
    value: formatDateTime(pedido.fechaCreacion),
  },
];

export const getClientSecondaryNote = (pedido: Pedido): string => {
  if (pedido.estado === "EN_CAMINO" && pedido.repartidorEmail) {
    return `Repartidor asignado: ${pedido.repartidorEmail}`;
  }

  if (pedido.estado === "EN_CAMINO") {
    return "Ya existe movimiento de entrega en curso.";
  }

  if (pedido.estado === "ENTREGADO") {
    return "No tienes acciones pendientes sobre este pedido.";
  }

  if (pedido.estado === "CANCELADO") {
    return "Este pedido quedo cerrado sin entrega efectiva.";
  }

  if (pedido.repartidorEmail) {
    return `Ya hay un repartidor asignado: ${pedido.repartidorEmail}`;
  }

  return "Aun no hay repartidor asignado en este pedido.";
};
