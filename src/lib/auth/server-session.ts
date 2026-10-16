import "server-only";

import { cache } from "react";
import { cookies, headers as requestHeaders } from "next/headers";
import { redirect } from "next/navigation";

import { getServerConfig } from "@/config/server";
import type { AuthUser } from "@/features/auth/types";
import { readApiData } from "@/lib/api-response";
import { readAuthError } from "@/lib/auth/auth-errors";
import {
  getLoginUrl,
  getRefreshSessionUrl,
  getSafeCallbackUrl,
  type ServerSessionMode,
} from "@/lib/auth/callback-url";
import { serverApiFetch } from "@/lib/auth/server-api";

const { accessCookieName, refreshCookieName } = getServerConfig();
const REQUEST_URL_HEADER = "x-stu-request-url";

type GetServerUserOptions = {
  callbackUrl: string;
  mode: ServerSessionMode;
};

export function getServerUser(
  options: GetServerUserOptions & { mode: "required" },
): Promise<AuthUser>;
export function getServerUser(
  options: GetServerUserOptions & { mode: "optional" },
): Promise<AuthUser | null>;
export function getServerUser(
  options: GetServerUserOptions,
): Promise<AuthUser | null> {
  return resolveServerUser(options.callbackUrl, options.mode);
}

const resolveServerUser = cache(async function resolveServerUser(
  callbackUrl: string,
  mode: ServerSessionMode,
): Promise<AuthUser | null> {
  const resolvedCallbackUrl = await getCurrentRequestUrl(callbackUrl);
  const cookieStore = await cookies();
  const hasAccessCookie = Boolean(cookieStore.get(accessCookieName)?.value);
  const hasRefreshCookie = Boolean(cookieStore.get(refreshCookieName)?.value);

  if (!hasAccessCookie) {
    if (hasRefreshCookie) {
      redirect(getRefreshSessionUrl(resolvedCallbackUrl, mode));
    }
    if (mode === "required") {
      redirect(getLoginUrl(resolvedCallbackUrl));
    }
    return null;
  }

  let response: Response;
  try {
    response = await serverApiFetch("/auth/me", { cache: "no-store" });
  } catch (error) {
    if (mode === "optional") return null;
    throw error;
  }

  if (response.ok) return readApiData<AuthUser>(response);

  if (response.status === 401) {
    // Đi qua refresh route cả khi refresh cookie đã mất để route này xóa access
    // cookie cũ trước khi quay về public page hoặc chuyển sang trang đăng nhập.
    redirect(getRefreshSessionUrl(resolvedCallbackUrl, mode));
  }

  if (mode === "optional") return null;
  const error = await readAuthError(response);
  throw new Error(error.message);
});

async function getCurrentRequestUrl(fallback: string) {
  // Proxy tự ghi đè header này cho mọi page request, nhờ đó 404 và dynamic
  // route vẫn giữ nguyên pathname + query mà không phải tự ghép ở từng page.
  const requestUrl = (await requestHeaders()).get(REQUEST_URL_HEADER);
  return getSafeCallbackUrl(requestUrl, fallback);
}
