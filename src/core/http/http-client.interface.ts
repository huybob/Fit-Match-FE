export interface HttpClient {
  get<TResponse>(url: string, config?: unknown): Promise<TResponse>;
  post<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: unknown,
  ): Promise<TResponse>;
  put<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: unknown,
  ): Promise<TResponse>;
  delete<TResponse>(url: string, config?: unknown): Promise<TResponse>;
}
