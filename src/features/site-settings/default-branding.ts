import type { PublicSiteSettings, SiteMedia } from "./types.ts";

import { DEFAULT_SITE_LOGO_URL } from "../../lib/branding/default-site-brand.ts";

export const DEFAULT_SITE_LOGO_MEDIA = {
  id: 0,
  alias: 0,
  name: "STU default logo",
  mimeType: "image/png",
  extension: "png",
  downloadUrl: DEFAULT_SITE_LOGO_URL,
} satisfies SiteMedia;

/** Mỗi slot logo có fallback riêng để admin có thể ghi đè độc lập. */
export function withDefaultSiteLogos(
  settings: PublicSiteSettings,
): PublicSiteSettings {
  return {
    ...settings,
    branding: {
      ...settings.branding,
      logoLight: settings.branding.logoLight ?? DEFAULT_SITE_LOGO_MEDIA,
      logoDark: settings.branding.logoDark ?? DEFAULT_SITE_LOGO_MEDIA,
      logoIcon: settings.branding.logoIcon ?? DEFAULT_SITE_LOGO_MEDIA,
    },
  };
}
