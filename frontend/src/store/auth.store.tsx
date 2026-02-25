import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { refreshToken } from "../api/auth.api";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  initializing: boolean;
  setAuth: (user: User | null, token: string | null) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);
let tokenGetter: (() => string | null) | null = null;

export const setTokenGetter = (fn: () => string | null) => {
  tokenGetter = fn;
};

export const getAccessToken = () => tokenGetter?.() || null;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    setTokenGetter(() => accessToken);
  }, [accessToken]);

  useEffect(() => {
    refreshToken()
      .then((res) => setAccessToken(res.accessToken))
      .catch(() => setAccessToken(null))
      .finally(() => setInitializing(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      initializing,
      setAuth: (nextUser: User | null, token: string | null) => {
        setUser(nextUser);
        setAccessToken(token);
      },
      clearAuth: () => {
        setUser(null);
        setAccessToken(null);
      }
    }),
    [user, accessToken, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
