import { notFound } from "next/navigation";

import { getPublicLinkSettings } from "@/features/link-settings/api/link-settings.server";
import { renderPublicBioPage } from "../../b/[slug]/page";
import { renderPublicLink } from "../../l/[slug]/page";

export const dynamic = "force-dynamic";

export default async function ConfiguredPublicLinkPage({
  params,
}: {
  params: Promise<{ slug: string; alias: string }>;
}) {
  const { slug: prefix, alias } = await params;
  const settings = await getPublicLinkSettings();

  if (settings.socialPrefix && prefix === settings.socialPrefix) {
    const page = await renderPublicLink(alias);
    if (page) return page;
  }
  if (settings.bioPrefix && prefix === settings.bioPrefix) {
    const page = await renderPublicBioPage(alias);
    if (page) return page;
  }
  notFound();
}
