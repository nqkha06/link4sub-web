type BrowserRequest = Pick<Request, "headers" | "method">;

/**
 * Validate browser mutations against the configured public web origin.
 *
 * Behind Traefik, `request.nextUrl.origin` can describe the internal Next.js
 * listener rather than the public HTTPS origin. `WEB_URL` is the canonical
 * origin and remains stable across reverse-proxy hops.
 */
export function isTrustedBrowserRequest(
  request: BrowserRequest,
  expectedOrigin: string,
) {
  if (request.method === "GET" || request.method === "HEAD") return true;
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;

  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).origin === new URL(expectedOrigin).origin;
  } catch {
    return false;
  }
}

/**
 * Build an absolute redirect URL on the public web origin.
 *
 * Behind Traefik the Next.js listener sees `request.url` as
 * `https://0.0.0.0:3000/...` (from `HOSTNAME=0.0.0.0`), so redirects must be
 * resolved against `WEB_URL` instead of the incoming request URL.
 */
export function toPublicUrl(path: string, publicOrigin: string) {
  const safePath = path.startsWith("/") && !path.startsWith("//") ? path : "/";
  return new URL(safePath, publicOrigin);
}

/**
 * True for cross-site requests that are not top-level page navigations.
 *
 * A link from another site (Zalo, Facebook, …) to a protected page goes
 * through the session-refresh redirect; the whole redirect chain keeps
 * `Sec-Fetch-Site: cross-site`, so only embedded/fetch requests are blocked.
 */
export function isCrossSiteSubrequest(headers: Pick<Headers, "get">) {
  if (headers.get("sec-fetch-site") !== "cross-site") return false;
  return headers.get("sec-fetch-mode") !== "navigate";
}
