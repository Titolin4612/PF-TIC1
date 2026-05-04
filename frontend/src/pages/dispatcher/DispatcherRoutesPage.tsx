import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../../api/apiFetch";
import { obtenerRutasOptimizadas } from "../../api/pedidoApi";
import { obtenerRepartidores } from "../../api/repartidorApi";
import { optimizeRoute } from "../../api/routeApi";
import { MetricCard } from "../../components/MetricCard";
import { MapErrorBoundary } from "../../components/MapErrorBoundary";
import { PedidoStatusBadge } from "../../components/PedidoStatusBadge";
import { RouteMap } from "../../components/RouteMap";
import { useGeocodedPedidos } from "../../hooks/useGeocodedPedidos";
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
  getRepartidorLabel,
} from "../../utils/pedidoPresentation";
import {
  nearestNeighborTSP,
  optimizeMultiVehicleRoutes,
  totalDistanceKm,
  type GeoStop,
  type RutasOptimizadas,
} from "../../utils/tsp";
import type { Repartidor } from "../../types/repartidor";
import { DispatcherEmptyState } from "./components/DispatcherEmptyState";
import { useDispatcherOrders } from "./useDispatcherOrders";

export const DispatcherRoutesPage = () => {
  const { pedidos, loading, refreshing, error, refresh } = useDispatcherOrders();
  const [optimizedRoute, setOptimizedRoute] = useState<GeoStop[] | null>(null);
  const [optimizedRoutes, setOptimizedRoutes] = useState<RutasOptimizadas | null>(null);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][] | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [fleetError, setFleetError] = useState<string | null>(null);
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [optimizing, setOptimizing] = useState(false);
  const activePedidos = useMemo(
    () => pedidos.filter((p) => p.estado !== "ENTREGADO" && p.estado !== "CANCELADO"),
    [pedidos]
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
  const delayedPedidos = activePedidos.filter((pedido) => pedido.alertaRetraso);
  const estimatedPedidos = activePedidos.filter((pedido) => pedido.tiempoEstimadoMinutos);
  const avgEstimatedMinutes =
    estimatedPedidos.length > 0
      ? Math.round(
          estimatedPedidos.reduce(
            (totalMinutes, pedido) => totalMinutes + (pedido.tiempoEstimadoMinutos ?? 0),
            0
          ) / estimatedPedidos.length
        )
      : 0;
  const fleetRows = useMemo(() => {
    const rowsByEmail = new Map(
      repartidores.map((repartidor) => [
        repartidor.email.toLowerCase(),
        {
          email: repartidor.email,
          label: repartidor.nombre || repartidor.email,
          disponible: repartidor.disponible ?? true,
          capacidadVehiculoKg: repartidor.capacidadVehiculoKg ?? null,
          tipoVehiculo: repartidor.tipoVehiculo ?? null,
          vehiculo: repartidor.vehiculo ?? "Vehiculo",
          placaVehiculo: repartidor.placaVehiculo ?? null,
          cargaKg: 0,
          pedidos: 0,
          enCamino: 0,
          alertas: 0,
          zonas: new Set<string>(),
        },
      ])
    );

    activePedidos
      .filter((pedido) => pedido.repartidorEmail)
      .forEach((pedido) => {
        const email = pedido.repartidorEmail!.toLowerCase();
        const row =
          rowsByEmail.get(email) ??
          {
            email: pedido.repartidorEmail!,
            label: getRepartidorLabel(pedido.repartidorEmail),
            disponible: true,
            capacidadVehiculoKg: null,
            tipoVehiculo: null,
            vehiculo: "Sin ficha",
            placaVehiculo: null,
            cargaKg: 0,
            pedidos: 0,
            enCamino: 0,
            alertas: 0,
            zonas: new Set<string>(),
          };

        row.cargaKg += pedido.peso ?? 0;
        row.pedidos += 1;
        row.enCamino += pedido.estado === "EN_CAMINO" ? 1 : 0;
        row.alertas += pedido.alertaRetraso ? 1 : 0;
        row.zonas.add(formatZona(pedido.zona));
        rowsByEmail.set(email, row);
      });

    return [...rowsByEmail.values()].sort((left, right) => {
      if (left.disponible !== right.disponible) {
        return left.disponible ? -1 : 1;
      }
      return right.alertas - left.alertas || right.cargaKg - left.cargaKg || left.label.localeCompare(right.label);
    });
  }, [activePedidos, repartidores]);
  const unavailableCount = fleetRows.filter((row) => !row.disponible).length;
  const overloadedCount = fleetRows.filter(
    (row) => row.capacidadVehiculoKg !== null && row.cargaKg > row.capacidadVehiculoKg
  ).length;

  useEffect(() => {
    let cancelled = false;

    obtenerRepartidores()
      .then((data) => {
        if (!cancelled) {
          setRepartidores(data);
          setFleetError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFleetError("No se pudo cargar la ficha de flota. Se muestra la carga por pedidos.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const { stops, geocoding, progress, total } = useGeocodedPedidos(activePedidos);
  const routeDistance = optimizedRoute
    ? (routeDistanceKm ?? totalDistanceKm(optimizedRoute))
    : null;
  const totalMultiRouteDistance = optimizedRoutes
    ? optimizedRoutes.rutas.reduce((sum, route) => sum + route.distanciaEstimada, 0).toFixed(1)
    : null;

  const handleOptimize = async () => {
    if (!stops.length) return;

    setRouteError(null);
    setOptimizing(true);

    try {
      const [response, multiVehicleResponse] = await Promise.all([
        optimizeRoute(stops),
        obtenerRutasOptimizadas(),
      ]);

      if (response?.stops?.length) {
        setOptimizedRoute(response.stops);
        setRouteDistanceKm(response.totalDistanceKm ?? null);
        setRouteGeometry((response.routeGeometry as [number, number][] | null) ?? null);
      } else {
        const fallback = nearestNeighborTSP(stops);
        setOptimizedRoute(fallback);
        setRouteDistanceKm(totalDistanceKm(fallback));
      }

      const stopsByPedidoId = new Map(stops.map((stop) => [stop.id, stop]));
      setOptimizedRoutes({
        base: multiVehicleResponse.base,
        rutas: multiVehicleResponse.rutas.map((ruta) => ({
          ...ruta,
          pedidosAsignados: ruta.pedidosAsignados.map((pedido): GeoStop => {
            const stop = stopsByPedidoId.get(pedido.id);
            return {
              id: pedido.id,
              lat: stop?.lat ?? 0,
              lng: stop?.lng ?? 0,
              label: pedido.direccionEntrega,
              subLabel: stop?.subLabel ?? `#${pedido.id} - ${pedido.zona ?? "Sin zona"}`,
              prioritario: pedido.prioritario,
              peso: pedido.peso,
              fragil: pedido.fragil,
              tiempoEstimadoMinutos: pedido.tiempoEstimadoMinutos ?? null,
              tamano: pedido.tamano,
              zona: pedido.zona,
            };
          }),
        })),
      });
    } catch (requestError) {
      const fallback = nearestNeighborTSP(stops);
      setOptimizedRoute(fallback);
      setRouteDistanceKm(totalDistanceKm(fallback));
      setOptimizedRoutes(optimizeMultiVehicleRoutes(stops));

      if (requestError instanceof ApiError) {
        if (requestError.status === 401) {
          setRouteError("Tu sesion no fue validada para esta accion. Se uso optimizacion local.");
        } else if (requestError.status === 403) {
          setRouteError("No tienes permisos para optimizar en servidor. Se uso optimizacion local.");
        } else {
          setRouteError("No se pudo optimizar en servidor. Se uso optimizacion local.");
        }
      } else {
        setRouteError("No se pudo optimizar en servidor. Se uso optimizacion local.");
      }
    } finally {
      setOptimizing(false);
    }
  };
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
      {routeError ? <div className="alert alert--error">{routeError}</div> : null}

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
          label="Alertas SLA"
          value={delayedPedidos.length}
          helper={`${avgEstimatedMinutes} min promedio estimado`}
          tone={delayedPedidos.length > 0 ? "warning" : "success"}
        />
        <MetricCard
          label="Flota no disponible"
          value={unavailableCount}
          helper={overloadedCount > 0 ? `${overloadedCount} sobre capacidad` : "Capacidad bajo control"}
          tone={unavailableCount > 0 || overloadedCount > 0 ? "warning" : "success"}
        />
      </section>

      <article className="card">
        <div className="card__header card__header--split">
          <div>
            <p className="eyebrow">Optimizacion de rutas · TSP</p>
            <h2>Mapa operativo</h2>
          </div>
          <div className="header-actions">
            {geocoding && (
              <span className="geocoding-status">
                Geocodificando {Math.round(progress * 100)}% ({Math.round(progress * total)}/{total})
              </span>
            )}
            <button
              type="button"
              className="button primary"
              disabled={geocoding || optimizing || stops.length === 0}
              onClick={() => void handleOptimize()}
            >
              {geocoding || optimizing ? "Cargando mapa..." : "Calcular ruta optima"}
            </button>
            {optimizedRoute && (
              <button
                type="button"
                className="button ghost"
                onClick={() => {
                  setOptimizedRoute(null);
                  setRouteDistanceKm(null);
                  setRouteGeometry(null);
                  setOptimizedRoutes(null);
                  setRouteError(null);
                }}
              >
                Limpiar ruta
              </button>
            )}
          </div>
        </div>

        {loading && !stops.length ? (
          <div className="map-loading">
            <div className="skeleton-row" style={{ height: "400px" }} />
          </div>
        ) : activePedidos.length === 0 ? (
          <DispatcherEmptyState
            title="Sin pedidos activos para mapear"
            body="Cuando haya pedidos en curso apareceran aqui como marcadores y podras calcular la ruta optima."
          />
        ) : (
          <>
            <MapErrorBoundary height="440px">
              <RouteMap
                stops={stops}
                route={optimizedRoute ?? undefined}
                routeGeometry={routeGeometry ?? undefined}
                height="440px"
              />
            </MapErrorBoundary>

            {optimizedRoute && (
              <div className="route-result">
                <div className="route-result__summary">
                  <span className="eyebrow">Ruta optimizada · vecino mas cercano</span>
                  <strong>{optimizedRoute.length} paradas · {routeDistance} km estimados</strong>
                </div>
                {optimizedRoutes ? (
                  <div className="data-note">
                    <p className="eyebrow">Plan multi-vehiculo</p>
                    <strong>
                      Base {optimizedRoutes.base} - {optimizedRoutes.rutas.length} vehiculos - {totalMultiRouteDistance} km
                    </strong>
                    <span>Separacion por moto/camion, capacidad y repartidores disponibles.</span>
                  </div>
                ) : null}
                <ol className="route-result__list">
                  {optimizedRoute.map((stop, i) => (
                    <li key={stop.id} className="route-result__item">
                      <span className="route-plan__rank">{i + 1}</span>
                      <div>
                        <p className="summary-list__title">
                          {stop.label}
                          {stop.prioritario ? <span className="priority-chip"> ⚡ Prioritario</span> : null}
                        </p>
                        <p className="summary-list__meta">{stop.subLabel}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                {optimizedRoutes ? (
                  <div className="route-result__list">
                    {optimizedRoutes.rutas.map((ruta) => (
                      <section
                        key={`${ruta.tipo}-${ruta.vehiculo}-${ruta.repartidor ?? "sin-repartidor"}`}
                        className="route-result__vehicle"
                      >
                        <div className="route-result__summary">
                          <span className="eyebrow">
                            {ruta.vehiculo} - {ruta.tipo} - capacidad {ruta.capacidadMaxima} pedidos
                          </span>
                          <strong>
                            {ruta.pedidosAsignados.length} pedidos - {ruta.distanciaEstimada} km - {(ruta.cargaKg ?? 0).toFixed(1)} kg
                          </strong>
                          <span className="summary-list__meta">
                            Repartidor: {ruta.repartidor ?? "Sin asignar"}
                          </span>
                        </div>
                        <ol className="route-plan">
                          {ruta.pedidosAsignados.map((stop, index) => (
                            <li key={stop.id} className="route-result__item">
                              <span className="route-plan__rank">{index + 1}</span>
                              <div>
                                <p className="summary-list__title">
                                  {stop.label}
                                  {stop.prioritario ? <span className="priority-chip"> Prioritario</span> : null}
                                </p>
                                <p className="summary-list__meta">
                                  {stop.subLabel} - {stop.tamano ?? "Sin tamano"} - {stop.peso ?? "?"} kg
                                </p>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </section>
                    ))}
                  </div>
                ) : null}
              </div>
            )}

            {!optimizedRoute && stops.length > 0 && (
              <p className="map-hint">
                {stops.length} de {activePedidos.length} pedidos geocodificados.
                {activePedidos.length > stops.length
                  ? ` (${activePedidos.length - stops.length} sin coordenadas)`
                  : ""}
                {" "}Presiona "Calcular ruta optima" para ordenar las paradas por el algoritmo del viajero.
              </p>
            )}
          </>
        )}
      </article>

      <section className="routes-top-grid">
        <article className="card order-card">
          <div className="card__header card__header--split">
            <div>
              <p className="eyebrow">Flota y capacidad</p>
              <h2>Balance operativo por repartidor</h2>
            </div>
            <span className="placeholder-badge">{fleetRows.length} repartidores</span>
          </div>

          {fleetError ? <div className="alert alert--error">{fleetError}</div> : null}

          {loading ? (
            <div className="skeleton-table">
              <div className="skeleton-row" />
              <div className="skeleton-row" />
              <div className="skeleton-row" />
            </div>
          ) : fleetRows.length === 0 ? (
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
                    <th>Disponibilidad</th>
                    <th>Carga</th>
                    <th>En camino</th>
                    <th className="is-optional">Alertas</th>
                    <th className="is-optional">Zonas</th>
                    <th>Vehiculo</th>
                  </tr>
                </thead>
                <tbody>
                  {fleetRows.map((summary) => {
                    const capacityLabel =
                      summary.capacidadVehiculoKg !== null
                        ? `${summary.cargaKg.toFixed(1)} / ${summary.capacidadVehiculoKg} kg`
                        : `${summary.cargaKg.toFixed(1)} kg`;
                    const isOverCapacity =
                      summary.capacidadVehiculoKg !== null &&
                      summary.cargaKg > summary.capacidadVehiculoKg;

                    return (
                    <tr key={summary.email}>
                      <td>
                        <div className="table-cell">
                          <p className="table-cell__primary">{summary.label}</p>
                          <p className="table-cell__secondary">
                            {summary.pedidos} pedidos activos
                          </p>
                        </div>
                      </td>
                      <td>
                        <span className={summary.disponible ? "info-pill" : "info-pill info-pill--muted"}>
                          {summary.disponible ? "Disponible" : "No disponible"}
                        </span>
                      </td>
                      <td>
                        <span className={isOverCapacity ? "priority-chip" : undefined}>
                          {capacityLabel}
                        </span>
                      </td>
                      <td>{summary.enCamino}</td>
                      <td className="is-optional">{summary.alertas}</td>
                      <td className="is-optional">{summary.zonas.size}</td>
                      <td>
                        <div className="table-cell">
                          <p className="table-cell__primary">{summary.vehiculo}</p>
                          <p className="table-cell__secondary">
                            {summary.tipoVehiculo ?? "Sin tipo"} - {summary.placaVehiculo ?? "Sin placa"}
                          </p>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
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
                    <p className="summary-list__title">Alertas SLA</p>
                    <p className="summary-list__meta">
                      Rutas fuera del tiempo estimado.
                    </p>
                  </div>
                  <span className="summary-list__value">{delayedPedidos.length}</span>
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
