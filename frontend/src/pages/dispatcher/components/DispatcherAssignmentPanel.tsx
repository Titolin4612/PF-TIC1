import type { ChangeEvent, FormEvent } from "react";
import { PedidoStatusBadge } from "../../../components/PedidoStatusBadge";
import type { Pedido } from "../../../types/pedido";
import {
  TAMANO_LABELS,
  TIPO_COBRO_LABELS,
  formatBoolean,
  formatDateTime,
  formatZona,
  getClienteLabel,
  getDispatcherActionLabel,
  getPriorityLabel,
  getRepartidorLabel,
} from "../../../utils/pedidoPresentation";
import { DispatcherEmptyState } from "./DispatcherEmptyState";

interface DispatcherAssignmentPanelProps {
  selectedPedido: Pedido | null;
  assignmentEmail: string;
  hasPedidos: boolean;
  hasActiveFilters: boolean;
  submitting: boolean;
  deleting: boolean;
  onAssignmentEmailChange: (value: string) => void;
  onSubmitAssignment: () => void;
  onDeletePedido: () => void;
  onResetFilters: () => void;
}

export const DispatcherAssignmentPanel = ({
  selectedPedido,
  assignmentEmail,
  hasPedidos,
  hasActiveFilters,
  submitting,
  deleting,
  onAssignmentEmailChange,
  onSubmitAssignment,
  onDeletePedido,
  onResetFilters,
}: DispatcherAssignmentPanelProps) => {
  if (!selectedPedido) {
    return (
      <article className="card dispatcher-panel create-card">
        <div className="card__header">
          <div>
            <p className="eyebrow">Pedido en foco</p>
            <h2>Selecciona un pedido</h2>
          </div>
        </div>

        {!hasPedidos ? (
          <DispatcherEmptyState
            compact
            title="Sin pedidos en gestion"
            body="Este panel concentra asignacion por correo, reasignacion y retiro de pedidos del turno."
          />
        ) : hasActiveFilters ? (
          <DispatcherEmptyState
            compact
            title="Sin pedido visible en la vista actual"
            body="Limpia los filtros para recuperar el listado completo y abrir un frente de trabajo."
            actions={[{ label: "Limpiar filtros", onClick: onResetFilters }]}
          />
        ) : (
          <DispatcherEmptyState
            compact
            title="Selecciona una fila del listado"
            body="La ficha lateral resume cliente, zona, reparto y acciones rapidas para el pedido activo."
          />
        )}
      </article>
    );
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmitAssignment();
  };

  const handleDelete = () => {
    const shouldDelete = window.confirm(
      `Se retirara el pedido #${selectedPedido.id}. Deseas continuar?`
    );

    if (shouldDelete) {
      onDeletePedido();
    }
  };

  return (
    <article className="card dispatcher-panel create-card">
      <div className="card__header card__header--split">
        <div>
          <p className="eyebrow">Pedido en foco</p>
          <h2>#{selectedPedido.id}</h2>
        </div>
        <PedidoStatusBadge estado={selectedPedido.estado} />
      </div>

      <div className="data-note panel-note">
        <p className="eyebrow">Siguiente movimiento</p>
        <strong>{getDispatcherActionLabel(selectedPedido)}</strong>
        <span>
          {selectedPedido.repartidorEmail
            ? "Puedes ajustar el reparto, actualizar el estado o retirar el pedido desde esta ficha."
            : "Asigna un repartidor para liberar este frente y continuar con la salida."}
        </span>
      </div>

      <div className="detail-list">
        <div className="detail-list__item">
          <span className="detail-list__label">Direccion</span>
          <span className="detail-list__value">{selectedPedido.direccionEntrega}</span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">Cliente</span>
          <span className="detail-list__value">
            {getClienteLabel(selectedPedido.clienteEmail)}
          </span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">Zona</span>
          <span className="detail-list__value">{formatZona(selectedPedido.zona)}</span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">Reparto actual</span>
          <span className="detail-list__value">
            {getRepartidorLabel(selectedPedido.repartidorEmail)}
          </span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">Formato</span>
          <span className="detail-list__value">
            {TAMANO_LABELS[selectedPedido.tamano]} - {selectedPedido.peso} kg
          </span>
        </div>
        <div className="detail-list__item">
          <span className="detail-list__label">Fecha</span>
          <span className="detail-list__value">{formatDateTime(selectedPedido.fechaCreacion)}</span>
        </div>
      </div>

      <div className="panel-tags">
        <span className="info-pill">{TIPO_COBRO_LABELS[selectedPedido.tipoCobro]}</span>
        <span
          className={
            selectedPedido.prioritario
              ? "info-pill info-pill--accent"
              : "info-pill info-pill--muted"
          }
        >
          Prioridad {getPriorityLabel(selectedPedido.prioritario)}
        </span>
        <span className="info-pill info-pill--muted">
          Fragil {formatBoolean(selectedPedido.fragil)}
        </span>
      </div>

      <form className="assignment-form" onSubmit={handleSubmit}>
        <div className="form__row">
          <label htmlFor="assignment-email">Correo del repartidor</label>
          <input
            id="assignment-email"
            type="email"
            value={assignmentEmail}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onAssignmentEmailChange(event.target.value)
            }
            placeholder="repartidor@empresa.com"
            required
          />
        </div>

        <div className="panel-actions">
          <button type="submit" className="button primary block" disabled={submitting}>
            {submitting
              ? "Guardando..."
              : selectedPedido.repartidorEmail
                ? "Reasignar pedido"
                : "Asignar pedido"}
          </button>
          <button
            type="button"
            className="button danger block"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Retirando..." : "Retirar pedido"}
          </button>
        </div>
      </form>
    </article>
  );
};
