import type { MetadataRoute } from "next";

import { getPublicSiteSettings } from "@/features/site-settings/api/public-settings.server";
import { LOCAL_SITE_ICON_FILES } from "@/lib/branding/local-site-icon-pipeline";
import { getLocalSiteIconInfo, localSiteIconUrl } from "@/lib/branding/local-site-icons";

/** Web App Manifest: cùng nguồn icon với metadata, đổi theo cài đặt admin. */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const [settings, siteIcon] = await Promise.all([
    getPublicSiteSettings(),
    getLocalSiteIconInfo(),
  ]);
  const icons = siteIcon
    ? [
        {
          src: localSiteIconUrl(LOCAL_SITE_ICON_FILES.icon192, siteIcon.version),
          type: "image/png",
          sizes: "192x192",
          purpose: "any" as const,
        },
        {
          src: localSiteIconUrl(LOCAL_SITE_ICON_FILES.icon512, siteIcon.version),
          type: "image/png",
          sizes: "512x512",
          purpose: "any" as const,
        },
      ]
    : [];
  return {
    name: settings.siteName,
    short_name: settings.siteShortName || settings.siteName,
    description: settings.siteDescription || undefined,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    icons,
  };
}
