import type { AxiosRequestConfig } from "axios";
import { axiosClient } from "@/core/http/axios-client";
import { unwrapApiData } from "@/core/http/api-response";
import type { ApiResponse } from "@/shared/types/api-response.type";

async function unwrap<TData>(request: Promise<{ data: ApiResponse<TData> }>) {
  const response = await request;
  return unwrapApiData(response.data);
}

export const api = {
  get: <TData>(url: string, config?: AxiosRequestConfig) =>
    unwrap<TData>(axiosClient.get<ApiResponse<TData>>(url, config)),

  post: <TData, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: AxiosRequestConfig,
  ) => unwrap<TData>(axiosClient.post<ApiResponse<TData>>(url, body, config)),

  put: <TData, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: AxiosRequestConfig,
  ) => unwrap<TData>(axiosClient.put<ApiResponse<TData>>(url, body, config)),

  patch: <TData, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: AxiosRequestConfig,
  ) => unwrap<TData>(axiosClient.patch<ApiResponse<TData>>(url, body, config)),

  delete: <TData>(url: string, config?: AxiosRequestConfig) =>
    unwrap<TData>(axiosClient.delete<ApiResponse<TData>>(url, config)),

  raw: <TResponse>(url: string, config?: AxiosRequestConfig) =>
    axiosClient.get<TResponse>(url, config).then((response) => response.data),

  postRaw: <TBody = unknown>(
    url: string,
    body?: TBody,
    config?: AxiosRequestConfig,
  ) => axiosClient.post(url, body, config).then((response) => response.data),

  putRaw: <TBody = unknown>(
    url: string,
    body?: TBody,
    config?: AxiosRequestConfig,
  ) => axiosClient.put(url, body, config).then((response) => response.data),

  deleteRaw: (url: string, config?: AxiosRequestConfig) =>
    axiosClient.delete(url, config).then((response) => response.data),
};
