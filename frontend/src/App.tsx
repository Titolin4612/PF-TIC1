import { useEffect, useState } from "react";
import { obtenerPedidos } from "./api/pedidoApi";

interface Pedido {
  id: number;
  direccionEntrega: string;
  estado: string;
  fechaCreacion: string;
}

function App() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  useEffect(() => {
    obtenerPedidos()
      .then((data) => setPedidos(data))
      .catch((error) => console.error(error));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Lista de Pedidos</h1>

      {pedidos.map((pedido) => (
        <div key={pedido.id} style={{ marginBottom: "10px" }}>
          <strong>ID:</strong> {pedido.id} <br />
          <strong>Dirección:</strong> {pedido.direccionEntrega} <br />
          <strong>Estado:</strong> {pedido.estado} <br />
          <strong>Fecha:</strong> {pedido.fechaCreacion}
          <hr />
        </div>
      ))}
    </div>
  );
}

export default App;