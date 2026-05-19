import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import { login as loginRequest, register as registerRequest } from "../api/authApi";
import { clearStoredSession, loadStoredSession, saveStoredSession } from "./authStorage";
import { registerUnauthorizedHandler } from "../api/apiFetch";
import type { AuthSession } from "../types/auth";
import { AuthContext, type AuthContextValue } from "./authContextDef";

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [session, setSession] = useState<AuthSession | null>(() => loadStoredSession());

  const applySession = (nextSession: AuthSession | null) => {
    setSession(nextSession);

    if (nextSession) {
      saveStoredSession(nextSession);
      return;
    }

    clearStoredSession();
  };

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      setSession(null);
      clearStoredSession();
    });

    return () => {
      registerUnauthorizedHandler(null);
    };
  }, []);

  const value: AuthContextValue = {
    session,
    isAuthenticated: session !== null,
    login: async (payload) => {
      const nextSession = await loginRequest(payload);
      applySession(nextSession);
      return nextSession;
    },
    register: async (payload) => {
      const nextSession = await registerRequest(payload);
      applySession(nextSession);
      return nextSession;
    },
    logout: () => {
      applySession(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
