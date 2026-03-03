const API_URL = "http://localhost:8080/api/pedidos";

export const obtenerPedidos = async () => {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Error al obtener pedidos");
  }

  return response.json();
};