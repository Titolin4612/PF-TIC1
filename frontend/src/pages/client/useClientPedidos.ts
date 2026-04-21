import { useCallback, useEffect, useMemo, useState } from "react";
import {
  crearPedido,
  obtenerPedidos,
  type Pedido,
  type PedidoInput,
} from "../../api/pedidoApi";
import { crearCheckout } from "../../api/pagoApi";
import { useAuth } from "../../auth/useAuth";
import { ApiError } from "../../api/apiFetch";

const normalizeEmail = (value: string | null | undefined): string =>
  value?.trim().toLowerCase() ?? "";

const CLIENT_ACCOUNT_ERROR = "No pudimos identificar tu cuenta para cargar tus pedidos.";
const WEB_PAYMENT_REDIRECT_ERROR =
  "No fue posible abrir Stripe Checkout. Revisa si el navegador bloqueo la redireccion.";

const sortPedidosByNewest = (pedidos: Pedido[]): Pedido[] =>
  [...pedidos].sort((left, right) => {
    const leftDate = Date.parse(left.fechaCreacion);
    const rightDate = Date.parse(right.fechaCreacion);

    if (Number.isNaN(leftDate) || Number.isNaN(rightDate)) {
      return right.id - left.id;
    }

    return rightDate - leftDate;
  });

const getClientErrorMessage = (
  error: unknown,
  action: "load" | "refresh" | "create"
): string => {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return action === "create"
        ? "Tu sesion ya no es valida. Inicia sesion de nuevo para solicitar el pedido."
        : "Tu sesion ya no es valida. Inicia sesion de nuevo para ver tus pedidos.";
    }

    if (error.status === 403) {
      return action === "create"
        ? "No tienes permisos para solicitar pedidos."
        : "No tienes acceso a tus pedidos.";
    }

    if (error.status === 400 || error.status === 422) {
      if (error.message?.trim()) {
        return error.message;
      }

      return action === "create"
        ? "Revisa los datos del pedido e intentalo nuevamente."
        : "No fue posible procesar tus pedidos con los datos actuales.";
    }

    if (error.status >= 500) {
      if (error.message?.trim()) {
        return error.message;
      }

      if (action === "create") {
        return "No pudimos registrar tu pedido en este momento.";
      }

      return action === "load"
        ? "No pudimos cargar tus pedidos en este momento."
        : "No pudimos actualizar tus pedidos en este momento.";
    }
  }

  if (action === "create") {
    return "No fue posible registrar tu pedido.";
  }

  return action === "load"
    ? "No fue posible cargar tus pedidos."
    : "No fue posible actualizar tus pedidos.";
};

const esCobroWeb = (tipoCobro: PedidoInput["tipoCobro"]): boolean =>
  tipoCobro === "WEB" || tipoCobro === "PAGO_WEB";

export const useClientPedidos = () => {
  const { session } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientEmail = useMemo(() => normalizeEmail(session?.email), [session?.email]);

  const loadPedidos = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "initial") {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      try {
        if (!clientEmail) {
          setPedidos([]);
          setError(CLIENT_ACCOUNT_ERROR);
          return;
        }

        const data = await obtenerPedidos();

        const ownPedidos = Array.isArray(data) ? sortPedidosByNewest(data) : [];

        setPedidos(ownPedidos);
      } catch (requestError) {
        setError(getClientErrorMessage(requestError, mode === "initial" ? "load" : "refresh"));
      } finally {
        if (mode === "initial") {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [clientEmail]
  );

  useEffect(() => {
    if (!session) {
      setPedidos([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    void loadPedidos();
  }, [loadPedidos, session]);

  const refresh = async () => {
    await loadPedidos("refresh");
  };

  const createNewPedido = async (pedido: PedidoInput) => {
    setCreating(true);
    setError(null);

    try {
      if (!clientEmail) {
        setPedidos([]);
        setError(CLIENT_ACCOUNT_ERROR);
        return null;
      }

      if (esCobroWeb(pedido.tipoCobro)) {
        const checkout = await crearCheckout(pedido);

        if (!checkout.url) {
          setError(WEB_PAYMENT_REDIRECT_ERROR);
          return null;
        }

        window.location.assign(checkout.url);
        return null;
      }

      const createdPedido = await crearPedido(pedido);
      setPedidos((currentPedidos) => sortPedidosByNewest([createdPedido, ...currentPedidos]));
      return createdPedido;
    } catch (requestError) {
      setError(getClientErrorMessage(requestError, "create"));
      return null;
    } finally {
      setCreating(false);
    }
  };

  return {
    pedidos,
    loading,
    refreshing,
    creating,
    error,
    refresh,
    createPedido: createNewPedido,
  };
};
