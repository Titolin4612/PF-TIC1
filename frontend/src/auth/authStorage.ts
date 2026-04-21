import { isAuthSession, type AuthSession } from "../types/auth";

const AUTH_STORAGE_KEY = "pf-tic1.auth.session";
const TOKEN_STORAGE_KEY = "token";
const EMAIL_STORAGE_KEY = "email";
const ROLE_STORAGE_KEY = "rol";

const isBrowser = () => typeof window !== "undefined";

export const loadStoredSession = (): AuthSession | null => {
  if (!isBrowser()) {
    return null;
  }

  const rawSession = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawSession) as unknown;
    if (isAuthSession(parsed)) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, parsed.token);
      window.localStorage.setItem(EMAIL_STORAGE_KEY, parsed.email);
      window.localStorage.setItem(ROLE_STORAGE_KEY, parsed.rol);
      return parsed;
    }
  } catch {
    // Ignore malformed local storage payloads and reset below.
  }

  // Fallback for legacy/manual key storage used by payment redirect flows.
  const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  const email = window.localStorage.getItem(EMAIL_STORAGE_KEY);
  const rol = window.localStorage.getItem(ROLE_STORAGE_KEY);

  if (token && email && rol) {
    const fallbackSession: unknown = { token, email, rol };
    if (isAuthSession(fallbackSession)) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fallbackSession));
      return fallbackSession;
    }
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(EMAIL_STORAGE_KEY);
  window.localStorage.removeItem(ROLE_STORAGE_KEY);
  return null;
};

export const saveStoredSession = (session: AuthSession): void => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  window.localStorage.setItem(TOKEN_STORAGE_KEY, session.token);
  window.localStorage.setItem(EMAIL_STORAGE_KEY, session.email);
  window.localStorage.setItem(ROLE_STORAGE_KEY, session.rol);
};

export const clearStoredSession = (): void => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(EMAIL_STORAGE_KEY);
  window.localStorage.removeItem(ROLE_STORAGE_KEY);
};
