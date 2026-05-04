export const USER_ROLES = ["CLIENTE", "REPARTIDOR", "GERENTE"] as const;
export const VEHICLE_TYPES = ["MOTO", "CAMION"] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export interface AuthSession {
  token: string;
  email: string;
  rol: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  nombre: string;
  rol: UserRole;
  tipoVehiculo?: VehicleType | null;
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const isUserRole = (value: unknown): value is UserRole =>
  typeof value === "string" && USER_ROLES.includes(value as UserRole);

export const isAuthSession = (value: unknown): value is AuthSession => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AuthSession>;

  return (
    isNonEmptyString(candidate.token) &&
    isNonEmptyString(candidate.email) &&
    isUserRole(candidate.rol)
  );
};
