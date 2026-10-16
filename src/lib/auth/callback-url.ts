export type ServerSessionMode = "optional" | "required";

const INTERNAL_ORIGIN = "https://internal.invalid";
const REFRESH_SESSION_PATH = "/api/auth/refresh-session";

export function getSafeCallbackUrl(
  value: string | null | undefined,
  fallback = "/",
) {
  return parseSafeCallbackUrl(value) ?? parseSafeCallbackUrl(fallback) ?? "/";
}

export function getLoginUrl(callbackUrl: string, reason?: string) {
  const searchParams = new URLSearchParams({
    callbackUrl: getSafeCallbackUrl(callbackUrl, "/member"),
  });
  if (reason) searchParams.set("reason", reason);
  return `/login?${searchParams.toString()}`;
}

export function getRefreshSessionUrl(
  callbackUrl: string,
  mode: ServerSessionMode,
) {
  const searchParams = new URLSearchParams({
    callbackUrl: getSafeCallbackUrl(
      callbackUrl,
      mode === "optional" ? "/" : "/member",
    ),
    mode,
  });
  return `${REFRESH_SESSION_PATH}?${searchParams.toString()}`;
}

function parseSafeCallbackUrl(value: string | null | undefined) {
  if (
    !value ||
    value !== value.trim() ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return null;
  }

  try {
    const parsed = new URL(value, INTERNAL_ORIGIN);
    if (parsed.origin !== INTERNAL_ORIGIN) return null;
    if (
      parsed.pathname === REFRESH_SESSION_PATH ||
      parsed.pathname.startsWith(`${REFRESH_SESSION_PATH}/`)
    ) {
      return null;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}
