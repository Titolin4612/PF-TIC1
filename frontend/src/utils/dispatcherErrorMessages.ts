import { ApiError } from "../api/apiFetch";

type DispatcherAction =
  | "load"
  | "refresh"
  | "status"
  | "assign"
  | "delete"
  | "details";

type BackendErrorPayload = {
  mensaje?: string;
  message?: string;
  error?: string;
};

const getBackendMessage = (error: ApiError): string => {
  if (typeof error.payload === "string") {
    return error.payload.toLowerCase();
  }

  if (error.payload && typeof error.payload === "object") {
    const payload = error.payload as BackendErrorPayload;
    return `${payload.mensaje ?? ""} ${payload.message ?? ""} ${payload.error ?? ""}`
      .trim()
      .toLowerCase();
  }

  return error.message.toLowerCase();
};

const includesAny = (value: string, candidates: string[]): boolean =>
  candidates.some((candidate) => value.includes(candidate));

const getLoadMessage = (error: ApiError): string => {
  if (error.status === 403) {
    return "No tienes acceso a la operacion de despacho.";
  }

  if (error.status >= 500) {
    return "No pudimos cargar los pedidos en este momento. Intentalo nuevamente.";
  }

  return "No fue posible cargar los pedidos. Intentalo de nuevo.";
};

const getStatusMessage = (error: ApiError): string => {
  if (error.status === 404) {
    return "El pedido seleccionado ya no esta disponible.";
  }

  if (error.status === 400 || error.status === 422) {
    return "No se pudo aplicar ese cambio de estado. Revisa el pedido e intentalo nuevamente.";
  }

  if (error.status >= 500) {
    return "No pudimos actualizar el estado en este momento. Intentalo nuevamente.";
  }

  return "No fue posible actualizar el pedido. Intentalo de nuevo.";
};

const getAssignMessage = (error: ApiError): string => {
  const backendMessage = getBackendMessage(error);
  const emailKeywords = ["email", "correo", "repartidor", "usuario", "exist"];

  if (error.status === 404) {
    return "El pedido seleccionado ya no esta disponible.";
  }

  if (
    error.status === 400 ||
    error.status === 422 ||
    includesAny(backendMessage, emailKeywords)
  ) {
    return "Verifica el correo del repartidor e intentalo nuevamente.";
  }

  if (error.status >= 500) {
    return "No pudimos registrar la asignacion en este momento. Intentalo nuevamente.";
  }

  return "No fue posible asignar el pedido. Intentalo de nuevo.";
};

const getDeleteMessage = (error: ApiError): string => {
  if (error.status === 404) {
    return "El pedido seleccionado ya no esta disponible.";
  }

  if (error.status === 409) {
    return "Ese pedido no se puede retirar en este momento.";
  }

  if (error.status >= 500) {
    return "No pudimos retirar el pedido en este momento. Intentalo nuevamente.";
  }

  return "No fue posible retirar el pedido. Intentalo de nuevo.";
};

export const getDispatcherErrorMessage = (
  action: DispatcherAction,
  error: unknown
): string => {
  if (error instanceof ApiError) {
    switch (action) {
      case "load":
      case "refresh":
      case "details":
        return getLoadMessage(error);
      case "status":
        return getStatusMessage(error);
      case "assign":
        return getAssignMessage(error);
      case "delete":
        return getDeleteMessage(error);
    }
  }

  switch (action) {
    case "status":
      return "No fue posible actualizar el pedido. Intentalo de nuevo.";
    case "assign":
      return "No fue posible asignar el pedido. Intentalo de nuevo.";
    case "delete":
      return "No fue posible retirar el pedido. Intentalo de nuevo.";
    default:
      return "No fue posible cargar la informacion. Intentalo de nuevo.";
  }
};
