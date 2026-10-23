import type { NextRequest } from "next/server";
import { getServerConfig } from "@/config/server";
import { apiJsonError } from "@/lib/api-route-response";
import { proxyBackendBinary } from "@/lib/backend-binary-proxy";

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string; blockId: string }> }) {
  const api = getServerConfig().apiInternalUrl;
  if (!api) return apiJsonError(503, "SERVICE_UNAVAILABLE", "The API service is temporarily unavailable.");
  const { slug, blockId } = await context.params;
  return proxyBackendBinary(
    `${api}/public/bio-pages/${encodeURIComponent(slug)}/downloads/${encodeURIComponent(blockId)}`,
    "application/octet-stream", request.signal, undefined, "manual",
  );
}
