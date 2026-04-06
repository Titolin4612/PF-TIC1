import { isAuthSession, type AuthSession } from "../types/auth";

const AUTH_STORAGE_KEY = "pf-tic1.auth.session";

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
      return parsed;
    }
  } catch {
    // Ignore malformed local storage payloads and reset below.
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  return null;
};

export const saveStoredSession = (session: AuthSession): void => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
};

export const clearStoredSession = (): void => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
};
