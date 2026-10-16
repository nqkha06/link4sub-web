import { siteIconResponse } from "@/lib/branding/site-icon-response";

export const runtime = "nodejs";

export function GET(request: Request) {
  return siteIconResponse("favicon", request);
}
