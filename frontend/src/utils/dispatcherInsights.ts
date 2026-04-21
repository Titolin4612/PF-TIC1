import type { EstadoPedido, Pedido } from "../types/pedido";
import { formatZona, getRepartidorLabel, sortPedidosByUrgency } from "./pedidoPresentation";

export interface PedidoMetrics {
  total: number;
  creados: number;
  enPreparacion: number;
  enCamino: number;
  entregados: number;
  cancelados: number;
  pendientes: number;
  prioritarios: number;
  fragiles: number;
  contraEntrega: number;
}

export interface ZoneSummary {
  zona: string;
  total: number;
  pendientes: number;
  enCamino: number;
  prioritarios: number;
  fragiles: number;
  sinAsignar: number;
}

export interface CourierSummary {
  repartidorEmail: string | null;
  label: string;
  total: number;
  pendientes: number;
  enCamino: number;
  entregados: number;
  prioritarios: number;
  zonas: number;
}

const countByEstado = (pedidos: Pedido[], estado: EstadoPedido) =>
  pedidos.filter((pedido) => pedido.estado === estado).length;

export const getPedidoMetrics = (pedidos: Pedido[]): PedidoMetrics => {
  const creados = countByEstado(pedidos, "CREADO");
  const enPreparacion = countByEstado(pedidos, "EN_PREPARACION");
  const enCamino = countByEstado(pedidos, "EN_CAMINO");
  const entregados = countByEstado(pedidos, "ENTREGADO");
  const cancelados = countByEstado(pedidos, "CANCELADO");

  return {
    total: pedidos.length,
    creados,
    enPreparacion,
    enCamino,
    entregados,
    cancelados,
    pendientes: creados + enPreparacion,
    prioritarios: pedidos.filter((pedido) => pedido.prioritario).length,
    fragiles: pedidos.filter((pedido) => pedido.fragil).length,
    contraEntrega: pedidos.filter((pedido) => pedido.tipoCobro === "CONTRA_ENTREGA").length,
  };
};

export const getPedidosNeedingAttention = (pedidos: Pedido[]): Pedido[] =>
  sortPedidosByUrgency(
    pedidos.filter(
      (pedido) => pedido.estado !== "ENTREGADO" && pedido.estado !== "CANCELADO"
    )
  );

export const getRecentPedidos = (pedidos: Pedido[]): Pedido[] =>
  [...pedidos].sort((left, right) => {
    const leftDate = Date.parse(left.fechaCreacion);
    const rightDate = Date.parse(right.fechaCreacion);

    if (Number.isNaN(leftDate) || Number.isNaN(rightDate)) {
      return right.id - left.id;
    }

    return rightDate - leftDate;
  });

export const getUnassignedPedidos = (pedidos: Pedido[]): Pedido[] =>
  getPedidosNeedingAttention(pedidos).filter((pedido) => !pedido.repartidorEmail);

export const getPedidosReadyForDispatch = (pedidos: Pedido[]): Pedido[] =>
  getPedidosNeedingAttention(pedidos).filter(
    (pedido) =>
      Boolean(pedido.repartidorEmail) &&
      (pedido.estado === "CREADO" || pedido.estado === "EN_PREPARACION")
  );

export const getZoneSummaries = (pedidos: Pedido[]): ZoneSummary[] => {
  const zoneMap = new Map<string, ZoneSummary>();

  pedidos.forEach((pedido) => {
    const zona = formatZona(pedido.zona);
    const current = zoneMap.get(zona) ?? {
      zona,
      total: 0,
      pendientes: 0,
      enCamino: 0,
      prioritarios: 0,
      fragiles: 0,
      sinAsignar: 0,
    };

    current.total += 1;

    if (pedido.estado === "CREADO" || pedido.estado === "EN_PREPARACION") {
      current.pendientes += 1;
    }

    if (pedido.estado === "EN_CAMINO") {
      current.enCamino += 1;
    }

    if (pedido.prioritario) {
      current.prioritarios += 1;
    }

    if (pedido.fragil) {
      current.fragiles += 1;
    }

    if (!pedido.repartidorEmail) {
      current.sinAsignar += 1;
    }

    zoneMap.set(zona, current);
  });

  return [...zoneMap.values()].sort((left, right) => {
    return (
      right.prioritarios - left.prioritarios ||
      right.pendientes - left.pendientes ||
      right.sinAsignar - left.sinAsignar ||
      right.total - left.total ||
      left.zona.localeCompare(right.zona)
    );
  });
};

export const getCourierSummaries = (pedidos: Pedido[]): CourierSummary[] => {
  const courierMap = new Map<string, CourierSummary>();

  pedidos.forEach((pedido) => {
    const key = pedido.repartidorEmail ?? "__UNASSIGNED__";
    const current = courierMap.get(key) ?? {
      repartidorEmail: pedido.repartidorEmail,
      label: getRepartidorLabel(pedido.repartidorEmail),
      total: 0,
      pendientes: 0,
      enCamino: 0,
      entregados: 0,
      prioritarios: 0,
      zonas: 0,
    };

    current.total += 1;

    if (pedido.estado === "CREADO" || pedido.estado === "EN_PREPARACION") {
      current.pendientes += 1;
    }

    if (pedido.estado === "EN_CAMINO") {
      current.enCamino += 1;
    }

    if (pedido.estado === "ENTREGADO") {
      current.entregados += 1;
    }

    if (pedido.prioritario) {
      current.prioritarios += 1;
    }

    courierMap.set(key, current);
  });

  return [...courierMap.values()]
    .map((summary) => {
      const zonas = new Set(
        pedidos
          .filter((pedido) => pedido.repartidorEmail === summary.repartidorEmail)
          .map((pedido) => formatZona(pedido.zona))
      ).size;

      return {
        ...summary,
        zonas,
      };
    })
    .sort((left, right) => {
      if (left.repartidorEmail === null && right.repartidorEmail !== null) {
        return -1;
      }

      if (left.repartidorEmail !== null && right.repartidorEmail === null) {
        return 1;
      }

      return (
        right.pendientes - left.pendientes ||
        right.enCamino - left.enCamino ||
        right.prioritarios - left.prioritarios ||
        right.total - left.total ||
        left.label.localeCompare(right.label)
      );
    });
};
