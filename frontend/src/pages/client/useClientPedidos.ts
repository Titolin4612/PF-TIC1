import { useCallback, useEffect, useMemo, useState } from "react";
import { obtenerPedidos, type Pedido } from "../../api/pedidoApi";
import { useAuth } from "../../auth/useAuth";
import { ApiError } from "../../api/apiFetch";

const normalizeEmail = (value: string | null | undefined): string =>
  value?.trim().toLowerCase() ?? "";

const getClientErrorMessage = (error: unknown, action: "load" | "refresh"): string => {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return "No tienes acceso a tus pedidos.";
    }

    if (error.status >= 500) {
      return action === "load"
        ? "No pudimos cargar tus pedidos en este momento."
        : "No pudimos actualizar tus pedidos en este momento.";
    }
  }

  return action === "load"
    ? "No fue posible cargar tus pedidos."
    : "No fue posible actualizar tus pedidos.";
};

export const useClientPedidos = () => {
  const { session } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
        const data = await obtenerPedidos();

        const ownPedidos = Array.isArray(data)
          ? data
              .filter((pedido) => normalizeEmail(pedido.clienteEmail) === clientEmail)
              .sort((left, right) => {
                const leftDate = Date.parse(left.fechaCreacion);
                const rightDate = Date.parse(right.fechaCreacion);

                if (Number.isNaN(leftDate) || Number.isNaN(rightDate)) {
                  return right.id - left.id;
                }

                return rightDate - leftDate;
              })
          : [];

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

  return {
    pedidos,
    loading,
    refreshing,
    error,
    refresh,
  };
};
