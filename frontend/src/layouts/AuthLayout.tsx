import { Outlet } from "react-router-dom";

export const AuthLayout = () => (
  <div className="auth-shell">
    <header className="auth-shell__brand">
      <div className="brand">
        <span className="brand__dot" />
        <div>
          <p className="brand__eyebrow">PF-TIC1</p>
          <p className="brand__title">SmartRoute</p>
        </div>
      </div>
    </header>

    <main className="auth-shell__content">
      <section className="auth-shell__intro">
        <p className="eyebrow">SmartRoute</p>
        <h1>Coordina cada entrega desde un solo lugar</h1>
        <p>
          Ingresa para continuar con la operacion del dia y abrir el espacio de
          trabajo correspondiente a tu rol.
        </p>

        <div className="auth-shell__highlights" aria-label="Beneficios principales">
          <article className="auth-highlight">
            <p className="auth-highlight__title">Acceso claro</p>
            <p className="auth-highlight__body">
              Cada perfil entra directo al espacio que necesita para trabajar.
            </p>
          </article>

          <article className="auth-highlight">
            <p className="auth-highlight__title">Operacion ordenada</p>
            <p className="auth-highlight__body">
              Pedidos, rutas y seguimiento reunidos en una misma plataforma.
            </p>
          </article>

          <article className="auth-highlight">
            <p className="auth-highlight__title">Flujo continuo</p>
            <p className="auth-highlight__body">
              Mantiene el ritmo diario con una vista limpia y enfocada.
            </p>
          </article>
        </div>
      </section>

      <section className="card auth-card">
        <Outlet />
      </section>
    </main>
  </div>
);
