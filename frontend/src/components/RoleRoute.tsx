import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import type { UserRole } from "../types/auth";
import { getDefaultRouteByRole } from "../utils/roleRedirect";

interface RoleRouteProps {
  allowedRoles: UserRole[];
}

export const RoleRoute = ({ allowedRoles }: RoleRouteProps) => {
  const { session } = useAuth();

  if (!session) {
    return null;
  }

  if (!allowedRoles.includes(session.rol)) {
    return <Navigate to={getDefaultRouteByRole(session.rol)} replace />;
  }

  return <Outlet />;
};
