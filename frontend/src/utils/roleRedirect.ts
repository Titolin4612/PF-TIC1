import { APP_ROUTES } from "../router/paths";
import type { UserRole } from "../types/auth";

export const ROLE_LABELS: Record<UserRole, string> = {
  CLIENTE: "Cliente",
  REPARTIDOR: "Repartidor",
  GERENTE: "Gerente",
};

const DEFAULT_ROUTE_BY_ROLE: Record<UserRole, string> = {
  CLIENTE: APP_ROUTES.clientOrders,
  REPARTIDOR: APP_ROUTES.driverDeliveries,
  GERENTE: APP_ROUTES.dispatcherDashboard,
};

export const getDefaultRouteByRole = (role: UserRole): string =>
  DEFAULT_ROUTE_BY_ROLE[role];
