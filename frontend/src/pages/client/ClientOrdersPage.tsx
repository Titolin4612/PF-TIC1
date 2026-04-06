import { useMemo, useState } from "react";
import { MetricCard } from "../../components/MetricCard";
import { PedidoStatusBadge } from "../../components/PedidoStatusBadge";
import { useClientPedidos } from "./useClientPedidos";
import {
  CLIENT_STATUS_FLOW,
  getClientHeadline,
  getClientPedidoMeta,
  getClientPrimaryPedido,
  getClientSecondaryNote,
  getClientSupportCopy,
} from "../../utils/clientPresentation";
import { ESTADO_LABELS, formatZona } from "../../utils/pedidoPresentation";

export const ClientOrdersPage = () => {
  const { pedidos, loading, refreshing, error, refresh } = useClientPedidos();
  const [selectedPedidoId, setSelectedPedidoId] = useState<number | null>(null);

  const selectedPedido = useMemo(() => {
    return (
      pedidos.find((pedido) => pedido.id === selectedPedidoId) ??
      getClientPrimaryPedido(pedidos)
    );
  }, [pedidos, selectedPedidoId]);

  const selectedMeta = selectedPedido ? getClientPedidoMeta(selectedPedido) : [];

  const metrics = {
    total: pedidos.length,
    activos: pedidos.filter(
      (pedido) => pedido.estado !== "ENTREGADO" && pedido.estado !== "CANCELADO"
    ).length,
    enCamino: pedidos.filter((pedido) => pedido.estado === "EN_CAMINO").length,
    entregados: pedidos.filter((pedido) => pedido.estado === "ENTREGADO").length,
  };

  return (
    <section className="page-stack">
      <header className="card page-hero">
        <div className="card__header card__header--split">
          <div>
            <p className="eyebrow">Mis pedidos</p>
            <h1>Seguimiento de pedidos</h1>
            <p className="page-hero__description">
              Consulta el estado de tus solicitudes, revisa el avance de cada entrega
              y mantente al tanto del pedido mas relevante del momento.
            </p>
          </div>

          <div className="header-actions">
            <button type="button" className="button ghost" onClick={() => void refresh()}>
              {loading || refreshing ? "Actualizando..." : "Actualizar pedidos"}
            </button>
          </div>
        </div>
      </header>

      {error ? <div className="alert alert--error">{error}</div> : null}

      <section className="kpi-grid">
        <MetricCard label="Mis pedidos" value={metrics.total} />
        <MetricCard label="Activos" value={metrics.activos} tone="info" />
        <MetricCard label="En camino" value={metrics.enCamino} tone="warning" />
        <MetricCard label="Entregados" value={metrics.entregados} tone="success" />
      </section>

      <section className="orders-grid">
        <article className="card order-card">
          <div className="card__header card__header--split">
            <div>
              <p className="eyebrow">Pedido destacado</p>
              <h2>{selectedPedido ? `Pedido #${selectedPedido.id}` : "Sin pedidos activos"}</h2>
            </div>
            {selectedPedido ? <PedidoStatusBadge estado={selectedPedido.estado} /> : null}
          </div>

          {loading ? (
            <div className="skeleton-table">
              <div className="skeleton-row" />
              <div className="skeleton-row" />
              <div className="skeleton-row" />
            </div>
          ) : !selectedPedido ? (
            <div className="driver-empty">
              <p className="driver-empty__eyebrow">Sin actividad</p>
              <h3 className="driver-empty__title">Aun no tienes pedidos registrados</h3>
              <p className="driver-empty__body">
                Cuando existan pedidos asociados a tu cuenta, aqui veras el estado,
                el progreso y el detalle principal de cada uno.
              </p>
            </div>
          ) : (
            <div className="driver-focus__body">
              <div className="driver-focus__headline">
                <div>
                  <h3>{getClientHeadline(selectedPedido)}</h3>
                  <p className="driver-copy">{getClientSupportCopy(selectedPedido)}</p>
                </div>
              </div>

              {selectedPedido.estado !== "CANCELADO" ? (
                <div className="driver-stepper" aria-label="Progreso del pedido">
                  {CLIENT_STATUS_FLOW.map((estado) => {
                    const selectedIndex = CLIENT_STATUS_FLOW.indexOf(
                      selectedPedido.estado as (typeof CLIENT_STATUS_FLOW)[number]
                    );
                    const currentIndex = CLIENT_STATUS_FLOW.indexOf(estado);
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
              ) : (
                <div className="driver-terminal-note">
                  <strong>Pedido cancelado</strong>
                  <span>Este seguimiento ya no tiene mas movimientos pendientes.</span>
                </div>
              )}

              <div className="driver-detail-grid">
                {selectedMeta.map((item) => (
                  <div key={item.label} className="driver-detail">
                    <span className="driver-detail__label">{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>

              <div className="data-note">
                <p className="eyebrow">Seguimiento</p>
                <strong>{selectedPedido.direccionEntrega}</strong>
                <span>{getClientSecondaryNote(selectedPedido)}</span>
              </div>
            </div>
          )}
        </article>

        <aside className="side-stack">
          <article className="card">
            <div className="card__header card__header--split">
              <div>
                <p className="eyebrow">Listado</p>
                <h2>Todos mis pedidos</h2>
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
                  Esta bandeja mostrara tus pedidos del mas reciente al mas relevante
                  para que puedas revisar su progreso sin salir de tu panel.
                </p>
              </div>
            ) : (
              <div className="summary-list">
                {pedidos.map((pedido) => {
                  const isSelected = selectedPedido?.id === pedido.id;

                  return (
                    <button
                      key={pedido.id}
                      type="button"
                      className={`summary-list__item summary-list__item--button${
                        isSelected ? " driver-route-queue__item--selected" : ""
                      }`}
                      onClick={() => setSelectedPedidoId(pedido.id)}
                    >
                      <div>
                        <p className="summary-list__title">Pedido #{pedido.id}</p>
                        <p className="summary-list__meta">
                          {formatZona(pedido.zona)} - {pedido.direccionEntrega}
                        </p>
                      </div>
                      <div>
                        <PedidoStatusBadge estado={pedido.estado} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </article>
        </aside>
      </section>
    </section>
  );
};
