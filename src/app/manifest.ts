import type { MetadataRoute } from "next";

import { getPublicSiteSettings } from "@/features/site-settings/api/public-settings.server";
import { DEFAULT_SITE_ICON_URLS } from "@/lib/branding/default-site-brand";
import { LOCAL_SITE_ICON_FILES } from "@/lib/branding/local-site-icon-pipeline";
import { getLocalSiteIconInfo, localSiteIconUrl } from "@/lib/branding/local-site-icons";

/** Web App Manifest: cùng nguồn icon với metadata, đổi theo cài đặt admin. */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const [settings, siteIcon] = await Promise.all([
    getPublicSiteSettings(),
    getLocalSiteIconInfo(),
  ]);
  const icons = [
    {
      src: siteIcon
        ? localSiteIconUrl(LOCAL_SITE_ICON_FILES.icon192, siteIcon.version)
        : DEFAULT_SITE_ICON_URLS.icon192,
      type: "image/png",
      sizes: "192x192",
      purpose: "any" as const,
    },
    {
      src: siteIcon
        ? localSiteIconUrl(LOCAL_SITE_ICON_FILES.icon512, siteIcon.version)
        : DEFAULT_SITE_ICON_URLS.icon512,
      type: "image/png",
      sizes: "512x512",
      purpose: "any" as const,
    },
  ];
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
