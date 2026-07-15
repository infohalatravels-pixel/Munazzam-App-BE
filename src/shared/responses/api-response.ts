export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  errors?: unknown;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function successResponse<T>(
  data: T,
  message = 'Success',
  meta?: Record<string, unknown>,
): ApiSuccessResponse<T> {
  return {
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  };
}

export function errorResponse(
  message: string,
  code = 'INTERNAL_ERROR',
  errors?: unknown,
): ApiErrorResponse {
  return {
    success: false,
    message,
    code,
    ...(errors !== undefined ? { errors } : {}),
  };
}
