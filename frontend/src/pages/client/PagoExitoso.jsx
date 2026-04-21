import { useEffect, useState } from "react";
import { apiFetch, ApiNetworkError } from "../../api/apiFetch";
import { loadStoredSession } from "../../auth/authStorage";
import { APP_ROUTES } from "../../router/paths";
import { useNavigate } from "react-router-dom";

const getErrorMessage = (error) => {
  if (error instanceof ApiError || error instanceof ApiNetworkError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrio un error inesperado.";
};

export const PagoExitoso = () => {
  const [message, setMessage] = useState("Procesando pago...");
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const ejecutarFlujo = async () => {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("session_id");
      const session = loadStoredSession();

      if (!sessionId) {
        setMessage("Error: session_id no encontrado en la URL.");
        return;
      }

      if (window.sessionStorage.getItem(sessionId) === "used") {
        setMessage("Pedido creado correctamente");
        window.setTimeout(() => {
          if (session?.token) {
            window.location.assign(APP_ROUTES.clientOrders);
          } else {
            navigate(APP_ROUTES.login, { replace: true });
          }
        }, 600);
        return;
      }

      try {
        setMessage("Procesando pago...");

        const data = await apiFetch(`/api/pagos/confirmar?session_id=${encodeURIComponent(sessionId)}`, {
          method: "POST",
          auth: false,
        });

        if (cancelled) {
          return;
        }

        if (data?.status !== "success") {
          setMessage("Pago fallido");
          return;
        }

        setMessage("Pago exitoso, creando pedido...");

        if (window.sessionStorage.getItem(sessionId)) {
          setMessage("Pedido creado correctamente");
          return;
        }

        window.sessionStorage.setItem(sessionId, "used");
        if (!cancelled) {
          setMessage("Pedido creado correctamente");
          window.setTimeout(() => {
            if (session?.token) {
              window.location.assign(APP_ROUTES.clientOrders);
            } else {
              navigate(APP_ROUTES.login, { replace: true });
            }
          }, 1400);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(getErrorMessage(error));
        }
      }
    };

    void ejecutarFlujo();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <section className="page-stack">
      <article className="card">
        <div className="card__header">
          <p className="eyebrow">Pago web</p>
          <h1>Resultado del pago</h1>
        </div>
        <p>{message}</p>
      </article>
    </section>
  );
};

export default PagoExitoso;
