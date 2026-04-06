import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { ROLE_LABELS } from "../utils/roleRedirect";
import type { UserRole } from "../types/auth";
import { APP_ROUTES } from "../router/paths";

type NavItem = {
  label: string;
  to: string;
};

const APP_TITLES: Record<UserRole, string> = {
  GERENTE: "Panel de Despacho",
  REPARTIDOR: "Panel de Entregas",
  CLIENTE: "Panel de Pedidos",
};

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  GERENTE: [
    { label: "Dashboard", to: APP_ROUTES.dispatcherDashboard },
    { label: "Gestion de Pedidos", to: APP_ROUTES.dispatcherOrders },
    { label: "Gestion de Rutas", to: APP_ROUTES.dispatcherRoutes },
  ],
  REPARTIDOR: [
    { label: "Entregas", to: APP_ROUTES.driverDeliveries },
    { label: "Ruta", to: APP_ROUTES.driverRoute },
  ],
  CLIENTE: [{ label: "Pedidos", to: APP_ROUTES.clientOrders }],
};

export const AuthenticatedLayout = () => {
  const { session, logout } = useAuth();

  if (!session) {
    return null;
  }

  const shellClassName =
    session.rol === "REPARTIDOR" ? "app-shell app-shell--driver" : "app-shell";
  const topbarClassName =
    session.rol === "REPARTIDOR" ? "topbar topbar--driver" : "topbar";
  const contentClassName =
    session.rol === "GERENTE"
      ? "content content--dispatcher"
      : session.rol === "REPARTIDOR"
        ? "content content--driver"
        : "content";

  return (
    <div className={shellClassName}>
      <header className={topbarClassName}>
        <div className="brand">
          <span className="brand__dot" />
          <div>
            <p className="brand__eyebrow">SmartRoute</p>
            <p className="brand__title">{APP_TITLES[session.rol]}</p>
          </div>
        </div>

        <nav className="nav" aria-label="Navegacion principal">
          {NAV_ITEMS[session.rol].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? "nav__item nav__item--active" : "nav__item"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="topbar__actions">
          <div className="user-chip">
            <span>{ROLE_LABELS[session.rol]}</span>
            <small>{session.email}</small>
          </div>
          <button type="button" className="button ghost" onClick={logout}>
            Cerrar sesion
          </button>
        </div>
      </header>

      <main className={contentClassName}>
        <Outlet />
      </main>
    </div>
  );
};
