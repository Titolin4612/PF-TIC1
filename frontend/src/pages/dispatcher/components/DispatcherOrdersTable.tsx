import { PedidoStatusBadge } from "../../../components/PedidoStatusBadge";
import { APP_ROUTES } from "../../../router/paths";
import type { EstadoPedido, Pedido } from "../../../types/pedido";
import {
  ESTADO_LABELS,
  ESTADO_OPTIONS,
  TIPO_COBRO_LABELS,
  formatDateTime,
  formatZona,
  getClienteLabel,
  getDispatcherActionLabel,
  getPriorityHelper,
  getPriorityLabel,
  getRepartidorLabel,
} from "../../../utils/pedidoPresentation";
import { DispatcherEmptyState } from "./DispatcherEmptyState";

interface DispatcherOrdersTableProps {
  pedidos: Pedido[];
  totalPedidos: number;
  hasActiveFilters: boolean;
  loading: boolean;
  selectedPedidoId: number | null;
  rowAction: string | null;
  onSelectPedido: (pedido: Pedido) => void;
  onUpdateStatus: (id: number, estado: EstadoPedido) => void;
  onResetFilters: () => void;
}

export const DispatcherOrdersTable = ({
  pedidos,
  totalPedidos,
  hasActiveFilters,
  loading,
  selectedPedidoId,
  rowAction,
  onSelectPedido,
  onUpdateStatus,
  onResetFilters,
}: DispatcherOrdersTableProps) => {
  if (loading) {
    return (
      <div className="skeleton-table">
        <div className="skeleton-row" />
        <div className="skeleton-row" />
        <div className="skeleton-row" />
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <DispatcherEmptyState
        title={
          totalPedidos === 0
            ? "Sin pedidos para gestionar"
            : "Sin resultados con los filtros actuales"
        }
        body={
          totalPedidos === 0
            ? "La mesa centraliza cambios de estado, asignacion por correo y retiro de pedidos del turno."
            : "Limpia la busqueda o ajusta estado, zona y reparto para recuperar la vista completa."
        }
        highlights={
          totalPedidos === 0
            ? [
                "Cada fila concentra cliente, reparto, prioridad y siguiente paso.",
                "El panel lateral permite asignar o reasignar el pedido sin salir del listado.",
              ]
            : [
                "La vista completa vuelve al limpiar filtros.",
                "Los frentes con prioridad o sin reparto quedan visibles al recuperar el listado.",
              ]
        }
        actions={
          totalPedidos === 0
            ? [
                { label: "Ver dashboard", to: APP_ROUTES.dispatcherDashboard },
                { label: "Ir a rutas", to: APP_ROUTES.dispatcherRoutes, tone: "primary" },
              ]
            : hasActiveFilters
              ? [{ label: "Limpiar filtros", onClick: onResetFilters, tone: "primary" }]
              : []
        }
      />
    );
  }

  return (
    <div className="table-wrapper">
      <table className="table orders-table">
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Cliente</th>
            <th>Zona</th>
            <th>Reparto</th>
            <th>Estado</th>
            <th className="is-optional">Prioridad</th>
            <th>Siguiente paso</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((pedido) => (
            <tr
              key={pedido.id}
              className={pedido.id === selectedPedidoId ? "table-row--selected" : undefined}
            >
              <td>
                <div className="table-cell">
                  <p className="table-cell__primary">{pedido.direccionEntrega}</p>
                  <p className="table-cell__secondary">
                    #{pedido.id} - {formatDateTime(pedido.fechaCreacion)}
                  </p>
                </div>
              </td>
              <td>
                <div className="table-cell">
                  <p className="table-cell__primary">{getClienteLabel(pedido.clienteEmail)}</p>
                  <p className="table-cell__secondary">
                    {TIPO_COBRO_LABELS[pedido.tipoCobro]}
                  </p>
                </div>
              </td>
              <td>{formatZona(pedido.zona)}</td>
              <td>
                <div className="table-cell">
                  <span
                    className={
                      pedido.repartidorEmail ? "info-pill" : "info-pill info-pill--muted"
                    }
                  >
                    {getRepartidorLabel(pedido.repartidorEmail)}
                  </span>
                  <p className="table-cell__secondary">
                    {pedido.repartidorEmail ? "Reparto asignado" : "Pendiente de reparto"}
                  </p>
                </div>
              </td>
              <td>
                <div className="table-cell">
                  <PedidoStatusBadge estado={pedido.estado} />
                  <p className="table-cell__secondary">{ESTADO_LABELS[pedido.estado]}</p>
                </div>
              </td>
              <td className="is-optional">
                <div className="table-cell">
                  <span
                    className={
                      pedido.prioritario
                        ? "info-pill info-pill--accent"
                        : "info-pill info-pill--muted"
                    }
                  >
                    {getPriorityLabel(pedido.prioritario)}
                  </span>
                  <p className="table-cell__secondary">{getPriorityHelper(pedido)}</p>
                </div>
              </td>
              <td>
                <div className="table-cell">
                  <p className="table-cell__primary">{getDispatcherActionLabel(pedido)}</p>
                  <p className="table-cell__secondary">
                    {pedido.repartidorEmail
                      ? "Disponible desde el panel lateral"
                      : "Requiere asignacion de reparto"}
                  </p>
                </div>
              </td>
              <td className="actions">
                <select
                  className="input-inline"
                  value={pedido.estado}
                  onChange={(event) =>
                    onUpdateStatus(pedido.id, event.target.value as EstadoPedido)
                  }
                  disabled={rowAction === `estado-${pedido.id}`}
                >
                  {ESTADO_OPTIONS.map((estado) => (
                    <option key={estado} value={estado}>
                      {ESTADO_LABELS[estado]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={pedido.id === selectedPedidoId ? "button ghost" : "button"}
                  onClick={() => onSelectPedido(pedido)}
                >
                  {pedido.id === selectedPedidoId ? "En foco" : "Gestionar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
