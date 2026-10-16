import { resolveClientIp } from "@/lib/internal-headers";
import { NextResponse, type NextRequest } from "next/server";

import {
  getSetCookieHeaders,
  refreshBackendSession,
} from "@/lib/auth/refresh-session";
import { getServerConfig } from "@/config/server";
import { apiJsonError } from "@/lib/api-route-response";
import { isCrossSiteSubrequest, toPublicUrl } from "@/lib/trusted-browser-request";
import {
  getLoginUrl,
  getSafeCallbackUrl,
  type ServerSessionMode,
} from "@/lib/auth/callback-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const serverConfig = getServerConfig();
const backendApiUrl = serverConfig.apiInternalUrl;

export async function GET(request: NextRequest) {
  if (isCrossSiteSubrequest(request.headers)) {
    return apiJsonError(403, "FORBIDDEN", "You do not have permission to refresh this session.");
  }
  const mode = readMode(request.nextUrl.searchParams.get("mode"));
  const callbackUrl = getSafeCallbackUrl(
    request.nextUrl.searchParams.get("callbackUrl"),
    mode === "optional" ? "/" : "/member",
  );
  const cookieHeader = request.headers.get("cookie") || "";
  if (!cookieHeader) return failureRedirect(callbackUrl, mode);

  try {
    const refreshed = await refreshBackendSession(
      cookieHeader,
      serverConfig.webUrl,
      resolveClientIp(request.headers),
    );
    const response = noStoreRedirect(toPublicUrl(callbackUrl, serverConfig.webUrl));
    appendCookies(response.headers, refreshed.setCookies);
    return response;
  } catch {
    return clearSessionAndRedirect(callbackUrl, cookieHeader, mode);
  }
}

async function clearSessionAndRedirect(
  callbackUrl: string,
  cookieHeader: string,
  mode: ServerSessionMode,
) {
  const response = failureRedirect(callbackUrl, mode);
  if (backendApiUrl) {
    try {
      const logoutResponse = await fetch(`${backendApiUrl}/auth/logout`, {
        method: "POST",
        headers: {
          Cookie: cookieHeader,
          Origin: serverConfig.webUrl,
        },
        cache: "no-store",
      });
      appendCookies(response.headers, getSetCookieHeaders(logoutResponse.headers));
    } catch {
      // Cookie vẫn được xóa cục bộ bên dưới khi auth service tạm thời lỗi.
    }
  }
  clearLocalAuthCookies(response);
  return response;
}

function failureRedirect(
  callbackUrl: string,
  mode: ServerSessionMode,
) {
  const target =
    mode === "optional"
      ? callbackUrl
      : getLoginUrl(callbackUrl, "session-expired");
  return noStoreRedirect(toPublicUrl(target, serverConfig.webUrl));
}

function noStoreRedirect(url: URL) {
  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function appendCookies(headers: Headers, cookies: string[]) {
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
}

function clearLocalAuthCookies(response: NextResponse) {
  for (const { name, path } of [
    { name: serverConfig.accessCookieName, path: "/" },
    {
      name: serverConfig.refreshCookieName,
      path: serverConfig.authCookiePath,
    },
  ]) {
    response.cookies.set(name, "", {
      domain: serverConfig.authCookieDomain,
      expires: new Date(0),
      httpOnly: true,
      path,
      sameSite: serverConfig.authCookieSameSite,
      secure: serverConfig.authCookieSecure,
    });
  }
}

function readMode(value: string | null): ServerSessionMode {
  return value === "optional" ? "optional" : "required";
}
