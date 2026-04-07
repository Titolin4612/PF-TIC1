import { useState, type ChangeEvent, type FormEvent } from "react";
import { PedidoStatusBadge } from "../../../components/PedidoStatusBadge";
import type { Pedido, PedidoInput, TipoCobro, TipoTamano } from "../../../types/pedido";
import {
  ESTADO_LABELS,
  ESTADO_OPTIONS,
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

const ZONA_OPTIONS = ["Medellin", "Envigado", "Bello", "Itagui"] as const;

interface DispatcherCreateFormState {
  direccionEntrega: string;
  estado: PedidoInput["estado"];
  zona: string;
  peso: string;
  tamano: TipoTamano;
  fragil: boolean;
  tipoCobro: TipoCobro;
  prioritario: boolean;
}

const INITIAL_CREATE_FORM: DispatcherCreateFormState = {
  direccionEntrega: "",
  estado: "CREADO",
  zona: "Medellin",
  peso: "",
  tamano: "PEQUENO",
  fragil: false,
  tipoCobro: "WEB",
  prioritario: false,
};

interface DispatcherAssignmentPanelProps {
  isCreating: boolean;
  sticky?: boolean;
  selectedPedido: Pedido | null;
  assignmentEmail: string;
  hasPedidos: boolean;
  hasActiveFilters: boolean;
  creating: boolean;
  submitting: boolean;
  deleting: boolean;
  onCreatePedido: (pedido: PedidoInput) => Promise<Pedido | null>;
  onAssignmentEmailChange: (value: string) => void;
  onSubmitAssignment: () => void;
  onDeletePedido: () => void;
  onResetFilters: () => void;
  onStartCreate: () => void;
}

export const DispatcherAssignmentPanel = ({
  isCreating,
  sticky = true,
  selectedPedido,
  assignmentEmail,
  hasPedidos,
  hasActiveFilters,
  creating,
  submitting,
  deleting,
  onCreatePedido,
  onAssignmentEmailChange,
  onSubmitAssignment,
  onDeletePedido,
  onResetFilters,
  onStartCreate,
}: DispatcherAssignmentPanelProps) => {
  const [createForm, setCreateForm] = useState<DispatcherCreateFormState>(INITIAL_CREATE_FORM);
  const panelClassName = sticky ? "card dispatcher-panel create-card" : "card dispatcher-panel";

  if (isCreating) {
    const handleCreateSubmit = async (event: FormEvent) => {
      event.preventDefault();

      const createdPedido = await onCreatePedido({
        direccionEntrega: createForm.direccionEntrega.trim(),
        estado: createForm.estado,
        zona: createForm.zona.trim(),
        peso: Number(createForm.peso),
        tamano: createForm.tamano,
        fragil: createForm.fragil,
        tipoCobro: createForm.tipoCobro,
        prioritario: createForm.prioritario,
      });

      if (createdPedido) {
        setCreateForm(INITIAL_CREATE_FORM);
      }
    };

    return (
      <article className={panelClassName}>
        <div className="card__header card__header--split">
          <div>
            <p className="eyebrow">Nuevo pedido</p>
            <h2>Crear pedido</h2>
          </div>
          <span className="placeholder-badge">Alta rapida</span>
        </div>

        <div className="data-note panel-note">
          <p className="eyebrow">Alta operativa</p>
          <strong>Registra un pedido nuevo sin salir del centro de control.</strong>
          <span>
            Completa direccion, zona, formato y condiciones de entrega para sumarlo al
            listado del turno.
          </span>
        </div>

        <form className="assignment-form" onSubmit={handleCreateSubmit}>
          <div className="form__row">
            <label htmlFor="create-direccion">Direccion de entrega</label>
            <input
              id="create-direccion"
              value={createForm.direccionEntrega}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  direccionEntrega: event.target.value,
                }))
              }
              placeholder="Calle 10 # 20-30"
              required
            />
          </div>

          <div className="form__row">
            <label htmlFor="create-zona">Zona</label>
            <select
              id="create-zona"
              value={createForm.zona}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  zona: event.target.value,
                }))
              }
            >
              {ZONA_OPTIONS.map((zona) => (
                <option key={zona} value={zona}>
                  {zona}
                </option>
              ))}
            </select>
          </div>

          <div className="form__row">
            <label htmlFor="create-estado">Estado inicial</label>
            <select
              id="create-estado"
              value={createForm.estado}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  estado: event.target.value as PedidoInput["estado"],
                }))
              }
            >
              {ESTADO_OPTIONS.map((estado) => (
                <option key={estado} value={estado}>
                  {ESTADO_LABELS[estado]}
                </option>
              ))}
            </select>
          </div>

          <div className="form__row">
            <label htmlFor="create-peso">Peso (kg)</label>
            <input
              id="create-peso"
              type="number"
              min="0.1"
              step="0.1"
              value={createForm.peso}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  peso: event.target.value,
                }))
              }
              placeholder="5.0"
              required
            />
          </div>

          <div className="form__row">
            <label htmlFor="create-tamano">Tamano</label>
            <select
              id="create-tamano"
              value={createForm.tamano}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  tamano: event.target.value as TipoTamano,
                }))
              }
            >
              {Object.entries(TAMANO_LABELS).map(([tamano, label]) => (
                <option key={tamano} value={tamano}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="form__row">
            <label htmlFor="create-cobro">Tipo de cobro</label>
            <select
              id="create-cobro"
              value={createForm.tipoCobro}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  tipoCobro: event.target.value as TipoCobro,
                }))
              }
            >
              {Object.entries(TIPO_COBRO_LABELS).map(([tipoCobro, label]) => (
                <option key={tipoCobro} value={tipoCobro}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="dispatcher-toggle-grid">
            <label
              className={`dispatcher-toggle${
                createForm.prioritario ? " dispatcher-toggle--active" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={createForm.prioritario}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    prioritario: event.target.checked,
                  }))
                }
              />
              <span className="dispatcher-toggle__control" aria-hidden="true" />
              <span className="dispatcher-toggle__copy">
                <span className="dispatcher-toggle__title">Prioritario</span>
                <span className="dispatcher-toggle__meta">
                  Dale foco primero dentro del turno.
                </span>
              </span>
            </label>

            <label
              className={`dispatcher-toggle${
                createForm.fragil ? " dispatcher-toggle--active" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={createForm.fragil}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    fragil: event.target.checked,
                  }))
                }
              />
              <span className="dispatcher-toggle__control" aria-hidden="true" />
              <span className="dispatcher-toggle__copy">
                <span className="dispatcher-toggle__title">Fragil</span>
                <span className="dispatcher-toggle__meta">
                  Requiere manejo delicado en reparto.
                </span>
              </span>
            </label>
          </div>

          <div className="panel-actions">
            <button type="submit" className="button primary block" disabled={creating}>
              {creating ? "Creando..." : "Crear pedido"}
            </button>
            {hasActiveFilters ? (
              <button type="button" className="button ghost block" onClick={onResetFilters}>
                Limpiar filtros
              </button>
            ) : null}
          </div>
        </form>
      </article>
    );
  }

  if (!selectedPedido) {
    return (
      <article className={panelClassName}>
        <div className="card__header">
          <div>
            <p className="eyebrow">Pedido en foco</p>
            <h2>Selecciona un pedido</h2>
          </div>
        </div>

        <div className="data-note panel-note">
          <p className="eyebrow">Vista lateral</p>
          <strong>
            {!hasPedidos
              ? "Todavia no hay pedidos cargados en este turno."
              : hasActiveFilters
                ? "La vista actual no deja un pedido en foco."
                : "Elige una fila del listado para ver su detalle."}
          </strong>
          <span>
            {!hasPedidos
              ? "Desde aqui podras asignar reparto, retirar pedidos y seguir el frente operativo apenas exista carga."
              : hasActiveFilters
                ? "Puedes limpiar filtros para recuperar visibilidad o crear un pedido nuevo sin salir de gestion."
                : "Esta ficha resume cliente, zona, reparto actual y acciones rapidas para el pedido seleccionado."}
          </span>
        </div>

        <div className="detail-list">
          <div className="detail-list__item">
            <span className="detail-list__label">Siguiente paso</span>
            <span className="detail-list__value">
              {!hasPedidos ? "Crear el primer pedido del turno" : "Seleccionar o crear un pedido"}
            </span>
          </div>
          <div className="detail-list__item">
            <span className="detail-list__label">Desde esta ficha</span>
            <span className="detail-list__value">
              Asignacion de reparto, retiro del pedido y lectura rapida del frente activo.
            </span>
          </div>
        </div>

        <div className="panel-actions">
          <button type="button" className="button primary block" onClick={onStartCreate}>
            Nuevo pedido
          </button>
          {hasActiveFilters ? (
            <button type="button" className="button ghost block" onClick={onResetFilters}>
              Limpiar filtros
            </button>
          ) : null}
        </div>
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
    <article className={panelClassName}>
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
