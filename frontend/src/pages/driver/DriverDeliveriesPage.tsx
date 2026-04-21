import { Link } from "react-router-dom";
import { PedidoStatusBadge } from "../../components/PedidoStatusBadge";
import { APP_ROUTES } from "../../router/paths";
import {
  TAMANO_LABELS,
  TIPO_COBRO_LABELS,
  formatDateTime,
  formatZona,
} from "../../utils/pedidoPresentation";
import {
  getDriverActionCopy,
  getDriverActionLabel,
  getDriverPrimaryPedido,
  getDriverPriorityMessage,
  isDriverActionablePedido,
} from "../../utils/driverPresentation";
import { useDriverPedidos } from "./useDriverPedidos";

const getDriverRoutePath = (pedidoId: number): string =>
  `${APP_ROUTES.driverRoute}?pedido=${pedidoId}`;

export const DriverDeliveriesPage = () => {
  const { pedidos, loading, refreshing, error, refresh } = useDriverPedidos();
  const featuredPedido = getDriverPrimaryPedido(pedidos);
  const activePedidos = pedidos.filter(isDriverActionablePedido);
  const enCaminoCount = activePedidos.filter((pedido) => pedido.estado === "EN_CAMINO").length;
  const priorityCount = activePedidos.filter((pedido) => pedido.prioritario).length;
  const contraEntregaCount = activePedidos.filter(
    (pedido) => pedido.tipoCobro === "CONTRA_ENTREGA"
  ).length;
  const closedCount = pedidos.length - activePedidos.length;
  const featuredRoute = featuredPedido ? getDriverRoutePath(featuredPedido.id) : null;
  const leadingZone = featuredPedido ? formatZona(featuredPedido.zona) : null;

  return (
    <section className="page-stack driver-page">
      <header className="card page-hero driver-hero">
        <div className="card__header card__header--split">
          <div>
            <p className="eyebrow">Jornada activa</p>
            <h1>Mis entregas</h1>
            <p className="page-hero__description">
              Consulta tu carga asignada, ubica la siguiente parada y entra directo
              a la entrega que debes mover ahora.
            </p>
          </div>

          <div className="header-actions">
            <button type="button" className="button ghost" onClick={() => void refresh()}>
              {loading || refreshing ? "Actualizando..." : "Actualizar jornada"}
            </button>
            {featuredRoute ? (
              <Link className="button primary" to={featuredRoute}>
                Abrir entrega activa
              </Link>
            ) : null}
          </div>
        </div>

        <section className="driver-pulse" aria-label="Resumen del turno">
          <div className="driver-pulse__item">
            <span className="driver-pulse__label">Pendientes</span>
            <strong>{activePedidos.length}</strong>
            <span className="driver-pulse__helper">Entregas por mover hoy</span>
          </div>
          <div className="driver-pulse__item">
            <span className="driver-pulse__label">En camino</span>
            <strong>{enCaminoCount}</strong>
            <span className="driver-pulse__helper">Paradas que ya van en calle</span>
          </div>
          <div className="driver-pulse__item">
            <span className="driver-pulse__label">Prioridad alta</span>
            <strong>{priorityCount}</strong>
            <span className="driver-pulse__helper">Merecen foco inmediato</span>
          </div>
          <div className="driver-pulse__item">
            <span className="driver-pulse__label">Cerradas</span>
            <strong>{closedCount}</strong>
            <span className="driver-pulse__helper">Entregas ya resueltas</span>
          </div>
        </section>
      </header>

      {error ? <div className="alert alert--error">{error}</div> : null}

      <section className="driver-grid">
        <article className="card driver-focus">
          <div className="card__header card__header--split">
            <div>
              <p className="eyebrow">Siguiente movimiento</p>
              <h2>{featuredPedido ? "Entrega que va al frente" : "Esperando asignaciones"}</h2>
            </div>
            {featuredPedido ? <PedidoStatusBadge estado={featuredPedido.estado} /> : null}
          </div>

          {loading ? (
            <div className="skeleton-table">
              <div className="skeleton-row" />
              <div className="skeleton-row" />
              <div className="skeleton-row" />
            </div>
          ) : featuredPedido ? (
            <div className="driver-focus__body">
              <div className="driver-focus__headline">
                <div>
                  <h3>{featuredPedido.direccionEntrega}</h3>
                  <p className="driver-copy">{getDriverActionCopy(featuredPedido)}</p>
                </div>
              </div>

              <div className="driver-focus__meta">
                <div className="driver-mini-stat">
                  <span className="driver-mini-stat__label">Zona</span>
                  <strong>{formatZona(featuredPedido.zona)}</strong>
                </div>
                <div className="driver-mini-stat">
                  <span className="driver-mini-stat__label">Cobro</span>
                  <strong>{TIPO_COBRO_LABELS[featuredPedido.tipoCobro]}</strong>
                </div>
                <div className="driver-mini-stat">
                  <span className="driver-mini-stat__label">Carga</span>
                  <strong>
                    {TAMANO_LABELS[featuredPedido.tamano]} - {featuredPedido.peso} kg
                  </strong>
                </div>
                <div className="driver-mini-stat">
                  <span className="driver-mini-stat__label">Registro</span>
                  <strong>{formatDateTime(featuredPedido.fechaCreacion)}</strong>
                </div>
              </div>

              <div className="driver-chip-row">
                {featuredPedido.prioritario ? (
                  <span className="driver-chip driver-chip--priority">Prioridad alta</span>
                ) : (
                  <span className="driver-chip">Turno normal</span>
                )}
                <span className="driver-chip">
                  {featuredPedido.fragil ? "Manejo delicado" : "Carga estandar"}
                </span>
                <span className="driver-chip">{getDriverPriorityMessage(featuredPedido)}</span>
              </div>

              <div className="driver-focus__actions">
                <Link className="button primary" to={getDriverRoutePath(featuredPedido.id)}>
                  {getDriverActionLabel(featuredPedido)}
                </Link>
                <span className="driver-inline-note">
                  Abre esta vista para registrar avances sin salir de la jornada.
                </span>
              </div>
            </div>
          ) : (
            <div className="driver-empty">
              <p className="driver-empty__eyebrow">Turno libre</p>
              <h3 className="driver-empty__title">Aun no tienes entregas asignadas</h3>
              <p className="driver-empty__body">
                En cuanto aparezcan pedidos para tu correo, esta bandeja los ordenara
                por prioridad, salida activa y estado del recorrido.
              </p>
            </div>
          )}
        </article>

        <aside className="card driver-sidecard">
          <div className="card__header">
            <div>
              <p className="eyebrow">Lectura rapida</p>
              <h2>Lo que pide atencion</h2>
            </div>
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
                Tu panel mostrara aqui el ritmo del turno, las prioridades y los
                recordatorios clave antes de salir a entrega.
              </p>
            </div>
          ) : (
            <div className="driver-readout">
              <div className="driver-readout__item">
                <div>
                  <p className="driver-readout__title">Paradas en calle</p>
                  <p className="driver-readout__body">
                    Entregas que ya van en recorrido y piden cierre.
                  </p>
                </div>
                <strong>{enCaminoCount}</strong>
              </div>

              <div className="driver-readout__item">
                <div>
                  <p className="driver-readout__title">Cobro contra entrega</p>
                  <p className="driver-readout__body">
                    Pedidos que requieren confirmar cobro al llegar.
                  </p>
                </div>
                <strong>{contraEntregaCount}</strong>
              </div>

              <div className="driver-readout__item">
                <div>
                  <p className="driver-readout__title">Zona al frente</p>
                  <p className="driver-readout__body">
                    {leadingZone
                      ? `La siguiente salida empieza por ${leadingZone}.`
                      : "Sin zona dominante en este momento."}
                  </p>
                </div>
                <strong>{leadingZone ?? "Sin zona"}</strong>
              </div>
            </div>
          )}
        </aside>
      </section>

      <article className="card driver-queue-card">
        <div className="card__header card__header--split">
          <div>
            <p className="eyebrow">Bandeja de trabajo</p>
            <h2>Entregas asignadas</h2>
          </div>
          <span className="placeholder-badge">{pedidos.length} entregas visibles</span>
        </div>

        {loading ? (
          <div className="driver-queue driver-queue--loading">
            <div className="driver-queue__skeleton" />
            <div className="driver-queue__skeleton" />
            <div className="driver-queue__skeleton" />
          </div>
        ) : pedidos.length === 0 ? (
          <div className="driver-empty">
            <p className="driver-empty__eyebrow">Bandeja lista</p>
            <h3 className="driver-empty__title">No tienes entregas pendientes</h3>
            <p className="driver-empty__body">
              Esta vista queda preparada para mostrar tu cola del turno, resaltar lo
              urgente y llevarte directo a la entrega activa apenas llegue una nueva
              asignacion.
            </p>
          </div>
        ) : (
          <div className="driver-queue">
            {pedidos.map((pedido) => {
              const isFeatured = featuredPedido?.id === pedido.id;
              const routePath = getDriverRoutePath(pedido.id);

              return (
                <article
                  key={pedido.id}
                  className={`driver-queue__item${isFeatured ? " driver-queue__item--featured" : ""}`}
                >
                  <div className="driver-queue__top">
                    <div className="driver-queue__labels">
                      <span className="driver-order-id">Pedido #{pedido.id}</span>
                      {isFeatured ? <span className="driver-chip">Siguiente</span> : null}
                      {pedido.prioritario ? (
                        <span className="driver-chip driver-chip--priority">Prioridad alta</span>
                      ) : null}
                    </div>
                    <PedidoStatusBadge estado={pedido.estado} />
                  </div>

                  <div className="driver-queue__body">
                    <div>
                      <h3>{pedido.direccionEntrega}</h3>
                      <p className="driver-copy">{getDriverPriorityMessage(pedido)}</p>
                    </div>
                    <Link
                      className={isFeatured ? "button primary" : "button ghost"}
                      to={routePath}
                    >
                      {isDriverActionablePedido(pedido) ? "Abrir entrega" : "Ver cierre"}
                    </Link>
                  </div>

                  <div className="driver-queue__meta">
                    <span>{formatZona(pedido.zona)}</span>
                    <span>{TIPO_COBRO_LABELS[pedido.tipoCobro]}</span>
                    <span>{pedido.fragil ? "Fragil" : "Carga estandar"}</span>
                    <span>
                      {TAMANO_LABELS[pedido.tamano]} - {pedido.peso} kg
                    </span>
                    <span>{formatDateTime(pedido.fechaCreacion)}</span>
                  </div>

                  <div className="driver-queue__footer">
                    <strong>{getDriverActionLabel(pedido)}</strong>
                    <span>
                      {isDriverActionablePedido(pedido)
                        ? "Sigue el detalle operativo para avanzar rapido."
                        : "Pedido cerrado dentro de tu jornada."}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </article>
    </section>
  );
};
