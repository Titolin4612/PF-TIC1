import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { APP_ROUTES } from "../router/paths";

export const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={APP_ROUTES.login} replace state={{ from: location }} />;
  }

  return <Outlet />;
};
