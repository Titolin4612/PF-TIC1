import { InvalidAuthSessionError } from "../api/authApi";
import { ApiError, ApiNetworkError } from "../api/apiFetch";

type AuthAction = "login" | "register";

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

const hasAnyKeyword = (value: string, keywords: string[]): boolean =>
  keywords.some((keyword) => value.includes(keyword));

const getFriendlyLoginError = (error: ApiError): string => {
  if (error.status === 401) {
    return "Correo o contrasena incorrectos.";
  }

  if (error.status === 403) {
    return "Tu cuenta no tiene permisos para iniciar sesion.";
  }

  if (error.status >= 500) {
    return "No pudimos iniciar sesion en este momento. Intentalo nuevamente.";
  }

  return "No fue posible iniciar sesion. Revisa tus datos e intentalo de nuevo.";
};

const getFriendlyRegisterError = (error: ApiError): string => {
  const backendMessage = getBackendMessage(error);
  const duplicateEmailKeywords = [
    "email",
    "correo",
    "duplicate",
    "duplic",
    "existe",
    "registrad",
    "ya existe",
  ];

  if (
    error.status === 409 ||
    ((error.status === 400 || error.status === 422) &&
      hasAnyKeyword(backendMessage, duplicateEmailKeywords))
  ) {
    return "Ya existe una cuenta con ese correo.";
  }

  if (error.status === 400 || error.status === 422) {
    return "Revisa los datos ingresados e intentalo de nuevo.";
  }

  if (error.status >= 500) {
    return "No pudimos completar el registro en este momento. Intentalo nuevamente.";
  }

  return "No fue posible completar el registro. Intentalo de nuevo.";
};

export const getAuthErrorMessage = (
  action: AuthAction,
  error: unknown
): string => {
  if (error instanceof ApiError) {
    return action === "login"
      ? getFriendlyLoginError(error)
      : getFriendlyRegisterError(error);
  }

  if (error instanceof ApiNetworkError) {
    return action === "login"
      ? "No pudimos conectar con el servidor para iniciar sesion."
      : "No pudimos conectar con el servidor para completar el registro.";
  }

  if (error instanceof InvalidAuthSessionError) {
    return action === "login"
      ? "El servidor devolvio una respuesta invalida al iniciar sesion."
      : "El servidor devolvio una respuesta invalida al completar el registro.";
  }

  return action === "login"
    ? "No fue posible iniciar sesion. Intentalo de nuevo."
    : "No fue posible completar el registro. Intentalo de nuevo.";
};
