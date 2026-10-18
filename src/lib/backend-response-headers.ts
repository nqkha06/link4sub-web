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

export function copyBackendResponseHeaders(
  source: Headers,
  additionalNames: readonly string[] = [],
) {
  const headers = new Headers();
  for (const name of [...FORWARDED_RESPONSE_HEADERS, ...additionalNames]) {
    const value = source.get(name);
    if (value) headers.set(name, value);
  }
  if (!headers.has("cache-control")) headers.set("Cache-Control", "no-store");
  return headers;
}
