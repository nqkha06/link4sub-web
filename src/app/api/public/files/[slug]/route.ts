import type { NextRequest } from "next/server"
import { getServerConfig } from "@/config/server";
import { apiJsonError } from "@/lib/api-route-response";
import { proxyBackendBinary } from "@/lib/backend-binary-proxy";
import { completeLinkVisit } from "@/lib/api-client";
import { resolveClientIp } from "@/lib/internal-headers";

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
  let query = new URLSearchParams(request.nextUrl.search);
  const visitToken = query.get("visitToken");
  if (visitToken) {
    try {
      const completed = await completeLinkVisit(slug, visitToken, {
        ipAddress: resolveClientIp(request.headers),
        deviceId: query.get("deviceId"),
        adBlockDetected: query.get("adBlockDetected") === "1",
      });
      if (completed.inputType !== "file" || !completed.destinationUrl) throw new Error("Invalid destination.");
      query = new URL(completed.destinationUrl, getServerConfig().webUrl).searchParams;
    } catch {
      return apiJsonError(403, "DOWNLOAD_NOT_AUTHORIZED", "Complete the link unlock before downloading.", { "Cache-Control": "no-store" });
    }
  }
  const grant = new URLSearchParams();
  for (const name of ["e", "s"]) {
    const value = query.get(name);
    if (value) grant.set(name, value);
  }
  return proxyBackendBinary(
    `${backendApiUrl}/files/link/${encodeURIComponent(slug)}/download?${grant.toString()}`,
    request.headers.get("accept") || "application/octet-stream",
    request.signal,
    undefined,
    "manual",
  )
}
