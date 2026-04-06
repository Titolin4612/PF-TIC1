import { useEffect, useState } from "react";
import {
  actualizarEstado,
  asignarRepartidor,
  eliminarPedido,
  obtenerPedidos,
  type EstadoPedido,
  type Pedido,
} from "../../api/pedidoApi";
import { getDispatcherErrorMessage } from "../../utils/dispatcherErrorMessages";

export const useDispatcherOrders = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rowAction, setRowAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPedidos = async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "initial") {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError(null);

    try {
      const data = await obtenerPedidos();
      setPedidos(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(getDispatcherErrorMessage(mode === "initial" ? "load" : "refresh", requestError));
    } finally {
      if (mode === "initial") {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    void loadPedidos();
  }, []);

  const refresh = async () => {
    await loadPedidos("refresh");
  };

  const updateStatus = async (id: number, estado: EstadoPedido) => {
    setRowAction(`estado-${id}`);
    setError(null);

    try {
      const updatedPedido = await actualizarEstado(id, estado);
      setPedidos((currentPedidos) =>
        currentPedidos.map((pedido) =>
          pedido.id === id ? updatedPedido : pedido
        )
      );
    } catch (requestError) {
      setError(getDispatcherErrorMessage("status", requestError));
    } finally {
      setRowAction(null);
    }
  };

  const assignCourier = async (id: number, repartidorEmail: string) => {
    setRowAction(`asignar-${id}`);
    setError(null);

    try {
      const updatedPedido = await asignarRepartidor(id, repartidorEmail);
      setPedidos((currentPedidos) =>
        currentPedidos.map((pedido) =>
          pedido.id === id ? updatedPedido : pedido
        )
      );

      return updatedPedido;
    } catch (requestError) {
      setError(getDispatcherErrorMessage("assign", requestError));
      return null;
    } finally {
      setRowAction(null);
    }
  };

  const removePedido = async (id: number) => {
    setRowAction(`eliminar-${id}`);
    setError(null);

    try {
      await eliminarPedido(id);
      setPedidos((currentPedidos) =>
        currentPedidos.filter((pedido) => pedido.id !== id)
      );
    } catch (requestError) {
      setError(getDispatcherErrorMessage("delete", requestError));
    } finally {
      setRowAction(null);
    }
  };

  return {
    pedidos,
    loading,
    refreshing,
    rowAction,
    error,
    refresh,
    updateStatus,
    assignCourier,
    removePedido,
  };
};
