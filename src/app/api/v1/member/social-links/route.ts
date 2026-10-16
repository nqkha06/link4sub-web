import { NextResponse, type NextRequest } from "next/server";
import { getServerConfig } from "@/config/server";
import { apiJsonError } from "@/lib/api-route-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const backendApiUrl = getServerConfig().apiInternalUrl;

export async function POST(request: NextRequest) {
  if (!backendApiUrl) {
    return apiJsonError(503, "SERVICE_UNAVAILABLE", "The API service is temporarily unavailable.");
  }

  const headers = new Headers({
    accept: "application/json",
    "content-type": request.headers.get("content-type") || "application/json",
  });
  const authorization = request.headers.get("authorization");
  const apiKey = request.headers.get("x-api-key");
  if (authorization) headers.set("authorization", authorization);
  if (apiKey) headers.set("x-api-key", apiKey);

  try {
    const response = await fetch(`${backendApiUrl}/v1/member/social-links`, {
      method: "POST",
      headers,
      body: await request.arrayBuffer(),
      cache: "no-store",
    });
    const body = await response.arrayBuffer();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") || "application/json",
      },
    });
  } catch {
    return apiJsonError(503, "SERVICE_UNAVAILABLE", "The API service is temporarily unavailable.");
  }
}
