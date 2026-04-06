import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { RoleRoute } from "../components/RoleRoute";
import { useAuth } from "../auth/useAuth";
import { AuthLayout } from "../layouts/AuthLayout";
import { AuthenticatedLayout } from "../layouts/AuthenticatedLayout";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { ClientOrdersPage } from "../pages/client/ClientOrdersPage";
import { DispatcherDashboardPage } from "../pages/dispatcher/DispatcherDashboardPage";
import { DispatcherOrdersPage } from "../pages/dispatcher/DispatcherOrdersPage";
import { DispatcherRoutesPage } from "../pages/dispatcher/DispatcherRoutesPage";
import { DriverDeliveriesPage } from "../pages/driver/DriverDeliveriesPage";
import { DriverRoutePage } from "../pages/driver/DriverRoutePage";
import { APP_ROUTES } from "./paths";
import { getDefaultRouteByRole } from "../utils/roleRedirect";

const HomeRedirect = () => {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to={APP_ROUTES.login} replace />;
  }

  return <Navigate to={getDefaultRouteByRole(session.rol)} replace />;
};

export const AppRouter = () => (
  <Routes>
    <Route path={APP_ROUTES.home} element={<HomeRedirect />} />

    <Route element={<AuthLayout />}>
      <Route path={APP_ROUTES.login} element={<LoginPage />} />
      <Route path={APP_ROUTES.register} element={<RegisterPage />} />
    </Route>

    <Route element={<ProtectedRoute />}>
      <Route element={<AuthenticatedLayout />}>
        <Route element={<RoleRoute allowedRoles={["GERENTE"]} />}>
          <Route
            path={APP_ROUTES.dispatcherDashboard}
            element={<DispatcherDashboardPage />}
          />
          <Route path={APP_ROUTES.dispatcherOrders} element={<DispatcherOrdersPage />} />
          <Route path={APP_ROUTES.dispatcherRoutes} element={<DispatcherRoutesPage />} />
        </Route>

        <Route element={<RoleRoute allowedRoles={["REPARTIDOR"]} />}>
          <Route path={APP_ROUTES.driverDeliveries} element={<DriverDeliveriesPage />} />
          <Route path={APP_ROUTES.driverRoute} element={<DriverRoutePage />} />
        </Route>

        <Route element={<RoleRoute allowedRoles={["CLIENTE"]} />}>
          <Route path={APP_ROUTES.clientOrders} element={<ClientOrdersPage />} />
        </Route>
      </Route>
    </Route>

    <Route path="*" element={<HomeRedirect />} />
  </Routes>
);
