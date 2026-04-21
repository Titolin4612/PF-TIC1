import { Link } from "react-router-dom";
import { MetricCard } from "../../components/MetricCard";
import { PedidoStatusBadge } from "../../components/PedidoStatusBadge";
import { APP_ROUTES } from "../../router/paths";
import {
  getCourierSummaries,
  getPedidoMetrics,
  getPedidosNeedingAttention,
  getPedidosReadyForDispatch,
  getUnassignedPedidos,
  getZoneSummaries,
} from "../../utils/dispatcherInsights";
import {
  formatZona,
  getClienteLabel,
  getDispatcherActionLabel,
  getPriorityLabel,
} from "../../utils/pedidoPresentation";
import { DispatcherEmptyState } from "./components/DispatcherEmptyState";
import { useDispatcherOrders } from "./useDispatcherOrders";

export const DispatcherRoutesPage = () => {
  const { pedidos, loading, refreshing, error, refresh } = useDispatcherOrders();
  const activePedidos = pedidos.filter(
    (pedido) => pedido.estado !== "ENTREGADO" && pedido.estado !== "CANCELADO"
  );
  const metrics = getPedidoMetrics(activePedidos);
  const courierSummaries = getCourierSummaries(activePedidos);
  const courierRows = courierSummaries.filter((summary) => summary.repartidorEmail);
  const zoneSummaries = getZoneSummaries(activePedidos);
  const allUnassignedPedidos = getUnassignedPedidos(activePedidos);
  const readyForDispatchPedidos = getPedidosReadyForDispatch(activePedidos);
  const attentionPedidos = getPedidosNeedingAttention(activePedidos);
  const activeCourierCount = courierRows.length;
  const topZones = zoneSummaries.slice(0, 6);
  const waitingForAssignment = allUnassignedPedidos.length;
  const zonesWithBacklog = zoneSummaries.filter((summary) => summary.pendientes > 0).length;
  const topZone = topZones[0];
  const topCourier = courierRows[0];
  const coordinationQueue = (() => {
    const queue: typeof activePedidos = [];
    const seenIds = new Set<number>();

    [...allUnassignedPedidos, ...attentionPedidos].forEach((pedido) => {
      if (!seenIds.has(pedido.id)) {
        seenIds.add(pedido.id);
        queue.push(pedido);
      }
    });

    return queue.slice(0, 6);
  })();

  return (
    <section className="page-stack">
      <header className="card page-hero">
        <div className="card__header card__header--split">
          <div>
            <p className="eyebrow">Coordinacion</p>
            <h1>Gestion de rutas</h1>
            <p className="page-hero__description">
              Distribuye la operacion por repartidor y por zona para identificar
              salidas, carga territorial y pedidos que piden coordinacion inmediata.
            </p>
          </div>

          <div className="header-actions">
            <button type="button" className="button ghost" onClick={() => void refresh()}>
              {loading || refreshing ? "Actualizando..." : "Refrescar"}
            </button>
            <Link className="button primary" to={APP_ROUTES.dispatcherOrders}>
              Ir a pedidos
            </Link>
          </div>
        </div>
      </header>

      {error ? <div className="alert alert--error">{error}</div> : null}

      <section className="kpi-grid">
        <MetricCard label="Repartidores activos" value={activeCourierCount} />
        <MetricCard
          label="Zonas activas"
          value={zoneSummaries.length}
          helper="Frentes visibles del turno"
        />
        <MetricCard
          label="Sin reparto"
          value={allUnassignedPedidos.length}
          helper="Pedidos listos para asignar"
          tone="info"
        />
        <MetricCard
          label="Listos para salida"
          value={readyForDispatchPedidos.length}
          helper="Pedidos con reparto listo"
        />
        <MetricCard
          label="En camino"
          value={metrics.enCamino}
          helper="Entregas actualmente en curso"
          tone="warning"
        />
        <MetricCard
          label="Prioritarios"
          value={metrics.prioritarios}
          helper="Atenciones que merecen foco"
        />
      </section>

      <section className="routes-top-grid">
        <article className="card order-card">
          <div className="card__header card__header--split">
            <div>
              <p className="eyebrow">Distribucion por repartidor</p>
              <h2>Balance del reparto</h2>
            </div>
            <span className="placeholder-badge">{courierRows.length} repartidores</span>
          </div>

          {loading ? (
            <div className="skeleton-table">
              <div className="skeleton-row" />
              <div className="skeleton-row" />
              <div className="skeleton-row" />
            </div>
          ) : courierRows.length === 0 ? (
            <DispatcherEmptyState
              title="Sin salida activa para coordinar"
              body="Esta mesa organiza la carga abierta por repartidor y deja visibles los frentes que exigen movimiento."
            />
          ) : (
            <div className="table-wrapper">
              <table className="table orders-table">
                <thead>
                  <tr>
                    <th>Repartidor</th>
                    <th>Por atender</th>
                    <th>En camino</th>
                    <th className="is-optional">Prioritarios</th>
                    <th className="is-optional">Zonas</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {courierRows.map((summary) => (
                    <tr key={summary.label}>
                      <td>
                        <div className="table-cell">
                          <p className="table-cell__primary">{summary.label}</p>
                          <p className="table-cell__secondary">
                            {summary.pendientes} pendientes - {summary.enCamino} en calle
                          </p>
                        </div>
                      </td>
                      <td>{summary.pendientes}</td>
                      <td>{summary.enCamino}</td>
                      <td className="is-optional">{summary.prioritarios}</td>
                      <td className="is-optional">{summary.zonas}</td>
                      <td>{summary.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <aside className="side-stack">
          <article className="card">
            <div className="card__header">
              <div>
                <p className="eyebrow">Salida inmediata</p>
                <h2>Lectura de coordinacion</h2>
              </div>
            </div>

            {activePedidos.length === 0 ? (
              <DispatcherEmptyState
                compact
                title="Sin salida activa"
                body="La vista resume reparto pendiente, frentes listos para despacho y concentracion territorial del turno."
              />
            ) : (
              <div className="summary-list">
                <div className="summary-list__item">
                  <div>
                    <p className="summary-list__title">Listos para salir</p>
                    <p className="summary-list__meta">
                      Pedidos con reparto listo para avanzar.
                    </p>
                  </div>
                  <span className="summary-list__value">{readyForDispatchPedidos.length}</span>
                </div>

                <div className="summary-list__item">
                  <div>
                    <p className="summary-list__title">Esperando reparto</p>
                    <p className="summary-list__meta">
                      Frentes que aun no tienen conductor asignado.
                    </p>
                  </div>
                  <span className="summary-list__value">{waitingForAssignment}</span>
                </div>

                <div className="summary-list__item">
                  <div>
                    <p className="summary-list__title">Entregas en calle</p>
                    <p className="summary-list__meta">
                      Pedidos actualmente en recorrido.
                    </p>
                  </div>
                  <span className="summary-list__value">{metrics.enCamino}</span>
                </div>

                <div className="summary-list__item">
                  <div>
                    <p className="summary-list__title">Zonas con espera</p>
                    <p className="summary-list__meta">
                      Sectores con pedidos por atender.
                    </p>
                  </div>
                  <span className="summary-list__value">{zonesWithBacklog}</span>
                </div>
              </div>
            )}
          </article>

          <article className="card">
            <div className="card__header">
              <div>
                <p className="eyebrow">Prioridad de coordinacion</p>
                <h2>Que mover primero</h2>
              </div>
            </div>

            {coordinationQueue.length === 0 ? (
              <DispatcherEmptyState
                compact
                title="Sin prioridad operativa abierta"
                body="La coordinacion inmediata queda ordenada; la salida activa no muestra pendientes criticos."
              />
            ) : (
              <div className="route-plan">
                {coordinationQueue.map((pedido, index) => (
                  <div key={pedido.id} className="route-plan__item">
                    <span className="route-plan__rank">{index + 1}</span>
                    <div>
                      <p className="summary-list__title">{pedido.direccionEntrega}</p>
                      <p className="summary-list__meta">
                        {formatZona(pedido.zona)} - {getDispatcherActionLabel(pedido)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </aside>
      </section>

      <section className="routes-support-grid">
        <article className="card">
          <div className="card__header card__header--split">
            <div>
              <p className="eyebrow">Balance territorial</p>
              <h2>Carga por zona</h2>
            </div>
            <span className="placeholder-badge">{zoneSummaries.length} zonas</span>
          </div>

          {topZones.length === 0 ? (
            <DispatcherEmptyState
              compact
              title="Sin carga territorial activa"
              body="La mesa cruza zonas, espera y reparto pendiente para orientar el despacho."
            />
          ) : (
            <>
              <div className="table-wrapper">
                <table className="table orders-table">
                  <thead>
                    <tr>
                      <th>Zona</th>
                      <th>Por atender</th>
                      <th>En camino</th>
                      <th className="is-optional">Prioritarios</th>
                      <th>Sin reparto</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topZones.map((summary) => (
                      <tr key={summary.zona}>
                        <td>
                          <div className="table-cell">
                            <p className="table-cell__primary">{summary.zona}</p>
                            <p className="table-cell__secondary">
                              {summary.fragiles} fragiles
                            </p>
                          </div>
                        </td>
                        <td>{summary.pendientes}</td>
                        <td>{summary.enCamino}</td>
                        <td className="is-optional">{summary.prioritarios}</td>
                        <td>{summary.sinAsignar}</td>
                        <td>{summary.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="data-note">
                <p className="eyebrow">Lectura territorial</p>
                <strong>
                  {topZone
                    ? `${topZone.zona} concentra la mayor carga de coordinacion.`
                    : "Sin zona dominante en este momento."}
                </strong>
                <span>
                  {topCourier
                    ? `${topCourier.label} lidera la carga abierta con ${topCourier.total} pedidos.`
                    : "La salida sigue sin repartidores con carga visible."}
                </span>
              </div>
            </>
          )}
        </article>

        <article className="card">
          <div className="card__header card__header--split">
            <div>
              <p className="eyebrow">Frente de salida</p>
              <h2>Pedidos sin repartidor</h2>
            </div>
            <Link className="button ghost" to={APP_ROUTES.dispatcherOrders}>
              Asignar reparto
            </Link>
          </div>

          {allUnassignedPedidos.length === 0 ? (
            <DispatcherEmptyState
              compact
              title={
                activePedidos.length === 0
                  ? "Sin salida abierta"
                  : "Toda la salida activa tiene repartidor"
              }
              body="Esta mesa deja al frente los pedidos pendientes de asignacion para sostener la coordinacion."
            />
          ) : (
            <div className="table-wrapper">
              <table className="table orders-table">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Zona</th>
                    <th>Estado</th>
                    <th className="is-optional">Prioridad</th>
                  </tr>
                </thead>
                <tbody>
                  {allUnassignedPedidos.slice(0, 6).map((pedido) => (
                    <tr key={pedido.id}>
                      <td>
                        <div className="table-cell">
                          <p className="table-cell__primary">{pedido.direccionEntrega}</p>
                          <p className="table-cell__secondary">#{pedido.id}</p>
                        </div>
                      </td>
                      <td>{getClienteLabel(pedido.clienteEmail)}</td>
                      <td>{formatZona(pedido.zona)}</td>
                      <td>
                        <PedidoStatusBadge estado={pedido.estado} />
                      </td>
                      <td className="is-optional">{getPriorityLabel(pedido.prioritario)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    </section>
  );
};
