import type { AuthUser } from "@/features/auth/types"
import { getSafeCallbackUrl } from "@/lib/auth/callback-url"

export function getDashboardHref(
  user: Pick<AuthUser, "permissions">,
): "/admin" | "/member" {
  return user.permissions.includes("admin.access") ? "/admin" : "/member"
}

export function getSignedInRedirect(
  user: Pick<AuthUser, "permissions">,
  callbackUrl?: string,
) {
  const fallback = getDashboardHref(user)
  const safeCallbackUrl = getSafeCallbackUrl(callbackUrl, fallback)

  const pathname = safeCallbackUrl.split(/[?#]/, 1)[0]
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password"
  ) {
    return fallback
  }
  if (pathname?.startsWith("/admin") && fallback !== "/admin") {
    return fallback
  }
  return safeCallbackUrl
}
