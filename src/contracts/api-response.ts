export type ApiError = {
  code: string;
  details?: Record<string, string[]>;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  error?: ApiError;
};

export type PaginationMeta = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  [key: string]: unknown;
};

export type PaginatedApiResponse<T> = {
  success: boolean;
  message: string;
  data: T[];
  meta: PaginationMeta;
};
