import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  actualizarEstado,
  crearPedido,
  eliminarPedido,
  obtenerPedidos,
} from "./api/pedidoApi";
import type { EstadoPedido, Pedido } from "./api/pedidoApi";
import "./styles/app.css";

const estadoOptions: EstadoPedido[] = [
  "CREADO",
  "EN_PREPARACION",
  "EN_CAMINO",
  "ENTREGADO",
  "CANCELADO",
];

const estadoMeta: Record<
  EstadoPedido,
  { label: string; tone: "neutral" | "info" | "success" | "warning" | "danger" }
> = {
  CREADO: { label: "Creado", tone: "neutral" },
  EN_PREPARACION: { label: "Preparación", tone: "warning" },
  EN_CAMINO: { label: "En ruta", tone: "info" },
  ENTREGADO: { label: "Entregado", tone: "success" },
  CANCELADO: { label: "Cancelado", tone: "danger" },
};

function App() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accionEnProgreso, setAccionEnProgreso] = useState<string | null>(null);
  const [form, setForm] = useState({
    direccionEntrega: "",
    estado: "CREADO" as EstadoPedido,
  });

  const stats = useMemo(() => {
    const total = pedidos.length;
    const enRuta = pedidos.filter((p) => p.estado === "EN_CAMINO").length;
    const entregados = pedidos.filter((p) => p.estado === "ENTREGADO").length;
    const cancelados = pedidos.filter((p) => p.estado === "CANCELADO").length;
    const pendientes = pedidos.filter(
      (p) => p.estado === "CREADO" || p.estado === "EN_PREPARACION"
    ).length;
    return { total, enRuta, entregados, cancelados, pendientes };
  }, [pedidos]);

  const cargarPedidos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await obtenerPedidos();
      if (!Array.isArray(data)) {
        throw new Error("Formato de datos inesperado al obtener pedidos");
      }
      setPedidos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al obtener pedidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPedidos();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.direccionEntrega.trim()) {
      setError("La dirección es obligatoria");
      return;
    }
    setAccionEnProgreso("crear");
    setError(null);
    try {
      await crearPedido(form);
      setForm({ direccionEntrega: "", estado: "CREADO" });
      await cargarPedidos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el pedido");
    } finally {
      setAccionEnProgreso(null);
    }
  };

  const handleCambiarEstado = async (id: number, estado: EstadoPedido) => {
    setAccionEnProgreso(`estado-${id}`);
    setError(null);
    try {
      await actualizarEstado(id, estado);
      await cargarPedidos();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo actualizar el estado"
      );
    } finally {
      setAccionEnProgreso(null);
    }
  };

  const handleEliminar = async (id: number) => {
    setAccionEnProgreso(`eliminar-${id}`);
    setError(null);
    try {
      await eliminarPedido(id);
      await cargarPedidos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el pedido");
    } finally {
      setAccionEnProgreso(null);
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand__dot" />
          <div>
            <p className="brand__eyebrow">SmartRoute</p>
            <p className="brand__title">Panel de Despacho</p>
          </div>
        </div>
        <nav className="nav">
          <button className="nav__item">Dashboard</button>
          <button className="nav__item nav__item--active">Gestión de Pedidos</button>
          <button className="nav__item">Gestión de Rutas</button>
        </nav>
        <div className="user-chip">Gerente</div>
      </header>

      <main className="content">
        <section className="kpi-grid">
          <article className="kpi-card">
            <p className="kpi-label">Pedidos pendientes</p>
            <p className="kpi-value">{stats.pendientes}</p>
          </article>
          <article className="kpi-card">
            <p className="kpi-label">En ruta</p>
            <p className="kpi-value">{stats.enRuta}</p>
          </article>
          <article className="kpi-card">
            <p className="kpi-label">Entregados</p>
            <p className="kpi-value">{stats.entregados}</p>
          </article>
          <article className="kpi-card">
            <p className="kpi-label">Cancelados</p>
            <p className="kpi-value">{stats.cancelados}</p>
          </article>
        </section>

        <section className="orders-grid">
          <article className="card order-card">
            <div className="card__header card__header--split">
              <div>
                <p className="eyebrow">Operaciones</p>
                <h2>Gestión de pedidos</h2>
              </div>
              <div className="header-actions">
                <button
                  className="button ghost"
                  onClick={cargarPedidos}
                  disabled={loading}
                >
                  {loading ? "Actualizando..." : "Refrescar"}
                </button>
              </div>
            </div>

            {error && <div className="alert alert--error">{error}</div>}

            {loading ? (
              <div className="skeleton-table">
                <div className="skeleton-row" />
                <div className="skeleton-row" />
                <div className="skeleton-row" />
              </div>
            ) : pedidos.length === 0 ? (
              <div className="empty">
                <p className="empty__title">Sin pedidos aún</p>
                <p className="empty__body">
                  Crea tu primer pedido para comenzar a despachar.
                </p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table orders-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Dirección</th>
                      <th>Estado</th>
                      <th className="is-optional">Ventana</th>
                      <th className="is-optional">Prioridad</th>
                      <th className="is-optional">Repartidor</th>
                      <th>Creado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidos.map((pedido) => (
                      <tr key={pedido.id} className="orders-row">
                        <td className="mono">#{pedido.id}</td>
                        <td>{pedido.direccionEntrega}</td>
                        <td>
                          <span
                            className={`status-badge status-${estadoMeta[pedido.estado].tone}`}
                          >
                            {estadoMeta[pedido.estado].label}
                          </span>
                        </td>
                        <td className="is-optional">
                          <span className="placeholder-badge">N/D</span>
                        </td>
                        <td className="is-optional">
                          <span className="placeholder-badge">N/D</span>
                        </td>
                        <td className="is-optional">
                          <span className="placeholder-badge">N/D</span>
                        </td>
                        <td>
                          {(() => {
                            const fecha = pedido.fechaCreacion
                              ? new Date(pedido.fechaCreacion)
                              : null;
                            return fecha && !isNaN(fecha.getTime())
                              ? fecha.toLocaleString("es-ES")
                              : "—";
                          })()}
                        </td>
                        <td className="actions">
                          <select
                            className="input-inline"
                            value={pedido.estado}
                            onChange={(e) =>
                              handleCambiarEstado(
                                pedido.id,
                                e.target.value as EstadoPedido
                              )
                            }
                            disabled={accionEnProgreso === `estado-${pedido.id}`}
                          >
                            {estadoOptions.map((estado) => (
                              <option key={estado} value={estado}>
                                {estadoMeta[estado].label}
                              </option>
                            ))}
                          </select>
                          <button
                            className="button danger"
                            onClick={() => handleEliminar(pedido.id)}
                            disabled={accionEnProgreso === `eliminar-${pedido.id}`}
                          >
                            {accionEnProgreso === `eliminar-${pedido.id}`
                              ? "Eliminando..."
                              : "Eliminar"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          <aside className="card create-card">
            <div className="card__header">
              <p className="eyebrow">Nuevo</p>
              <h2>Crear pedido</h2>
            </div>
            <form className="form" onSubmit={handleSubmit}>
              <div className="form__row">
                <label htmlFor="direccion">Dirección de entrega</label>
                <input
                  id="direccion"
                  type="text"
                  value={form.direccionEntrega}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      direccionEntrega: e.target.value,
                    }))
                  }
                  placeholder="Ej. Calle 10 #43-25, El Poblado"
                />
              </div>
              <div className="form__row">
                <label htmlFor="estado">Estado inicial</label>
                <select
                  id="estado"
                  value={form.estado}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      estado: e.target.value as EstadoPedido,
                    }))
                  }
                >
                  {estadoOptions.map((estado) => (
                    <option key={estado} value={estado}>
                      {estadoMeta[estado].label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form__actions">
                <button
                  type="submit"
                  disabled={accionEnProgreso === "crear"}
                  className="button primary block"
                >
                  {accionEnProgreso === "crear" ? "Creando..." : "Crear pedido"}
                </button>
              </div>
            </form>
          </aside>

          <aside className="card map-card">
            <div className="card__header">
              <p className="eyebrow">Vista rápida</p>
              <h2>Mapa Operativo</h2>
            </div>
            <div className="map-placeholder">
              <p>Integración de mapa pendiente</p>
              <span>Mock visual</span>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default App;
