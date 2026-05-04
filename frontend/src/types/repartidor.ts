export interface Repartidor {
  id: number;
  nombre: string;
  email: string;
  rol: "REPARTIDOR";
  disponible?: boolean | null;
  capacidadVehiculoKg?: number | null;
  vehiculo?: string | null;
  placaVehiculo?: string | null;
}

export interface RepartidorOperacionInput {
  disponible?: boolean | null;
  capacidadVehiculoKg?: number | null;
  vehiculo?: string | null;
  placaVehiculo?: string | null;
}
