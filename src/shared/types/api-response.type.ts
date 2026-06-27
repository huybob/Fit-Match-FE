export interface ApiResponse<TData> {
  success: boolean;
  code: string;
  message: string;
  data: TData;
  timestamp: string;
}

export interface PageResponse<TItem> {
  content?: TItem[];
  page?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
  last?: boolean;
}

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  code: string;
  message: string;
  path: string;
}
