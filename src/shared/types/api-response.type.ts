export interface ApiResponse<TData> {
  data: TData;
  message?: string;
  meta?: unknown;
}
