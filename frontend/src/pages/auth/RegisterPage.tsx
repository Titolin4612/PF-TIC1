import type { FormEvent } from "react";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { getAuthErrorMessage } from "../../auth/authErrorMessages";
import { useAuth } from "../../auth/useAuth";
import { APP_ROUTES } from "../../router/paths";
import { USER_ROLES, type UserRole } from "../../types/auth";
import { getDefaultRouteByRole, ROLE_LABELS } from "../../utils/roleRedirect";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, register, session } = useAuth();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<UserRole>("CLIENTE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated && session) {
    return <Navigate to={getDefaultRouteByRole(session.rol)} replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const nextSession = await register({ nombre, email, password, rol });
      navigate(getDefaultRouteByRole(nextSession.rol), { replace: true });
    } catch (requestError) {
      setError(getAuthErrorMessage("register", requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-form">
      <div className="auth-form__header">
        <p className="eyebrow">Autenticacion</p>
        <h2>Crear cuenta</h2>
        <p>Crea tu acceso y entra al espacio de trabajo de tu rol.</p>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <div className="form__row">
          <label htmlFor="register-name">Nombre</label>
          <input
            id="register-name"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            placeholder="Nombre completo"
            required
          />
        </div>

        <div className="form__row">
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="correo@ejemplo.com"
            required
          />
        </div>

        <div className="form__row">
          <label htmlFor="register-password">Contrasena</label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Crea una contrasena segura"
            required
          />
        </div>

        <div className="form__row">
          <label htmlFor="register-role">Rol</label>
          <select
            id="register-role"
            value={rol}
            onChange={(event) => setRol(event.target.value as UserRole)}
          >
            {USER_ROLES.map((roleOption) => (
              <option key={roleOption} value={roleOption}>
                {ROLE_LABELS[roleOption]}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="alert alert--error">{error}</div>}

        <div className="form__actions">
          <button type="submit" className="button primary block" disabled={submitting}>
            {submitting ? "Registrando..." : "Registrarme"}
          </button>
        </div>
      </form>

      <p className="auth-form__footer">
        Ya tienes cuenta? <Link to={APP_ROUTES.login}>Inicia sesion</Link>
      </p>
    </div>
  );
};
