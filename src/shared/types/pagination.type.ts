export interface PaginationParams {
  page: number;
  size: number;
  sort?: string[];
}

export interface PaginatedResult<TItem> {
  content: TItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
