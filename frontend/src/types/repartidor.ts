export interface Repartidor {
  id: number;
  nombre: string;
  email: string;
  rol: "REPARTIDOR";
  disponible?: boolean | null;
  tipoVehiculo?: "MOTO" | "CAMION" | null;
  capacidadVehiculoKg?: number | null;
  vehiculo?: string | null;
  placaVehiculo?: string | null;
}

export interface RepartidorOperacionInput {
  disponible?: boolean | null;
  tipoVehiculo?: "MOTO" | "CAMION" | null;
  capacidadVehiculoKg?: number | null;
  vehiculo?: string | null;
  placaVehiculo?: string | null;
}
