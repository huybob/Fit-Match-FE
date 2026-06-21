import axios, { AxiosError } from "axios";
import { env } from "@/core/config/env";
import { HttpError } from "@/core/http/http-error";
import { ApiErrorResponse } from "@/shared/types/api-response.type";

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

axiosClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const payload = error.response?.data;

    return Promise.reject(
      new HttpError(
        payload?.message ?? error.message ?? "Unable to connect to FitMatch API",
        error.response?.status ?? 0,
        payload?.code ?? error.code ?? "NETWORK_ERROR",
        payload?.path,
        payload,
      ),
    );
  },
);
