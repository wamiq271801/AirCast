"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchMe, loginWithPassword, logout as logoutRequest } from "@/services/auth";
import { ApiError } from "@/lib/api-client";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  isAuthenticated: boolean;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const queryClient = useQueryClient();

  const refresh = useCallback(async () => {
    try {
      const me = await fetchMe();
      setStatus(me.authenticated ? "authenticated" : "unauthenticated");
    } catch {
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Global 401 handler: listen for ApiError thrown anywhere via window event.
  useEffect(() => {
    const onUnauthorized = () => setStatus("unauthenticated");
    window.addEventListener("aircast:unauthorized", onUnauthorized);
    return () => window.removeEventListener("aircast:unauthorized", onUnauthorized);
  }, []);

  const login = useCallback(
    async (password: string) => {
      await loginWithPassword(password);
      queryClient.clear();
      // Auth state is determined exclusively by GET /api/me.
      // The session cookie is HttpOnly and cannot be inspected from JS.
      const me = await fetchMe();
      if (!me.authenticated) {
        setStatus("unauthenticated");
        throw new Error("Authentication failed. Please try again.");
      }
      setStatus("authenticated");
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      /* ignore */
    }
    queryClient.clear();
    setStatus("unauthenticated");
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      isAuthenticated: status === "authenticated",
      login,
      logout,
      refresh,
    }),
    [status, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function reportUnauthorized(err: unknown) {
  if (err instanceof ApiError && err.status === 401) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("aircast:unauthorized"));
    }
    return true;
  }
  return false;
}
