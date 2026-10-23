import { apiJsonError } from "@/lib/api-route-response";
import { copyBackendResponseHeaders } from "@/lib/backend-response-headers";

export async function proxyBackendBinary(
  url: string,
  accept: string,
  signal?: AbortSignal,
  /** Header Range của trình duyệt: chuyển tiếp để nhạc/video phát được ngay (206). */
  range?: string | null,
) {
  let response: Response;
  try {
    response = await fetch(url, {
      cache: "no-store",
      headers: range ? { accept, range } : { accept },
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

  const headers = copyBackendResponseHeaders(response.headers);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
