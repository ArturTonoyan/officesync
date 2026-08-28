import type { AxiosResponse } from "axios";

export type ApiPayload = FormData | Record<string, unknown>;

export type ApiErrorResponse = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

export type ApiResult<T = unknown> = AxiosResponse<T> | ApiErrorResponse;
