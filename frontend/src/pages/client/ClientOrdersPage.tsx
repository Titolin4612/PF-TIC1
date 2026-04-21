import { useMemo, useState, type FormEvent } from "react";
import { MetricCard } from "../../components/MetricCard";
import { PedidoStatusBadge } from "../../components/PedidoStatusBadge";
import { useClientPedidos } from "./useClientPedidos";
import type { PedidoInput, TipoCobro, TipoTamano } from "../../types/pedido";
import {
  CLIENT_STATUS_FLOW,
  getClientHeadline,
  getClientPedidoMeta,
  getClientPrimaryPedido,
  getClientSecondaryNote,
  getClientSupportCopy,
} from "../../utils/clientPresentation";
import {
  ESTADO_LABELS,
  TAMANO_LABELS,
  TIPO_COBRO_LABELS,
  formatZona,
} from "../../utils/pedidoPresentation";

const ZONA_OPTIONS = ["Medellin", "Envigado", "Bello", "Itagui", "Sabaneta"] as const;
const COBRO_OPTIONS: TipoCobro[] = ["CONTRA_ENTREGA", "PAGO_WEB"];

interface ClientCreateFormState {
  direccionEntrega: string;
  zona: string;
  peso: string;
  tamano: TipoTamano;
  fragil: boolean;
  tipoCobro: TipoCobro;
  prioritario: boolean;
}

const INITIAL_CREATE_FORM: ClientCreateFormState = {
  direccionEntrega: "",
  zona: "Medellin",
  peso: "",
  tamano: "PEQUENO",
  fragil: false,
  tipoCobro: "PAGO_WEB",
  prioritario: false,
};

export const ClientOrdersPage = () => {
  const createPanelId = "client-create-panel";
  const { pedidos, loading, refreshing, creating, error, refresh, createPedido } =
    useClientPedidos();
  const [selectedPedidoId, setSelectedPedidoId] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState<ClientCreateFormState>(INITIAL_CREATE_FORM);

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

  const handleCreateSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const createdPedido = await createPedido({
      direccionEntrega: createForm.direccionEntrega.trim(),
      estado: "CREADO",
      zona: createForm.zona.trim(),
      peso: Number(createForm.peso),
      tamano: createForm.tamano,
      fragil: createForm.fragil,
      tipoCobro: createForm.tipoCobro,
      prioritario: createForm.prioritario,
    } satisfies PedidoInput);

    if (createdPedido) {
      setCreateForm(INITIAL_CREATE_FORM);
      setSelectedPedidoId(createdPedido.id);
    }
  };

  const handleStartCreate = () => {
    document.getElementById(createPanelId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
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
            <span className="placeholder-badge">Solicitud activa</span>
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

      <section className="orders-grid orders-grid--client">
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
            <div className="driver-empty client-empty-state">
              <p className="driver-empty__eyebrow">Sin actividad</p>
              <h3 className="driver-empty__title">Aun no tienes pedidos registrados</h3>
              <p className="driver-empty__body">
                Cuando existan pedidos asociados a tu cuenta, aqui veras el estado,
                el progreso y el detalle principal de cada uno.
              </p>
              <div className="data-note">
                <p className="eyebrow">Primer paso</p>
                <strong>Solicita tu primer pedido desde este mismo panel.</strong>
                <span>
                  Cuando lo registres, aparecera aqui como pedido destacado y tambien
                  en tu listado lateral para seguir su avance.
                </span>
              </div>
              <div className="panel-actions client-empty-state__actions">
                <button type="button" className="button primary" onClick={handleStartCreate}>
                  Solicitar pedido
                </button>
                <button type="button" className="button ghost" onClick={() => void refresh()}>
                  Actualizar pedidos
                </button>
              </div>
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

        <aside className="side-stack client-orders-side">
          <article className="card client-orders-list">
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
              <div className="driver-empty driver-empty--compact client-orders-list__empty">
                <p className="driver-empty__eyebrow">Listado vacio</p>
                <h3 className="driver-empty__title">Aun no hay pedidos por mostrar</h3>
                <p className="driver-empty__body">
                  Esta bandeja mostrara tus pedidos del mas reciente al mas relevante
                  para que puedas revisar su progreso sin salir de tu panel.
                </p>
                <button type="button" className="button ghost" onClick={handleStartCreate}>
                  Ir a solicitar pedido
                </button>
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

      <section id={createPanelId} className="card">
        <div className="card__header card__header--split">
          <div>
            <p className="eyebrow">Nuevo servicio</p>
            <h2>Solicitar pedido</h2>
          </div>
          <span className="placeholder-badge">Canal cliente</span>
        </div>

        <div className="data-note">
          <p className="eyebrow">Registro</p>
          <strong>Pide un nuevo servicio sin salir de tu panel.</strong>
          <span>
            Registra la direccion, la zona y las condiciones de entrega. Tu pedido
            quedara asociado automaticamente a tu cuenta.
          </span>
        </div>

        <form className="assignment-form" onSubmit={handleCreateSubmit}>
          <div className="form__row">
            <label htmlFor="client-create-direccion">Direccion de entrega</label>
            <input
              id="client-create-direccion"
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

          <div className="form__row--two">
            <div className="form__row">
              <label htmlFor="client-create-zona">Zona</label>
              <select
                id="client-create-zona"
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
              <label htmlFor="client-create-peso">Peso (kg)</label>
              <input
                id="client-create-peso"
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
          </div>

          <div className="form__row--two">
            <div className="form__row">
              <label htmlFor="client-create-tamano">Tamano</label>
              <select
                id="client-create-tamano"
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
              <label htmlFor="client-create-cobro">Tipo de cobro</label>
              <select
                id="client-create-cobro"
                value={createForm.tipoCobro}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    tipoCobro: event.target.value as TipoCobro,
                  }))
                }
              >
                {COBRO_OPTIONS.map((tipoCobro) => (
                  <option key={tipoCobro} value={tipoCobro}>
                    {TIPO_COBRO_LABELS[tipoCobro]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="data-note">
            <p className="eyebrow">Estado inicial</p>
            <strong>{ESTADO_LABELS.CREADO}</strong>
            <span>El pedido se registra en estado creado y luego sigue el flujo operativo.</span>
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
                  Indica que este pedido necesita atencion preferente.
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
                  Marca el pedido si requiere manejo delicado en la entrega.
                </span>
              </span>
            </label>
          </div>

          <div className="panel-actions">
            <button type="submit" className="button primary block" disabled={creating}>
              {creating ? "Registrando..." : "Solicitar pedido"}
            </button>
          </div>
        </form>
      </section>
    </section>
  );
};
