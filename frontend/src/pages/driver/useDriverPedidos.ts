import { useCallback, useEffect, useMemo, useState } from "react";
import { actualizarEstado, obtenerPedidos, type EstadoPedido, type Pedido } from "../../api/pedidoApi";
import { useAuth } from "../../auth/useAuth";
import { getDriverErrorMessage } from "../../utils/driverErrorMessages";
import { sortDriverPedidos } from "../../utils/driverPresentation";

const normalizeEmail = (value: string | null | undefined): string =>
  value?.trim().toLowerCase() ?? "";

export const useDriverPedidos = () => {
  const { session } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionPedidoId, setActionPedidoId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const driverEmail = useMemo(() => normalizeEmail(session?.email), [session?.email]);

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
        const assignedPedidos = Array.isArray(data)
          ? data.filter((pedido) => {
              if (!driverEmail) {
                return true;
              }

              return normalizeEmail(pedido.repartidorEmail) === driverEmail;
            })
          : [];

        setPedidos(sortDriverPedidos(assignedPedidos));
      } catch (requestError) {
        setError(getDriverErrorMessage(mode === "initial" ? "load" : "refresh", requestError));
      } finally {
        if (mode === "initial") {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [driverEmail]
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

  const updateStatus = async (id: number, estado: EstadoPedido) => {
    setActionPedidoId(id);
    setError(null);

    try {
      const updatedPedido = await actualizarEstado(id, estado);
      setPedidos((currentPedidos) =>
        sortDriverPedidos(
          currentPedidos.map((pedido) => (pedido.id === id ? updatedPedido : pedido))
        )
      );

      return updatedPedido;
    } catch (requestError) {
      setError(getDriverErrorMessage("status", requestError));
      return null;
    } finally {
      setActionPedidoId(null);
    }
  };

  return {
    pedidos,
    loading,
    refreshing,
    actionPedidoId,
    error,
    refresh,
    updateStatus,
  };
};
