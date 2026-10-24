import type { NextRequest } from "next/server"
import { getServerConfig } from "@/config/server";
import { apiJsonError } from "@/lib/api-route-response";
import { proxyBackendBinary } from "@/lib/backend-binary-proxy";

export const runtime = "nodejs"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const backendApiUrl = getServerConfig().apiInternalUrl
  if (!backendApiUrl) {
    return apiJsonError(503, "SERVICE_UNAVAILABLE", "The API service is temporarily unavailable.")
  }

  const { slug } = await context.params
  return proxyBackendBinary(
    `${backendApiUrl}/files/link/${encodeURIComponent(slug)}/download`,
    request.headers.get("accept") || "application/octet-stream",
    request.signal,
    undefined,
    "manual",
  )
}
