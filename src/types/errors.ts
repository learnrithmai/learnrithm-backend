export interface CustomError extends Error {
    status?: number;
    response?: {
        status?: number;
        statusText?: string;
        data?: any;
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
    data?: any;
}
