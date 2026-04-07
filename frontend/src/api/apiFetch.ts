import { clearStoredSession, loadStoredSession } from "../auth/authStorage";

type ApiFetchOptions = RequestInit & {
  auth?: boolean;
  parseAs?: "json" | "text" | "void";
};

type BackendErrorPayload = {
  mensaje?: string;
  message?: string;
  error?: string;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(
  /\/$/,
  ""
);

let unauthorizedHandler: (() => void) | null = null;

const buildUrl = (path: string): string => {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

const parseResponseBody = (rawBody: string, contentType: string): unknown => {
  if (!rawBody) {
    return null;
  }

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(rawBody) as unknown;
    } catch {
      return rawBody;
    }
  }

  return rawBody;
};

const getErrorMessage = (status: number, payload: unknown): string => {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const backendPayload = payload as BackendErrorPayload;
    return (
      backendPayload.mensaje ||
      backendPayload.message ||
      backendPayload.error ||
      `Error HTTP ${status}`
    );
  }

  return `Error HTTP ${status}`;
};

export class ApiError extends Error {
  readonly status: number;

  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export class ApiNetworkError extends Error {
  constructor(message = "Network request failed") {
    super(message);
    this.name = "ApiNetworkError";
  }
}

export const registerUnauthorizedHandler = (
  handler: (() => void) | null
): void => {
  unauthorizedHandler = handler;
};

export const apiFetch = async <T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> => {
  const { auth = false, parseAs = "json", headers, ...requestInit } = options;
  const requestHeaders = new Headers(headers);

  if (auth) {
    const session = loadStoredSession();
    if (session?.token) {
      requestHeaders.set("Authorization", `Bearer ${session.token}`);
    }
  }

  let response: Response;

  try {
    response = await fetch(buildUrl(path), {
      ...requestInit,
      headers: requestHeaders,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiNetworkError(error.message);
    }

    throw new ApiNetworkError();
  }

  const rawBody = response.status === 204 ? "" : await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  const parsedBody = parseResponseBody(rawBody, contentType);

  if (!response.ok) {
    if (response.status === 401 && auth) {
      clearStoredSession();
      unauthorizedHandler?.();
    }

    throw new ApiError(
      getErrorMessage(response.status, parsedBody),
      response.status,
      parsedBody
    );
  }

  if (parseAs === "void" || response.status === 204) {
    return undefined as T;
  }

  if (parseAs === "text") {
    return rawBody as T;
  }

  return parsedBody as T;
};
