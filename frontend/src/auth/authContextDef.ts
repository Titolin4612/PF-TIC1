import { createContext } from "react";
import type { AuthSession, LoginPayload, RegisterPayload } from "../types/auth";

export interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<AuthSession>;
  register: (payload: RegisterPayload) => Promise<AuthSession>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
export { AuthProvider } from "./AuthContext.tsx";
