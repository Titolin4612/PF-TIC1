import type { FormEvent } from "react";
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { getAuthErrorMessage } from "../../auth/authErrorMessages";
import { useAuth } from "../../auth/useAuth";
import { APP_ROUTES } from "../../router/paths";
import { getDefaultRouteByRole } from "../../utils/roleRedirect";

type AuthLocationState = {
  from?: {
    pathname?: string;
    search?: string;
  };
};

const resolveReturnTo = (location: ReturnType<typeof useLocation>): string | null => {
  const queryReturnTo = new URLSearchParams(location.search).get("returnTo");
  if (queryReturnTo && queryReturnTo.startsWith("/")) {
    return queryReturnTo;
  }

  const from = (location.state as AuthLocationState | null)?.from;
  if (from?.pathname) {
    const search = from.search ?? "";
    return `${from.pathname}${search}`;
  }

  return null;
};

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login, session } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const returnTo = resolveReturnTo(location);

  if (isAuthenticated && session) {
    return <Navigate to={returnTo || getDefaultRouteByRole(session.rol)} replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const nextSession = await login({ email, password });
      navigate(returnTo || getDefaultRouteByRole(nextSession.rol), { replace: true });
    } catch (requestError) {
      setError(getAuthErrorMessage("login", requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-form">
      <div className="auth-form__header">
        <p className="eyebrow">Autenticacion</p>
        <h2>Iniciar sesion</h2>
        <p>Ingresa con tu correo y contrasena para continuar.</p>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <div className="form__row">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="correo@ejemplo.com"
            required
          />
        </div>

        <div className="form__row">
          <label htmlFor="login-password">Contrasena</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Tu contrasena"
            required
          />
        </div>

        {error && <div className="alert alert--error">{error}</div>}

        <div className="form__actions">
          <button type="submit" className="button primary block" disabled={submitting}>
            {submitting ? "Ingresando..." : "Ingresar"}
          </button>
        </div>
      </form>

      <p className="auth-form__footer">
        Aun no tienes cuenta? <Link to={APP_ROUTES.register}>Registrate</Link>
      </p>
    </div>
  );
};
