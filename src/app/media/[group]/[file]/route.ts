import type { NextRequest } from "next/server";

import { getServerConfig } from "@/config/server";
import { apiJsonError } from "@/lib/api-route-response";
import { proxyBackendBinary } from "@/lib/backend-binary-proxy";

export const runtime = "nodejs";

/**
 * URL file/ảnh công khai: `/media/site/{mã}.{đuôi}` (admin upload) và
 * `/media/user/{mã}.{đuôi}` (thành viên upload), `/media/brand/{hash}-{tên}`
 * (icon branding tạo sẵn). Có đúng URL là xem được.
 */
const FILE_NAME_BY_GROUP: Record<string, RegExp> = {
  site: /^[0-9A-Za-z]{12}\.[a-z0-9]{1,8}$/,
  user: /^[0-9A-Za-z]{12}\.[a-z0-9]{1,8}$/,
  // Icon branding tạo sẵn: `{hash nội dung}-{tên}`, API trả cache immutable.
  brand: /^[0-9a-f]{16}-[a-z0-9-]+\.(?:png|ico)$/,
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ group: string; file: string }> },
) {
  const backendApiUrl = getServerConfig().apiInternalUrl;
  if (!backendApiUrl) {
    return apiJsonError(503, "SERVICE_UNAVAILABLE", "The API service is temporarily unavailable.");
  }
  const { group, file } = await context.params;
  if (!FILE_NAME_BY_GROUP[group]?.test(file)) {
    return apiJsonError(404, "RESOURCE_NOT_FOUND", "File not found.", {
      "Cache-Control": "no-store",
    });
  }
  return proxyBackendBinary(
    `${backendApiUrl}/media/${group}/${file}`,
    request.headers.get("accept") || "*/*",
    request.signal,
  );
}
