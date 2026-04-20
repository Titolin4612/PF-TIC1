import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PedidoStatusBadge } from "../../components/PedidoStatusBadge";
import { RouteMap } from "../../components/RouteMap";
import { useGeocodedPedidos } from "../../hooks/useGeocodedPedidos";
import { APP_ROUTES } from "../../router/paths";
import type { EstadoPedido } from "../../types/pedido";
import {
  ESTADO_LABELS,
  TAMANO_LABELS,
  TIPO_COBRO_LABELS,
  formatDateTime,
  formatZona,
  getClienteLabel,
  getPriorityLabel,
} from "../../utils/pedidoPresentation";
import {
  DRIVER_STATUS_FLOW,
  getDriverActionCopy,
  getDriverAllowedEstadoActions,
  getDriverPrimaryPedido,
  getDriverPriorityMessage,
  getDriverSuccessMessage,
  isDriverActionablePedido,
} from "../../utils/driverPresentation";
import { nearestNeighborTSP } from "../../utils/tsp";
import { useDriverPedidos } from "./useDriverPedidos";

const getDriverRoutePath = (pedidoId: number): string =>
  `${APP_ROUTES.driverRoute}?pedido=${pedidoId}`;

const parsePedidoId = (value: string | null): number | null => {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
};

export const DriverRoutePage = () => {
  const { pedidos, loading, refreshing, actionPedidoId, error, refresh, updateStatus } =
    useDriverPedidos();
  const [searchParams, setSearchParams] = useSearchParams();
  const [feedback, setFeedback] = useState<{
    pedidoId: number;
    message: string;
  } | null>(null);
  const requestedPedidoId = parsePedidoId(searchParams.get("pedido"));
  const requestedPedido =
    requestedPedidoId === null
      ? null
      : pedidos.find((pedido) => pedido.id === requestedPedidoId) ?? null;
  const selectedPedido = requestedPedido ?? getDriverPrimaryPedido(pedidos);
  const selectedActions = selectedPedido ? getDriverAllowedEstadoActions(selectedPedido) : [];
  const isSaving = selectedPedido ? actionPedidoId === selectedPedido.id : false;
  const nextActionablePedido =
    selectedPedido === null
      ? null
      : pedidos.find(
          (pedido) => pedido.id !== selectedPedido.id && isDriverActionablePedido(pedido)
        ) ?? null;
  const visibleFeedback =
    selectedPedido && feedback?.pedidoId === selectedPedido.id ? feedback.message : null;

  const pedidosMemo = useMemo(() => pedidos, [pedidos]);
  const { stops, geocoding } = useGeocodedPedidos(pedidosMemo);
  const optimizedStops = stops.length > 1 ? nearestNeighborTSP(stops) : stops;
  const activeStopId = selectedPedido
    ? stops.find((s) => s.id === selectedPedido.id)?.id
    : undefined;

  useEffect(() => {
    if (!selectedPedido) {
      return;
    }

    if (requestedPedidoId !== selectedPedido.id) {
      setSearchParams({ pedido: String(selectedPedido.id) }, { replace: true });
    }
  }, [requestedPedidoId, selectedPedido, setSearchParams]);

  const handleUpdateStatus = async (estado: EstadoPedido) => {
    if (!selectedPedido) {
      return;
    }

    setFeedback(null);

    const updatedPedido = await updateStatus(selectedPedido.id, estado);

    if (updatedPedido) {
      setFeedback({
        pedidoId: updatedPedido.id,
        message: getDriverSuccessMessage(updatedPedido.estado),
      });
    }
  };

  return (
    <section className="page-stack driver-page">
      <header className="card page-hero driver-hero">
        <div className="card__header card__header--split">
          <div>
            <p className="eyebrow">Ruta activa</p>
            <h1>Detalle operativo</h1>
            <p className="page-hero__description">
              Trabaja una entrega a la vez, registra el avance del pedido y deja
              claro cual es tu siguiente movimiento.
            </p>
          </div>

          <div className="header-actions">
            <Link className="button ghost" to={APP_ROUTES.driverDeliveries}>
              Ver todas mis entregas
            </Link>
            <button type="button" className="button primary" onClick={() => void refresh()}>
              {loading || refreshing ? "Actualizando..." : "Actualizar detalle"}
            </button>
          </div>
        </div>
      </header>

      {error ? <div className="alert alert--error">{error}</div> : null}
      {visibleFeedback ? <div className="alert alert--success">{visibleFeedback}</div> : null}

      {pedidos.length > 0 && (
        <article className="card">
          <div className="card__header card__header--split">
            <div>
              <p className="eyebrow">Ruta optimizada · TSP</p>
              <h2>Mis paradas en el mapa</h2>
            </div>
            {geocoding && (
              <span className="geocoding-status">Geocodificando paradas...</span>
            )}
          </div>
          {stops.length > 0 ? (
            <RouteMap
              stops={stops}
              route={optimizedStops}
              activeStopId={activeStopId}
              height="340px"
            />
          ) : geocoding ? (
            <div className="skeleton-row" style={{ height: "340px" }} />
          ) : (
            <p className="map-hint">No se pudieron geocodificar las direcciones.</p>
          )}
        </article>
      )}

      <section className="driver-route-layout">
        <article className="card driver-route-card">
          {loading ? (
            <div className="skeleton-table">
              <div className="skeleton-row" />
              <div className="skeleton-row" />
              <div className="skeleton-row" />
              <div className="skeleton-row" />
            </div>
          ) : !selectedPedido ? (
            <div className="driver-empty">
              <p className="driver-empty__eyebrow">Sin entrega activa</p>
              <h2 className="driver-empty__title">Tu ruta esta libre por ahora</h2>
              <p className="driver-empty__body">
                Cuando tengas pedidos asignados, aqui veras el detalle de la parada
                actual y las acciones para mover el estado sin rodeos.
              </p>
            </div>
          ) : (
            <div className="driver-route-card__body">
              <div className="driver-route-card__top">
                <div>
                  <p className="eyebrow">Pedido #{selectedPedido.id}</p>
                  <h2>{selectedPedido.direccionEntrega}</h2>
                  <p className="driver-copy">{getDriverActionCopy(selectedPedido)}</p>
                </div>
                <div className="driver-route-card__status">
                  <PedidoStatusBadge estado={selectedPedido.estado} />
                  {selectedPedido.prioritario ? (
                    <span className="driver-chip driver-chip--priority">Prioridad alta</span>
                  ) : null}
                </div>
              </div>

              <div className="driver-chip-row">
                <span className="driver-chip">{formatZona(selectedPedido.zona)}</span>
                <span className="driver-chip">
                  {selectedPedido.fragil ? "Manejo delicado" : "Carga estandar"}
                </span>
                <span className="driver-chip">{getDriverPriorityMessage(selectedPedido)}</span>
              </div>

              {selectedPedido.estado === "CANCELADO" ? (
                <div className="driver-terminal-note">
                  <strong>Entrega cancelada</strong>
                  <span>Esta parada ya no sigue en tu frente operativo.</span>
                </div>
              ) : (
                <div className="driver-stepper" aria-label="Progreso de la entrega">
                  {DRIVER_STATUS_FLOW.map((estado) => {
                    const selectedIndex = DRIVER_STATUS_FLOW.indexOf(selectedPedido.estado);
                    const currentIndex = DRIVER_STATUS_FLOW.indexOf(estado);
                    const isCurrent = selectedPedido.estado === estado;
                    const isCompleted = selectedIndex > currentIndex;

                    return (
                      <div
                        key={estado}
                        className={`driver-stepper__item${
                          isCurrent ? " driver-stepper__item--current" : ""
                        }${isCompleted ? " driver-stepper__item--done" : ""}`}
                      >
                        <span className="driver-stepper__dot" />
                        <span className="driver-stepper__label">{ESTADO_LABELS[estado]}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="driver-detail-grid">
                <div className="driver-detail">
                  <span className="driver-detail__label">Zona</span>
                  <strong>{formatZona(selectedPedido.zona)}</strong>
                </div>
                <div className="driver-detail">
                  <span className="driver-detail__label">Cobro</span>
                  <strong>{TIPO_COBRO_LABELS[selectedPedido.tipoCobro]}</strong>
                </div>
                <div className="driver-detail">
                  <span className="driver-detail__label">Carga</span>
                  <strong>
                    {TAMANO_LABELS[selectedPedido.tamano]} - {selectedPedido.peso} kg
                  </strong>
                </div>
                <div className="driver-detail">
                  <span className="driver-detail__label">Prioridad</span>
                  <strong>{getPriorityLabel(selectedPedido.prioritario)}</strong>
                </div>
                <div className="driver-detail">
                  <span className="driver-detail__label">Cliente</span>
                  <strong>{getClienteLabel(selectedPedido.clienteEmail)}</strong>
                </div>
                <div className="driver-detail">
                  <span className="driver-detail__label">Registro</span>
                  <strong>{formatDateTime(selectedPedido.fechaCreacion)}</strong>
                </div>
              </div>

              <section className="driver-action-panel">
                <div>
                  <p className="eyebrow">Siguiente paso</p>
                  <h3>
                    {selectedActions[0]?.label ??
                      (selectedPedido.estado === "ENTREGADO"
                        ? "Entrega cerrada"
                        : selectedPedido.estado === "CANCELADO"
                          ? "Entrega cancelada"
                          : "Sin acciones pendientes")}
                  </h3>
                  <p className="driver-copy">
                    {selectedActions[0]?.helper ??
                      (nextActionablePedido
                        ? "Esta parada ya quedo cerrada. Abre la siguiente entrega para continuar el turno."
                        : "No tienes otra entrega activa en este momento.")}
                  </p>
                </div>

                {selectedActions.length > 0 ? (
                  <div className="driver-action-panel__buttons">
                    {selectedActions.map((action) => (
                      <button
                        key={action.estado}
                        type="button"
                        className={`button ${action.tone}`}
                        disabled={isSaving}
                        onClick={() => void handleUpdateStatus(action.estado)}
                      >
                        {isSaving && action.estado === selectedActions[0]?.estado
                          ? "Guardando..."
                          : action.label}
                      </button>
                    ))}
                  </div>
                ) : nextActionablePedido ? (
                  <Link
                    className="button primary"
                    to={getDriverRoutePath(nextActionablePedido.id)}
                  >
                    Abrir siguiente entrega
                  </Link>
                ) : (
                  <Link className="button ghost" to={APP_ROUTES.driverDeliveries}>
                    Volver a la bandeja
                  </Link>
                )}
              </section>
            </div>
          )}
        </article>

        <aside className="card driver-route-queue">
          <div className="card__header card__header--split">
            <div>
              <p className="eyebrow">Cola del turno</p>
              <h2>Mis paradas</h2>
            </div>
            <span className="placeholder-badge">{pedidos.length} pedidos</span>
          </div>

          {loading ? (
            <div className="skeleton-table">
              <div className="skeleton-row" />
              <div className="skeleton-row" />
              <div className="skeleton-row" />
            </div>
          ) : pedidos.length === 0 ? (
            <div className="driver-empty driver-empty--compact">
              <p className="driver-empty__body">
                Esta columna mantendra visibles tus otras entregas para cambiar de
                parada rapidamente cuando termines la actual.
              </p>
            </div>
          ) : (
            <div className="driver-route-queue__list">
              {pedidos.map((pedido) => {
                const isSelected = selectedPedido?.id === pedido.id;

                return (
                  <Link
                    key={pedido.id}
                    className={`driver-route-queue__item${
                      isSelected ? " driver-route-queue__item--selected" : ""
                    }`}
                    to={getDriverRoutePath(pedido.id)}
                  >
                    <div>
                      <p className="driver-route-queue__title">{pedido.direccionEntrega}</p>
                      <p className="driver-route-queue__meta">
                        Pedido #{pedido.id} - {formatZona(pedido.zona)}
                      </p>
                    </div>
                    <div className="driver-route-queue__status">
                      <PedidoStatusBadge estado={pedido.estado} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </aside>
      </section>
    </section>
  );
};
