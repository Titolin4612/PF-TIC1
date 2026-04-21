import { Link } from "react-router-dom";
import { MetricCard } from "../../components/MetricCard";
import { PedidoStatusBadge } from "../../components/PedidoStatusBadge";
import { APP_ROUTES } from "../../router/paths";
import {
  getCourierSummaries,
  getPedidoMetrics,
  getPedidosNeedingAttention,
  getPedidosReadyForDispatch,
  getRecentPedidos,
  getUnassignedPedidos,
  getZoneSummaries,
} from "../../utils/dispatcherInsights";
import {
  formatDateTime,
  formatZona,
  getClienteLabel,
  getDispatcherActionLabel,
  getRepartidorLabel,
} from "../../utils/pedidoPresentation";
import { DispatcherEmptyState } from "./components/DispatcherEmptyState";
import { useDispatcherOrders } from "./useDispatcherOrders";

export const DispatcherDashboardPage = () => {
  const { pedidos, loading, refreshing, error, refresh } = useDispatcherOrders();
  const metrics = getPedidoMetrics(pedidos);
  const attentionPedidos = getPedidosNeedingAttention(pedidos).slice(0, 6);
  const recentPedidos = getRecentPedidos(pedidos).slice(0, 5);
  const unassignedPedidos = getUnassignedPedidos(pedidos);
  const readyForDispatchPedidos = getPedidosReadyForDispatch(pedidos);
  const zoneSummaries = getZoneSummaries(pedidos).slice(0, 4);
  const activeCourierSummaries = getCourierSummaries(
    pedidos.filter((pedido) => pedido.estado !== "ENTREGADO" && pedido.estado !== "CANCELADO")
  )
    .filter((summary) => summary.repartidorEmail)
    .slice(0, 3);

  const nextActionRows = [
    {
      label: "Asignar reparto",
      total: unassignedPedidos.length,
      detail:
        unassignedPedidos.length > 0
          ? "Pedidos activos sin conductor asignado."
          : "Sin pedidos pendientes de reparto.",
      to: APP_ROUTES.dispatcherOrders,
    },
    {
      label: "Preparar salida",
      total: readyForDispatchPedidos.length,
      detail:
        readyForDispatchPedidos.length > 0
          ? "Pedidos con reparto listo para avanzar."
          : "Sin frentes listos para salida.",
      to: APP_ROUTES.dispatcherRoutes,
    },
    {
      label: "Hacer seguimiento",
      total: metrics.enCamino,
      detail:
        metrics.enCamino > 0
          ? "Entregas actualmente en calle."
          : "Sin entregas en recorrido.",
      to: APP_ROUTES.dispatcherOrders,
    },
  ];

  const statusRows = [
    {
      label: "Creados",
      value: metrics.creados,
      helper: "Ingreso reciente",
      fillClass: "status-board__fill",
    },
    {
      label: "En preparacion",
      value: metrics.enPreparacion,
      helper: "Listos para despacho",
      fillClass: "status-board__fill status-board__fill--info",
    },
    {
      label: "En camino",
      value: metrics.enCamino,
      helper: "Entregas en calle",
      fillClass: "status-board__fill status-board__fill--warning",
    },
    {
      label: "Entregados",
      value: metrics.entregados,
      helper: "Cierre exitoso",
      fillClass: "status-board__fill status-board__fill--success",
    },
    {
      label: "Cancelados",
      value: metrics.cancelados,
      helper: "Pedidos cerrados",
      fillClass: "status-board__fill status-board__fill--danger",
    },
  ];

  const totalPedidos = Math.max(metrics.total, 1);
  const topZone = zoneSummaries[0];
  const topCourier = activeCourierSummaries[0];

  return (
    <section className="page-stack">
      <header className="card page-hero">
        <div className="card__header card__header--split">
          <div>
            <p className="eyebrow">Operacion diaria</p>
            <h1>Dashboard de despacho</h1>
            <p className="page-hero__description">
              Supervisa el flujo del dia, ubica los pedidos que requieren
              atencion inmediata y manten el reparto bajo control.
            </p>
          </div>

          <div className="header-actions">
            <button type="button" className="button ghost" onClick={() => void refresh()}>
              {loading || refreshing ? "Actualizando..." : "Refrescar"}
            </button>
            <Link className="button primary" to={APP_ROUTES.dispatcherOrders}>
              Abrir centro de pedidos
            </Link>
          </div>
        </div>
      </header>

      {error ? <div className="alert alert--error">{error}</div> : null}

      <section className="kpi-grid">
        <MetricCard label="Total de pedidos" value={metrics.total} />
        <MetricCard
          label="Por atender"
          value={metrics.pendientes}
          helper="Pedidos listos para avanzar"
          tone="info"
        />
        <MetricCard
          label="En camino"
          value={metrics.enCamino}
          helper="Entregas actualmente activas"
          tone="warning"
        />
        <MetricCard
          label="Sin reparto"
          value={unassignedPedidos.length}
          helper="Conviene asignarlos pronto"
        />
        <MetricCard
          label="Prioritarios"
          value={metrics.prioritarios}
          helper="Puntos de foco del turno"
        />
        <MetricCard
          label="Entregados"
          value={metrics.entregados}
          helper="Pedidos completados"
          tone="success"
        />
      </section>

      <section className="orders-grid orders-grid--dashboard">
        <article className="card order-card">
          <div className="card__header card__header--split">
            <div>
              <p className="eyebrow">Atencion ahora</p>
              <h2>Pedidos que piden seguimiento</h2>
            </div>
            <Link className="button ghost" to={APP_ROUTES.dispatcherOrders}>
              Gestionar listado completo
            </Link>
          </div>

          <div className="toolbar-strip">
            <div className="toolbar-strip__group">
              <span className="info-pill info-pill--muted">
                {unassignedPedidos.length} sin reparto
              </span>
              <span className="info-pill info-pill--muted">
                {readyForDispatchPedidos.length} listos para salida
              </span>
              <span className="info-pill info-pill--accent">
                {metrics.prioritarios} prioritarios
              </span>
            </div>
          </div>

          {loading ? (
            <div className="skeleton-table">
              <div className="skeleton-row" />
              <div className="skeleton-row" />
              <div className="skeleton-row" />
            </div>
          ) : attentionPedidos.length === 0 ? (
            <DispatcherEmptyState
              title={
                pedidos.length === 0 ? "Sin pedidos para supervisar" : "Sin alertas inmediatas"
              }
              body={
                pedidos.length === 0
                  ? "El tablero concentra prioridades, estado operativo, movimiento reciente y focos de carga del turno."
                  : "La operacion esta estable. El movimiento reciente y la carga del turno resumen el ritmo actual."
              }
              actions={
                pedidos.length === 0
                  ? [
                      { label: "Abrir gestion de pedidos", to: APP_ROUTES.dispatcherOrders, tone: "primary" },
                      { label: "Ver coordinacion", to: APP_ROUTES.dispatcherRoutes },
                    ]
                  : []
              }
            />
          ) : (
            <div className="table-wrapper">
              <table className="table orders-table">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Reparto</th>
                    <th>Estado</th>
                    <th className="is-optional">Siguiente paso</th>
                  </tr>
                </thead>
                <tbody>
                  {attentionPedidos.map((pedido) => (
                    <tr key={pedido.id}>
                      <td>
                        <div className="table-cell">
                          <p className="table-cell__primary">{pedido.direccionEntrega}</p>
                          <p className="table-cell__secondary">
                            #{pedido.id} - {formatZona(pedido.zona)}
                          </p>
                        </div>
                      </td>
                      <td>{getClienteLabel(pedido.clienteEmail)}</td>
                      <td>{getRepartidorLabel(pedido.repartidorEmail)}</td>
                      <td>
                        <PedidoStatusBadge estado={pedido.estado} />
                      </td>
                      <td className="is-optional">{getDispatcherActionLabel(pedido)}</td>
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
                <p className="eyebrow">Acciones siguientes</p>
                <h2>Frentes del gerente</h2>
              </div>
            </div>

            {pedidos.length === 0 ? (
              <DispatcherEmptyState
                compact
                title="Sin frente activo"
                body="Esta mesa resume reparto pendiente, salida lista y seguimientos en calle para el turno."
              />
            ) : (
              <div className="summary-list">
                {nextActionRows.map((row) => (
                  <Link
                    key={row.label}
                    className="summary-list__item summary-list__item--button"
                    to={row.to}
                  >
                    <div>
                      <p className="summary-list__title">{row.label}</p>
                      <p className="summary-list__meta">{row.detail}</p>
                    </div>
                    <span className="summary-list__value">{row.total}</span>
                  </Link>
                ))}
              </div>
            )}
          </article>

          <article className="card">
            <div className="card__header">
              <div>
                <p className="eyebrow">Estado operativo</p>
                <h2>Lectura del turno</h2>
              </div>
            </div>

            {pedidos.length === 0 ? (
              <DispatcherEmptyState
                compact
                title="Sin movimiento operativo"
                body="La lectura del turno organiza ingresos, salida activa, cierres y prioridades desde un solo tablero."
              />
            ) : (
              <div className="status-board">
                {statusRows.map((row) => (
                  <div key={row.label} className="status-board__row">
                    <div className="status-board__header">
                      <div>
                        <p className="summary-list__title">{row.label}</p>
                        <p className="summary-list__meta">{row.helper}</p>
                      </div>
                      <span className="summary-list__value">{row.value}</span>
                    </div>
                    <div className="status-board__track" aria-hidden="true">
                      <span
                        className={row.fillClass}
                        style={{ width: `${(row.value / totalPedidos) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </aside>
      </section>

      <section className="dashboard-bottom-grid">
        <article className="card">
          <div className="card__header card__header--split">
            <div>
              <p className="eyebrow">Movimiento reciente</p>
              <h2>Ultimos pedidos registrados</h2>
            </div>
            <Link className="button ghost" to={APP_ROUTES.dispatcherOrders}>
              Ir a gestion
            </Link>
          </div>

          {loading ? (
            <div className="skeleton-table">
              <div className="skeleton-row" />
              <div className="skeleton-row" />
              <div className="skeleton-row" />
            </div>
          ) : recentPedidos.length === 0 ? (
            <DispatcherEmptyState
              title="Sin actividad reciente"
              body="La actividad del turno se ordena aqui por ingreso mas reciente y estado actual."
            />
          ) : (
            <div className="table-wrapper">
              <table className="table orders-table">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Estado</th>
                    <th>Reparto</th>
                    <th className="is-optional">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPedidos.map((pedido) => (
                    <tr key={pedido.id}>
                      <td>
                        <div className="table-cell">
                          <p className="table-cell__primary">{pedido.direccionEntrega}</p>
                          <p className="table-cell__secondary">#{pedido.id}</p>
                        </div>
                      </td>
                      <td>{getClienteLabel(pedido.clienteEmail)}</td>
                      <td>
                        <PedidoStatusBadge estado={pedido.estado} />
                      </td>
                      <td>{getRepartidorLabel(pedido.repartidorEmail)}</td>
                      <td className="is-optional">{formatDateTime(pedido.fechaCreacion)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="card">
          <div className="card__header card__header--split">
            <div>
              <p className="eyebrow">Carga del turno</p>
              <h2>Concentracion operativa</h2>
            </div>
            <Link className="button ghost" to={APP_ROUTES.dispatcherRoutes}>
              Ver coordinacion
            </Link>
          </div>

          {zoneSummaries.length === 0 ? (
            <DispatcherEmptyState
              compact
              title="Sin carga distribuida"
              body="La lectura por zona y reparto ayuda a decidir donde reforzar la coordinacion del turno."
            />
          ) : (
            <>
              <div className="summary-list">
                {zoneSummaries.map((summary) => (
                  <div key={summary.zona} className="summary-list__item">
                    <div>
                      <p className="summary-list__title">{summary.zona}</p>
                      <p className="summary-list__meta">
                        {summary.pendientes} por atender - {summary.sinAsignar} sin reparto
                      </p>
                    </div>
                    <span className="summary-list__value">{summary.total}</span>
                  </div>
                ))}
              </div>

              <div className="data-note">
                <p className="eyebrow">Lectura del turno</p>
                <strong>
                  {topZone
                    ? `${topZone.zona} concentra la mayor carga actual.`
                    : "Sin zona dominante en este momento."}
                </strong>
                <span>
                  {topCourier
                    ? `${topCourier.label} lidera el reparto con ${topCourier.total} pedidos abiertos.`
                    : `${readyForDispatchPedidos.length} pedidos cuentan con reparto listo para avanzar.`}
                </span>
              </div>
            </>
          )}
        </article>
      </section>
    </section>
  );
};
