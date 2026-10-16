import { apiJsonError } from "@/lib/api-route-response";

const FORWARDED_RESPONSE_HEADERS = [
  "accept-ranges",
  "cache-control",
  "content-disposition",
  "content-length",
  "content-range",
  "content-type",
  "etag",
  "last-modified",
  "x-content-type-options",
] as const;

export async function proxyBackendBinary(
  url: string,
  accept: string,
  signal?: AbortSignal,
) {
  let response: Response;
  try {
    response = await fetch(url, {
      cache: "no-store",
      headers: { accept },
      signal,
    });
  } catch {
    return apiJsonError(
      503,
      "SERVICE_UNAVAILABLE",
      "The API service is temporarily unavailable.",
      { "Cache-Control": "no-store" },
    );
  }

  const headers = new Headers();
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (!headers.has("cache-control")) headers.set("Cache-Control", "no-store");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
