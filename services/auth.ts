import { apiRequest } from "@/lib/api-client";

export interface MeResponse {
  authenticated: boolean;
}

export function fetchMe(): Promise<MeResponse> {
  return apiRequest<MeResponse>("/api/me", { method: "GET" });
}

export function loginWithPassword(password: string): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>("/api/auth", {
    method: "POST",
    body: { password },
  });
}

export function logout(): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>("/api/logout", { method: "POST" });
}
