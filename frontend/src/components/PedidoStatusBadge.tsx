import type { EstadoPedido } from "../types/pedido";
import { ESTADO_LABELS, ESTADO_TONE_CLASS } from "../utils/pedidoPresentation";

interface PedidoStatusBadgeProps {
  estado: EstadoPedido;
}

export const PedidoStatusBadge = ({ estado }: PedidoStatusBadgeProps) => (
  <span className={`status-badge ${ESTADO_TONE_CLASS[estado]}`}>
    {ESTADO_LABELS[estado]}
  </span>
);
