import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  actualizarEstado,
  crearPedido,
  eliminarPedido,
  obtenerPedidos,
  type EstadoPedido,
  type Pedido,
  type PedidoInput,
  type TipoCobro,
  type TipoTamano,
} from "./api/pedidoApi";
import "./styles/app.css";

const estadoOptions: EstadoPedido[] = [
  "CREADO",
  "EN_PREPARACION",
  "EN_CAMINO",
  "ENTREGADO",
  "CANCELADO",
];

const tamanoOptions: TipoTamano[] = ["PEQUENO", "MEDIANO", "GRANDE"];
const cobroOptions: TipoCobro[] = ["CONTRA_ENTREGA", "WEB"];

const initialForm: PedidoInput = {
  direccionEntrega: "",
  estado: "CREADO",
  zona: "",
  peso: 1,
  tamano: "MEDIANO",
  fragil: false,
  tipoCobro: "CONTRA_ENTREGA",
  prioritario: false,
};

function App() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [form, setForm] = useState<PedidoInput>(initialForm);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [rowAction, setRowAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = pedidos.length;
    const creados = pedidos.filter((p) => p.estado === "CREADO").length;
    const enProceso = pedidos.filter((p) => p.estado === "EN_PREPARACION").length;
    const entregados = pedidos.filter((p) => p.estado === "ENTREGADO").length;
    const cancelados = pedidos.filter((p) => p.estado === "CANCELADO").length;
    return { total, creados, enProceso, entregados, cancelados };
  }, [pedidos]);

  const cargarPedidos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await obtenerPedidos();
      setPedidos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar pedidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPedidos();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setError(null);

    try {
      await crearPedido(form);
      setForm(initialForm);
      await cargarPedidos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el pedido");
    } finally {
      setCreating(false);
    }
  };

  const handleCambiarEstado = async (id: number, estado: EstadoPedido) => {
    setRowAction(`estado-${id}`);
    setError(null);
    try {
      await actualizarEstado(id, estado);
      await cargarPedidos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el estado");
    } finally {
      setRowAction(null);
    }
  };

  const handleEliminar = async (id: number) => {
    setRowAction(`eliminar-${id}`);
    setError(null);
    try {
      await eliminarPedido(id);
      await cargarPedidos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el pedido");
    } finally {
      setRowAction(null);
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
          <button className="nav__item nav__item--active">Gestion de Pedidos</button>
          <button className="nav__item">Gestion de Rutas</button>
        </nav>
        <div className="user-chip">Gerente</div>
      </header>

      <main className="content">
        <section className="kpi-grid">
          <article className="kpi-card">
            <p className="kpi-label">Total</p>
            <p className="kpi-value">{stats.total}</p>
          </article>
          <article className="kpi-card">
            <p className="kpi-label">Creados</p>
            <p className="kpi-value">{stats.creados}</p>
          </article>
          <article className="kpi-card">
            <p className="kpi-label">En proceso</p>
            <p className="kpi-value">{stats.enProceso}</p>
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
                <h2>Listado de pedidos</h2>
              </div>
              <button className="button ghost" onClick={cargarPedidos} disabled={loading}>
                {loading ? "Actualizando..." : "Refrescar"}
              </button>
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
                <p className="empty__title">Sin pedidos</p>
                <p className="empty__body">Crea un pedido para ver datos aqui.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table orders-table">
                  <thead>
                    <tr>
                      <th>Direccion</th>
                      <th>Estado</th>
                      <th>Zona</th>
                      <th>Peso</th>
                      <th>Tamano</th>
                      <th>Fragil</th>
                      <th>Tipo cobro</th>
                      <th>Prioritario</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidos.map((pedido) => (
                      <tr key={pedido.id}>
                        <td>{pedido.direccionEntrega}</td>
                        <td>{pedido.estado}</td>
                        <td>{pedido.zona}</td>
                        <td>{pedido.peso}</td>
                        <td>{pedido.tamano}</td>
                        <td>{pedido.fragil === true ? "Si" : "No"}</td>
                        <td>{pedido.tipoCobro}</td>
                        <td>{pedido.prioritario === true ? "Si" : "No"}</td>
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
                            disabled={rowAction === `estado-${pedido.id}`}
                          >
                            {estadoOptions.map((estado) => (
                              <option key={estado} value={estado}>
                                {estado}
                              </option>
                            ))}
                          </select>
                          <button
                            className="button danger"
                            onClick={() => handleEliminar(pedido.id)}
                            disabled={rowAction === `eliminar-${pedido.id}`}
                          >
                            {rowAction === `eliminar-${pedido.id}`
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
                <label htmlFor="direccionEntrega">Direccion</label>
                <input
                  id="direccionEntrega"
                  value={form.direccionEntrega}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, direccionEntrega: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form__row form__row--two">
                <div>
                  <label htmlFor="estado">Estado</label>
                  <select
                    id="estado"
                    value={form.estado}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, estado: e.target.value as EstadoPedido }))
                    }
                  >
                    {estadoOptions.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="zona">Zona</label>
                  <input
                    id="zona"
                    value={form.zona}
                    onChange={(e) => setForm((prev) => ({ ...prev, zona: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form__row form__row--two">
                <div>
                  <label htmlFor="peso">Peso</label>
                  <input
                    id="peso"
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={form.peso}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        peso: Number.parseFloat(e.target.value || "0"),
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <label htmlFor="tamano">Tamano</label>
                  <select
                    id="tamano"
                    value={form.tamano}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, tamano: e.target.value as TipoTamano }))
                    }
                  >
                    {tamanoOptions.map((tamano) => (
                      <option key={tamano} value={tamano}>
                        {tamano}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form__row">
                <label htmlFor="tipoCobro">Tipo de cobro</label>
                <select
                  id="tipoCobro"
                  value={form.tipoCobro}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, tipoCobro: e.target.value as TipoCobro }))
                  }
                >
                  {cobroOptions.map((cobro) => (
                    <option key={cobro} value={cobro}>
                      {cobro}
                    </option>
                  ))}
                </select>
              </div>

              <div className="check-row">
                <label className="check-input">
                  <input
                    type="checkbox"
                    checked={form.fragil}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, fragil: e.target.checked }))
                    }
                  />
                  Fragil
                </label>
                <label className="check-input">
                  <input
                    type="checkbox"
                    checked={form.prioritario}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, prioritario: e.target.checked }))
                    }
                  />
                  Prioritario
                </label>
              </div>

              <div className="form__actions">
                <button type="submit" className="button primary block" disabled={creating}>
                  {creating ? "Creando..." : "Crear pedido"}
                </button>
              </div>
            </form>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default App;
