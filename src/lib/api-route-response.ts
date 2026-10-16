import type { ApiResponse } from "@/contracts";

export function apiJsonSuccess<T>(
  data: T,
  message: string,
  init: ResponseInit = {},
) {
  return Response.json(
    { success: true, message, data } satisfies ApiResponse<T>,
    init,
  );
}

export function apiJsonError(
  status: number,
  code: string,
  message: string,
  headers?: HeadersInit,
) {
  return Response.json(
    {
      success: false,
      message,
      error: { code },
    } satisfies ApiResponse<never>,
    { status, headers },
  );
}
