import "server-only";

import { getLocale } from "next-intl/server";
import { cache } from "react";

import type { PublicSiteSettings } from "@/features/site-settings/types";
import { getServerConfig } from "@/config/server";
import { readApiData } from "@/lib/api-response";

export const PUBLIC_SITE_SETTINGS_TAG = "public-site-settings";

const fallback: PublicSiteSettings = {
  siteName: "Website",
  siteShortName: null,
  siteDescription:
    "Create link-in-bio pages, verified social unlocks and protected content experiences that turn creator traffic into real growth.",
  siteTagline: "One link. More momentum.",
  siteUrl: null,
  branding: {
    logoLight: null,
    logoDark: null,
    logoIcon: null,
    defaultOgImage: null,
  },
  socialLinks: [],
  contact: {
    email: null,
    supportEmail: null,
    phone: null,
    address: null,
    workingHours: null,
    mapUrl: null,
  },
  showLanguageFlags: true,
  updatedAt: new Date(0).toISOString(),
};

export const getPublicSiteSettings = cache(async () => {
  const backendApiUrl = getServerConfig().apiInternalUrl;
  if (!backendApiUrl) return fallback;
  try {
    const locale = await getLocale();
    const response = await fetch(
      `${backendApiUrl}/site-config?locale=${encodeURIComponent(locale)}`,
      { next: { revalidate: 3600, tags: [PUBLIC_SITE_SETTINGS_TAG] } },
    );
    if (!response.ok) return fallback;
    const settings = await readApiData<PublicSiteSettings>(response);
    // API cũ chưa trả trường này thì dùng mặc định.
    return {
      ...settings,
      showLanguageFlags: settings.showLanguageFlags ?? fallback.showLanguageFlags,
    };
  } catch {
    return fallback;
  }
});
