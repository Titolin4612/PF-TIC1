import { ApiError } from "../api/apiFetch";

type DriverAction = "load" | "refresh" | "status";

const getLoadMessage = (error: ApiError): string => {
  if (error.status === 403) {
    return "No tienes acceso a tus entregas asignadas.";
  }

  if (error.status >= 500) {
    return "No pudimos cargar tu jornada en este momento. Intentalo nuevamente.";
  }

  return "No fue posible cargar tus entregas. Intentalo de nuevo.";
};

const getStatusMessage = (error: ApiError): string => {
  if (error.status === 404) {
    return "La entrega seleccionada ya no esta disponible.";
  }

  if (error.status === 409) {
    return "Ese avance no se puede registrar ahora. Revisa la entrega e intentalo nuevamente.";
  }

  if (error.status === 400 || error.status === 422) {
    return "No se pudo registrar ese avance. Revisa la entrega e intentalo nuevamente.";
  }

  if (error.status >= 500) {
    return "No pudimos guardar el avance de la entrega en este momento. Intentalo nuevamente.";
  }

  return "No fue posible actualizar la entrega. Intentalo de nuevo.";
};

export const getDriverErrorMessage = (action: DriverAction, error: unknown): string => {
  if (error instanceof ApiError) {
    switch (action) {
      case "load":
      case "refresh":
        return getLoadMessage(error);
      case "status":
        return getStatusMessage(error);
    }
  }

  if (action === "status") {
    return "No fue posible actualizar la entrega. Intentalo de nuevo.";
  }

  return "No fue posible cargar tus entregas. Intentalo de nuevo.";
};
