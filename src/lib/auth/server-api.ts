import "server-only";

import { cookies } from "next/headers";

import { getServerConfig } from "@/config/server";

const backendApiUrl = getServerConfig().apiInternalUrl;

/**
 * Transport HTTP thuần cho Server Components. Hàm này chỉ forward cookie và
 * trả Response; quyết định refresh/redirect thuộc về server-session.
 */
export async function serverApiFetch(path: string, init: RequestInit = {}) {
  if (!backendApiUrl) {
    throw new Error("Missing API_URL environment variable.");
  }

  const cookieStore = await cookies();
  const headers = new Headers(init.headers);
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${encodeURIComponent(value)}`)
    .join("; ");
  if (cookieHeader) headers.set("Cookie", cookieHeader);

  return fetch(
    `${backendApiUrl}${path.startsWith("/") ? path : `/${path}`}`,
    {
      ...init,
      headers,
      cache: init.cache ?? "no-store",
    },
  );
}
