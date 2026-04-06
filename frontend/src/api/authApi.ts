import { apiFetch } from "./apiFetch";
import type { AuthSession, LoginPayload, RegisterPayload } from "../types/auth";

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

export const login = async (payload: LoginPayload): Promise<AuthSession> =>
  apiFetch<AuthSession>("/api/auth/login", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });

export const register = async (payload: RegisterPayload): Promise<AuthSession> =>
  apiFetch<AuthSession>("/api/auth/register", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
