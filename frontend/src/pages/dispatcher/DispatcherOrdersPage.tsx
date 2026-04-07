import { useMemo, useState } from "react";
import { MetricCard } from "../../components/MetricCard";
import type { PedidoInput } from "../../api/pedidoApi";
import {
  getCourierSummaries,
  getPedidoMetrics,
  getPedidosNeedingAttention,
  getUnassignedPedidos,
  getZoneSummaries,
} from "../../utils/dispatcherInsights";
import {
  ESTADO_LABELS,
  formatZona,
  getClienteLabel,
  getDispatcherActionLabel,
  getPriorityLabel,
} from "../../utils/pedidoPresentation";
import { DispatcherAssignmentPanel } from "./components/DispatcherAssignmentPanel";
import { DispatcherEmptyState } from "./components/DispatcherEmptyState";
import { DispatcherOrdersTable } from "./components/DispatcherOrdersTable";
import { useDispatcherOrders } from "./useDispatcherOrders";

type AssignmentFilter = "ALL" | "ASSIGNED" | "UNASSIGNED";

export const DispatcherOrdersPage = () => {
  const createPanelId = "dispatcher-create-panel";
  const {
    pedidos,
    loading,
    refreshing,
    rowAction,
    error,
    refresh,
    createPedido,
    updateStatus,
    assignCourier,
    removePedido,
  } = useDispatcherOrders();
  const [search, setSearch] = useState("");
  const [selectedEstado, setSelectedEstado] = useState("");
  const [selectedZona, setSelectedZona] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>("ALL");
  const [selectedPedidoId, setSelectedPedidoId] = useState<number | null>(null);
  const [assignmentEmail, setAssignmentEmail] = useState("");

  const zoneOptions = useMemo(
    () =>
      [...new Set(pedidos.map((pedido) => formatZona(pedido.zona)))].sort((left, right) =>
        left.localeCompare(right)
      ),
    [pedidos]
  );

  const normalizedSearch = search.trim().toLowerCase();
  const hasActiveFilters =
    normalizedSearch.length > 0 ||
    selectedEstado.length > 0 ||
    selectedZona.length > 0 ||
    assignmentFilter !== "ALL";

  const filteredPedidos = useMemo(
    () =>
      pedidos.filter((pedido) => {
        const searchableContent = [
          pedido.id,
          pedido.direccionEntrega,
          pedido.zona,
          pedido.clienteEmail ?? "",
          pedido.repartidorEmail ?? "",
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          normalizedSearch.length === 0 || searchableContent.includes(normalizedSearch);
        const matchesEstado =
          selectedEstado.length === 0 || pedido.estado === selectedEstado;
        const matchesZona =
          selectedZona.length === 0 || formatZona(pedido.zona) === selectedZona;
        const matchesAssignment =
          assignmentFilter === "ALL" ||
          (assignmentFilter === "ASSIGNED" && Boolean(pedido.repartidorEmail)) ||
          (assignmentFilter === "UNASSIGNED" && !pedido.repartidorEmail);

        return matchesSearch && matchesEstado && matchesZona && matchesAssignment;
      }),
    [assignmentFilter, normalizedSearch, pedidos, selectedEstado, selectedZona]
  );

  const fallbackPedido =
    filteredPedidos.find((pedido) => !pedido.repartidorEmail) ?? filteredPedidos[0] ?? null;
  const selectedPedido =
    filteredPedidos.find((pedido) => pedido.id === selectedPedidoId) ?? fallbackPedido;
  const visibleAssignmentEmail =
    selectedPedido !== null && selectedPedido.id === selectedPedidoId
      ? assignmentEmail
      : selectedPedido?.repartidorEmail ?? "";

  const metrics = getPedidoMetrics(filteredPedidos);
  const unassignedPedidos = getUnassignedPedidos(filteredPedidos);
  const unassignedPreview = unassignedPedidos.slice(0, 4);
  const focusPedidos = getPedidosNeedingAttention(filteredPedidos).slice(0, 4);
  const zoneSummaries = getZoneSummaries(filteredPedidos).slice(0, 4);
  const courierSummaries = getCourierSummaries(filteredPedidos).filter(
    (summary) => summary.repartidorEmail
  );
  const activeCourierCount = courierSummaries.length;
  const topZone = zoneSummaries[0];
  const activePedidosCount = filteredPedidos.filter(
    (pedido) => pedido.estado !== "ENTREGADO" && pedido.estado !== "CANCELADO"
  ).length;

  const handleResetFilters = () => {
    setSearch("");
    setSelectedEstado("");
    setSelectedZona("");
    setAssignmentFilter("ALL");
  };

  const handleSelectPedido = (pedidoId: number) => {
    const pedido = pedidos.find((currentPedido) => currentPedido.id === pedidoId);
    setSelectedPedidoId(pedidoId);
    setAssignmentEmail(pedido?.repartidorEmail ?? "");
  };

  const handleStartCreate = () => {
    document.getElementById(createPanelId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleCreatePedido = async (pedido: PedidoInput) => {
    const createdPedido = await createPedido(pedido);

    if (createdPedido) {
      setSelectedPedidoId(createdPedido.id);
      setAssignmentEmail(createdPedido.repartidorEmail ?? "");
    }

    return createdPedido;
  };

  const handleSubmitAssignment = async () => {
    if (!selectedPedido || visibleAssignmentEmail.trim().length === 0) {
      return;
    }

    const updatedPedido = await assignCourier(selectedPedido.id, visibleAssignmentEmail);

    if (updatedPedido) {
      setSelectedPedidoId(updatedPedido.id);
      setAssignmentEmail(updatedPedido.repartidorEmail ?? "");
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedPedido) {
      return;
    }

    await removePedido(selectedPedido.id);
  };

  return (
    <section className="page-stack">
      <header className="card page-hero">
        <div className="card__header card__header--split">
          <div>
            <p className="eyebrow">Centro de control</p>
            <h1>Gestion de pedidos</h1>
            <p className="page-hero__description">
              Administra el estado de cada solicitud, asigna repartos y manten la
              operacion del dia con decisiones rapidas y claras.
            </p>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="button primary"
              onClick={handleStartCreate}
            >
              Nuevo pedido
            </button>
            <button type="button" className="button ghost" onClick={() => void refresh()}>
              {loading || refreshing ? "Actualizando..." : "Refrescar"}
            </button>
          </div>
        </div>
      </header>

      {error ? <div className="alert alert--error">{error}</div> : null}

      <section className="kpi-grid">
        <MetricCard
          label="Pedidos visibles"
          value={filteredPedidos.length}
          helper={`${pedidos.length} en total`}
        />
        <MetricCard label="Activos" value={activePedidosCount} tone="info" />
        <MetricCard label="Sin reparto" value={unassignedPedidos.length} />
        <MetricCard label="Repartidores activos" value={activeCourierCount} />
        <MetricCard label="En camino" value={metrics.enCamino} tone="warning" />
        <MetricCard label="Entregados" value={metrics.entregados} tone="success" />
      </section>

      <section className="orders-workspace">
        <article className="card order-card order-card--control">
          <div className="card__header card__header--split">
            <div>
              <p className="eyebrow">Listado completo</p>
              <h2>Pedidos del turno</h2>
            </div>
            <div className="header-actions">
              {hasActiveFilters ? (
                <button type="button" className="button ghost" onClick={handleResetFilters}>
                  Limpiar filtros
                </button>
              ) : null}
              <span className="placeholder-badge">{filteredPedidos.length} pedidos</span>
            </div>
          </div>

          <div className="toolbar-strip">
            <div className="toolbar-strip__group">
              <span className="info-pill info-pill--muted">{activePedidosCount} activos</span>
              <span className="info-pill info-pill--muted">
                {unassignedPedidos.length} sin reparto
              </span>
              <span className="info-pill info-pill--accent">
                {metrics.prioritarios} prioritarios
              </span>
              <span className="info-pill info-pill--muted">{metrics.enCamino} en calle</span>
            </div>
            <div className="toolbar-strip__group">
              <span className="placeholder-badge">
                {activeCourierCount} repartidores con carga
              </span>
              <span className="placeholder-badge">
                {topZone ? `${topZone.zona} concentra la mayor carga` : "Sin zona dominante"}
              </span>
            </div>
          </div>

          <div className="filters filters--dispatcher">
            <div className="form__row">
              <label htmlFor="pedido-search">Buscar</label>
              <input
                id="pedido-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Pedido, cliente, direccion o reparto"
              />
            </div>

            <div className="form__row">
              <label htmlFor="pedido-estado">Estado</label>
              <select
                id="pedido-estado"
                value={selectedEstado}
                onChange={(event) => setSelectedEstado(event.target.value)}
              >
                <option value="">Todos</option>
                {Object.entries(ESTADO_LABELS).map(([estado, label]) => (
                  <option key={estado} value={estado}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form__row">
              <label htmlFor="pedido-zona">Zona</label>
              <select
                id="pedido-zona"
                value={selectedZona}
                onChange={(event) => setSelectedZona(event.target.value)}
              >
                <option value="">Todas</option>
                {zoneOptions.map((zona) => (
                  <option key={zona} value={zona}>
                    {zona}
                  </option>
                ))}
              </select>
            </div>

            <div className="form__row">
              <label htmlFor="pedido-reparto">Reparto</label>
              <select
                id="pedido-reparto"
                value={assignmentFilter}
                onChange={(event) =>
                  setAssignmentFilter(event.target.value as AssignmentFilter)
                }
              >
                <option value="ALL">Todos</option>
                <option value="ASSIGNED">Asignados</option>
                <option value="UNASSIGNED">Sin asignar</option>
              </select>
            </div>
          </div>

          <DispatcherOrdersTable
            pedidos={filteredPedidos}
            totalPedidos={pedidos.length}
            hasActiveFilters={hasActiveFilters}
            loading={loading}
            selectedPedidoId={selectedPedidoId}
            rowAction={rowAction}
            onSelectPedido={(pedido) => handleSelectPedido(pedido.id)}
            onUpdateStatus={(id, estado) => void updateStatus(id, estado)}
            onResetFilters={handleResetFilters}
          />
        </article>

        <aside className="side-stack side-stack--sticky">
          <DispatcherAssignmentPanel
            isCreating={false}
            sticky
            selectedPedido={selectedPedido}
            assignmentEmail={visibleAssignmentEmail}
            hasPedidos={pedidos.length > 0}
            hasActiveFilters={hasActiveFilters}
            creating={rowAction === "crear"}
            submitting={
              selectedPedido !== null && rowAction === `asignar-${selectedPedido.id}`
            }
            deleting={
              selectedPedido !== null && rowAction === `eliminar-${selectedPedido.id}`
            }
            onCreatePedido={(pedido) => handleCreatePedido(pedido)}
            onAssignmentEmailChange={(value) => {
              if (selectedPedido) {
                setSelectedPedidoId(selectedPedido.id);
              }
              setAssignmentEmail(value);
            }}
            onSubmitAssignment={() => void handleSubmitAssignment()}
            onDeletePedido={() => void handleDeleteSelected()}
            onResetFilters={handleResetFilters}
            onStartCreate={handleStartCreate}
          />
        </aside>
      </section>

      <section id={createPanelId}>
        <DispatcherAssignmentPanel
          isCreating
          sticky={false}
          selectedPedido={selectedPedido}
          assignmentEmail={visibleAssignmentEmail}
          hasPedidos={pedidos.length > 0}
          hasActiveFilters={hasActiveFilters}
          creating={rowAction === "crear"}
          submitting={false}
          deleting={false}
          onCreatePedido={(pedido) => handleCreatePedido(pedido)}
          onAssignmentEmailChange={() => {}}
          onSubmitAssignment={() => {}}
          onDeletePedido={() => {}}
          onResetFilters={handleResetFilters}
          onStartCreate={handleStartCreate}
        />
      </section>

      <section className="dispatcher-support-grid">
        <article className="card">
          <div className="card__header">
            <div>
              <p className="eyebrow">Pendientes de reparto</p>
              <h2>Frentes para asignar primero</h2>
            </div>
          </div>

          {unassignedPreview.length === 0 ? (
            <DispatcherEmptyState
              compact
              title={
                pedidos.length === 0
                  ? "Sin pedidos en el turno"
                  : "Toda la carga visible tiene reparto"
              }
              body="El listado central y la ficha lateral mantienen la asignacion bajo control sin salir de la vista."
            />
          ) : (
            <div className="summary-list">
              {unassignedPreview.map((pedido) => (
                <button
                  key={pedido.id}
                  type="button"
                  className="summary-list__item summary-list__item--button"
                  onClick={() => handleSelectPedido(pedido.id)}
                >
                  <div>
                    <p className="summary-list__title">{pedido.direccionEntrega}</p>
                    <p className="summary-list__meta">
                      {formatZona(pedido.zona)} - {getClienteLabel(pedido.clienteEmail)}
                    </p>
                  </div>
                  <span className="summary-list__value">Asignar</span>
                </button>
              ))}
            </div>
          )}
        </article>

        <article className="card">
          <div className="card__header">
            <div>
              <p className="eyebrow">Seguimiento cercano</p>
              <h2>Pedidos que piden accion</h2>
            </div>
          </div>

          {focusPedidos.length === 0 ? (
            <DispatcherEmptyState
              compact
              title={
                pedidos.length === 0
                  ? "Sin frentes activos"
                  : "La vista actual no muestra pendientes criticos"
              }
              body="Usa los filtros para revisar otra zona, otro estado o la carga sin reparto."
              actions={
                hasActiveFilters
                  ? [{ label: "Limpiar filtros", onClick: handleResetFilters }]
                  : []
              }
            />
          ) : (
            <div className="summary-list">
              {focusPedidos.map((pedido) => (
                <button
                  key={pedido.id}
                  type="button"
                  className="summary-list__item summary-list__item--button"
                  onClick={() => handleSelectPedido(pedido.id)}
                >
                  <div>
                    <p className="summary-list__title">{pedido.direccionEntrega}</p>
                    <p className="summary-list__meta">
                      {getClienteLabel(pedido.clienteEmail)} - {getDispatcherActionLabel(pedido)}
                    </p>
                  </div>
                  <span className="summary-list__value">
                    {pedido.repartidorEmail ? getPriorityLabel(pedido.prioritario) : "Asignar"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </article>

        <article className="card">
          <div className="card__header">
            <div>
              <p className="eyebrow">Carga por zona</p>
              <h2>Balance del turno</h2>
            </div>
          </div>

          {zoneSummaries.length === 0 ? (
            <DispatcherEmptyState
              compact
              title="Sin carga territorial visible"
              body="El balance por zona ayuda a ubicar concentracion, reparto pendiente y frentes que merecen refuerzo."
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
                    ? `${topZone.zona} concentra ${topZone.total} pedidos visibles.`
                    : "Sin concentracion dominante."}
                </strong>
                <span>
                  {activeCourierCount > 0
                    ? `${activeCourierCount} repartidores llevan carga visible en esta vista.`
                    : "No hay repartidores con carga en la vista actual."}
                </span>
              </div>
            </>
          )}
        </article>
      </section>
    </section>
  );
};
