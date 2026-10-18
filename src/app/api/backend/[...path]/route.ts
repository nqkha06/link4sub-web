import { revalidatePath, revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";

import { applyClientIpHeaders, resolveClientIp } from "@/lib/internal-headers";
import {
  AUTH_ERROR_CODES,
  readAuthError,
} from "@/lib/auth/auth-errors";
import {
  BackendRefreshError,
  getSetCookieHeaders,
  refreshBackendSession,
} from "@/lib/auth/refresh-session";
import { getServerConfig } from "@/config/server";
import { apiJsonError } from "@/lib/api-route-response";
import { copyBackendResponseHeaders } from "@/lib/backend-response-headers";
import { isTrustedBrowserRequest } from "@/lib/trusted-browser-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const serverConfig = getServerConfig();
const backendApiUrl = serverConfig.apiInternalUrl;
if (!backendApiUrl) {
  throw new Error("Missing API_URL environment variable.");
}

const authPathsWithoutAutomaticRefresh = new Set([
  "auth/login",
  "auth/register",
  "auth/google",
  "auth/forgot-password",
  "auth/reset-password",
  "auth/refresh",
  "auth/logout",
]);

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

async function handler(request: NextRequest, context: RouteContext) {
  if (!isTrustedBrowserRequest(request, serverConfig.webUrl)) {
    return apiJsonError(
      403,
      "UNTRUSTED_ORIGIN",
      "You do not have permission to perform this action.",
    );
  }

  const { path = [] } = await context.params;
  if (!path.length) {
    return apiJsonError(
      404,
      "RESOURCE_NOT_FOUND",
      "The requested API path was not found.",
    );
  }

  const relativePath = path.map(encodeURIComponent).join("/");
  const requestBody = await readRequestBody(request);
  const firstResponse = await safelyCallBackend(
    request,
    relativePath,
    requestBody,
  );
  if (!firstResponse) return unavailableResponse();

  if (
    firstResponse.status === 401 &&
    !authPathsWithoutAutomaticRefresh.has(relativePath) &&
    request.headers.get("cookie")
  ) {
    const error = await readAuthError(firstResponse);
    if (
      error.code === AUTH_ERROR_CODES.ACCESS_TOKEN_EXPIRED ||
      error.code === AUTH_ERROR_CODES.ACCESS_TOKEN_INVALID
    ) {
      try {
        const refreshed = await refreshBackendSession(
          request.headers.get("cookie") || "",
          request.headers.get("origin") || undefined,
          resolveClientIp(request.headers),
        );
        const retriedResponse = await safelyCallBackend(
          request,
          relativePath,
          requestBody,
          refreshed.accessToken,
        );
        if (!retriedResponse) return unavailableResponse();
        invalidateContent(request, relativePath, retriedResponse);
        return forwardBackendResponse(
          retriedResponse,
          request.method,
          refreshed.setCookies,
        );
      } catch (refreshError) {
        if (refreshError instanceof BackendRefreshError) {
          return apiJsonError(
            refreshError.status,
            refreshError.code,
            refreshError.message,
          );
        }
        return unavailableResponse();
      }
    }
  }

  invalidateContent(request, relativePath, firstResponse);
  return forwardBackendResponse(firstResponse, request.method);
}

export {
  handler as DELETE,
  handler as GET,
  handler as HEAD,
  handler as PATCH,
  handler as POST,
  handler as PUT,
};

async function readRequestBody(request: Request) {
  if (request.method === "GET" || request.method === "HEAD" || !request.body) {
    return undefined;
  }
  return request.arrayBuffer();
}

async function safelyCallBackend(
  request: NextRequest,
  relativePath: string,
  body: ArrayBuffer | undefined,
  accessToken?: string,
) {
  try {
    const headers = new Headers();
    for (const name of [
      "accept",
      "content-type",
      "cookie",
      "if-modified-since",
      "if-none-match",
      "origin",
      "range",
      "user-agent",
    ]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
    // Danh sách header ở trên là allowlist: client không tự gửi được
    // x-internal-secret hay x-visitor-ip qua BFF.
    applyClientIpHeaders(headers, resolveClientIp(request.headers));

    return await fetch(
      `${backendApiUrl}/${relativePath}${request.nextUrl.search}`,
      {
        method: request.method,
        headers,
        body,
        cache: "no-store",
        redirect: "manual",
        signal: request.signal,
      },
    );
  } catch {
    return null;
  }
}

function forwardBackendResponse(
  response: Response,
  requestMethod: string,
  additionalCookies: string[] = [],
) {
  const headers = copyBackendResponseHeaders(response.headers, [
    "location",
    "server-timing",
  ]);
  for (const cookie of [
    ...additionalCookies,
    ...getSetCookieHeaders(response.headers),
  ]) {
    headers.append("Set-Cookie", cookie);
  }
  const hasNoBody =
    requestMethod === "HEAD" ||
    response.status === 204 ||
    response.status === 304;
  return new Response(hasNoBody ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function invalidateContent(
  request: NextRequest,
  relativePath: string,
  response: Response,
) {
  if (
    request.method === "PATCH" &&
    relativePath === "admin/settings/appearance" &&
    response.ok
  ) {
    revalidateTag("public-site-settings", "max");
    revalidatePath("/", "layout");
  }
  if (
    request.method !== "GET" &&
    request.method !== "HEAD" &&
    relativePath.startsWith("admin/menus") &&
    response.ok
  ) {
    revalidateTag("public-website-menus", "max");
    revalidatePath("/", "page");
  }
}

function unavailableResponse() {
  return apiJsonError(
    503,
    AUTH_ERROR_CODES.AUTH_SERVICE_UNAVAILABLE,
    "The API service is temporarily unavailable.",
  );
}
