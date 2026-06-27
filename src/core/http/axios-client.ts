import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { tokenStorage } from "@/core/auth/token-storage";
import { env } from "@/core/config/env";
import { HttpError } from "@/core/http/http-error";
import type { AuthResponse } from "@/types/Auth";
import { ApiErrorResponse, ApiResponse } from "@/shared/types/api-response.type";

type RefreshResponse = ApiResponse<AuthResponse>;
type RetryRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshRequest: Promise<string> | null = null;

export const axiosClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    Accept: "application/json",
  },
  paramsSerializer: (params) => {
    const searchParams = new URLSearchParams();

    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;

      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(key, String(item)));
        return;
      }

      searchParams.append(key, String(value));
    });

    return searchParams.toString();
  },
});

axiosClient.interceptors.request.use((config) => {
  const accessToken = tokenStorage.get()?.accessToken;
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

async function refreshAccessToken() {
  const tokens = tokenStorage.get();
  if (!tokens?.refreshToken) throw new Error("Refresh token is unavailable");

  const response = await axios.post<RefreshResponse>(`${env.apiBaseUrl}/auth/refresh`, {
    refreshToken: tokens.refreshToken,
  });
  const auth = response.data.data;

  if (!response.data.success || !auth?.accessToken || !auth.refreshToken) {
    throw new Error(response.data.message ?? "Unable to refresh session");
  }

  tokenStorage.set({
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    expiresAt: Date.now() + (auth.expiresIn ?? 0),
  });
  return auth.accessToken;
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const request = error.config as RetryRequestConfig | undefined;
    const isAuthEndpoint = request?.url?.startsWith("/auth/");

    if (error.response?.status === 401 && request && !request._retry && !isAuthEndpoint && tokenStorage.get()?.refreshToken) {
      request._retry = true;

      try {
        refreshRequest ??= refreshAccessToken().finally(() => {
          refreshRequest = null;
        });
        const accessToken = await refreshRequest;
        request.headers.Authorization = `Bearer ${accessToken}`;
        return axiosClient(request);
      } catch {
        tokenStorage.clear();
        if (typeof window !== "undefined") window.dispatchEvent(new Event("fitmatch:auth-expired"));
      }
    }

    const payload = error.response?.data;

    throw new HttpError(
      payload?.message ?? error.message ?? "Unable to connect to FitMatch API",
      error.response?.status ?? 0,
      payload?.code ?? error.code ?? "NETWORK_ERROR",
      payload?.path,
      payload,
    );
  },
);
