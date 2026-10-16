import type {
  ApiResponse,
  PaginatedApiResponse,
} from "@/contracts";
import type {
  FieldPath,
  FieldValues,
  UseFormSetError,
} from "react-hook-form";

export type {
  ApiError,
  ApiResponse,
  PaginatedApiResponse,
  PaginationMeta,
} from "@/contracts";

const FALLBACK_ERROR_MESSAGE = "Something went wrong. Please try again.";

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  return (
    isObject(value) &&
    typeof value.success === "boolean" &&
    typeof value.message === "string"
  );
}

export class ApiRequestError extends Error {
  readonly response: ApiResponse<never>;
  readonly status: number;

  constructor(
    response: ApiResponse<never>,
    status: number,
  ) {
    super(response.message);
    this.name = "ApiRequestError";
    this.response = response;
    this.status = status;
  }

  get code() {
    return this.response.error?.code;
  }

  get details() {
    return this.response.error?.details;
  }
}

async function parseResponse(response: Response): Promise<ApiResponse<unknown>> {
  const payload: unknown = await response.json().catch(() => null);
  if (isApiResponse(payload)) return payload;
  return {
    success: false,
    message: FALLBACK_ERROR_MESSAGE,
    error: { code: "INVALID_API_RESPONSE" },
  };
}

export async function readApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const payload = (await parseResponse(response)) as ApiResponse<T>;
  if (!response.ok || !payload.success) {
    throw new ApiRequestError(payload as ApiResponse<never>, response.status);
  }
  return payload;
}

export async function readApiData<T>(response: Response): Promise<T> {
  const payload = await readApiResponse<T>(response);
  return payload.data as T;
}

export async function readPaginatedApiResponse<T>(
  response: Response,
): Promise<PaginatedApiResponse<T>> {
  const payload = await readApiResponse<T[]>(response);
  if (!("meta" in payload) || !isObject(payload.meta)) {
    throw new ApiRequestError(
      {
        success: false,
        message: FALLBACK_ERROR_MESSAGE,
        error: { code: "INVALID_API_RESPONSE" },
      },
      response.status,
    );
  }
  return payload as PaginatedApiResponse<T>;
}

export function getApiError(error: unknown): ApiResponse<never> | null {
  if (error instanceof ApiRequestError) return error.response;
  if (!isObject(error)) return null;

  const direct = isApiResponse(error) ? error : null;
  if (direct && !direct.success) return direct as ApiResponse<never>;

  const response = isObject(error.response) ? error.response : null;
  const data = response && "data" in response ? response.data : null;
  return isApiResponse(data) && !data.success
    ? (data as ApiResponse<never>)
    : null;
}

export function getApiErrorMessage(error: unknown): string {
  return getApiError(error)?.message ?? FALLBACK_ERROR_MESSAGE;
}

export function getApiErrorMessageFromText(value: string): string {
  try {
    return getApiErrorMessage(JSON.parse(value) as unknown);
  } catch {
    return FALLBACK_ERROR_MESSAGE;
  }
}

export function applyApiValidationErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
) {
  const details = getApiError(error)?.error?.details;
  if (!details) return false;

  for (const [field, messages] of Object.entries(details)) {
    const message = messages[0];
    if (message) {
      setError(field as FieldPath<T>, { type: "server", message });
    }
  }
  return true;
}
