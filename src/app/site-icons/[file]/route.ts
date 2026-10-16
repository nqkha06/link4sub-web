import {
  isLocalSiteIconFile,
  localSiteIconResponse,
} from "@/lib/branding/local-site-icons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ file: string }> },
) {
  const { file } = await context.params;
  if (!isLocalSiteIconFile(file)) {
    return new Response(null, { status: 404 });
  }
  return localSiteIconResponse(file, request);
}
