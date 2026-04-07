import { apiFetch } from "./apiFetch";
import { isAuthSession, type AuthSession, type LoginPayload, type RegisterPayload } from "../types/auth";

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

export class InvalidAuthSessionError extends Error {
  constructor(message = "Invalid auth session response") {
    super(message);
    this.name = "InvalidAuthSessionError";
  }
}

const parseAuthSession = (value: unknown): AuthSession => {
  if (isAuthSession(value)) {
    return value;
  }

  throw new InvalidAuthSessionError();
};

export const login = async (payload: LoginPayload): Promise<AuthSession> =>
  parseAuthSession(await apiFetch<unknown>("/api/auth/login", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  }));

export const register = async (payload: RegisterPayload): Promise<AuthSession> =>
  parseAuthSession(await apiFetch<unknown>("/api/auth/register", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  }));
