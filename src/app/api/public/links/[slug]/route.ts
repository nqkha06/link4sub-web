import { resolveClientIp } from "@/lib/internal-headers";
import { completeLinkVisit } from "@/lib/api-client";
import { apiJsonError, apiJsonSuccess } from "@/lib/api-route-response";

const corsHeaders = {
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "no-store",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const url = new URL(request.url);
    const visitToken = url.searchParams.get("visitToken");
    if (!visitToken) {
      return apiJsonError(
        400,
        "VISIT_TOKEN_REQUIRED",
        "A visit token is required.",
        corsHeaders,
      );
    }
    const link = await completeLinkVisit(slug, visitToken, {
      ipAddress: resolveClientIp(request.headers),
      deviceId: url.searchParams.get("deviceId"),
      adBlockDetected: url.searchParams.get("adBlockDetected") === "1",
    });

    return apiJsonSuccess(link, "Link visit completed successfully.", {
      headers: corsHeaders,
    });
  } catch {
    return apiJsonError(
      404,
      "LINK_NOT_FOUND",
      "The requested link was not found.",
      corsHeaders,
    );
  }
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
