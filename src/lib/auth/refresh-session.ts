import { applyClientIpHeaders } from "@/lib/internal-headers";
import "server-only";

import { createHash } from "node:crypto";

import {
  AUTH_ERROR_CODES,
  type AuthErrorCode,
  readAuthError,
} from "@/lib/auth/auth-errors";
import type { AuthResponse } from "@/features/auth/types";
import { getServerConfig } from "@/config/server";
import { readApiData } from "@/lib/api-response";

const backendApiUrl = getServerConfig().apiInternalUrl;
if (!backendApiUrl) {
  throw new Error("Missing API_URL environment variable.");
}

export type BackendAuthResponse = AuthResponse;

export type BackendRefreshResult = BackendAuthResponse & {
  setCookies: string[];
};

export class BackendRefreshError extends Error {
  constructor(
    readonly code: AuthErrorCode,
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "BackendRefreshError";
  }
}

const refreshRequests = new Map<string, Promise<BackendRefreshResult>>();
const SUCCESS_RESULT_GRACE_MS = 10_000;

export function refreshBackendSession(
  cookieHeader: string,
  origin?: string,
  clientIp?: string | null,
) {
  const requestKey = createHash("sha256").update(cookieHeader).digest("hex");
  const inFlight = refreshRequests.get(requestKey);
  if (inFlight) return inFlight;

  const request = executeRefresh(cookieHeader, origin, clientIp);
  refreshRequests.set(requestKey, request);
  void request.then(
    () => {
      const timer = setTimeout(() => {
        if (refreshRequests.get(requestKey) === request) {
          refreshRequests.delete(requestKey);
        }
      }, SUCCESS_RESULT_GRACE_MS);
      timer.unref();
    },
    () => {
      if (refreshRequests.get(requestKey) === request) {
        refreshRequests.delete(requestKey);
      }
    },
  );
  return request;
}

async function executeRefresh(
  cookieHeader: string,
  origin?: string,
  clientIp?: string | null,
) {
  try {
    const headers = new Headers({ Cookie: cookieHeader });
    if (origin) headers.set("Origin", origin);
    applyClientIpHeaders(headers, clientIp);
    const response = await fetch(`${backendApiUrl}/auth/refresh`, {
      method: "POST",
      headers,
      cache: "no-store",
    });
    if (!response.ok) {
      const error = await readAuthError(response);
      throw new BackendRefreshError(
        error.code || AUTH_ERROR_CODES.AUTH_SERVICE_UNAVAILABLE,
        error.status,
        error.message,
      );
    }
    return {
      ...(await readApiData<BackendAuthResponse>(response)),
      setCookies: getSetCookieHeaders(response.headers),
    } satisfies BackendRefreshResult;
  } catch (error) {
    if (error instanceof BackendRefreshError) throw error;
    throw new BackendRefreshError(
      AUTH_ERROR_CODES.NETWORK_ERROR,
      503,
      error instanceof Error ? error.message : "Unable to connect to the authentication service.",
    );
  }
}

export function getSetCookieHeaders(headers: Headers) {
  const enhancedHeaders = headers as Headers & {
    getSetCookie?: () => string[];
  };
  const values = enhancedHeaders.getSetCookie?.();
  if (values?.length) return values;
  const combined = headers.get("set-cookie");
  return combined ? combined.split(/,(?=\s*[^;,\s]+=)/) : [];
}
