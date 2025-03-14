export interface CustomError extends Error {
  status?: number;
  response?: {
    status?: number;
    statusText?: string;
    data?: unknown;
  };
  config?: {
    url?: string;
    method?: string;
  };
}

export interface AxiosErrorDetails {
  url?: string;
  method?: string;
  statusCode?: number;
  statusText?: string;
  data?: unknown;
}
