export const appearanceTabs = ["general", "branding", "social", "contact"] as const;
export type AppearanceTab = (typeof appearanceTabs)[number];

export const socialPlatforms = [
  "facebook",
  "youtube",
  "instagram",
  "tiktok",
  "x",
  "linkedin",
  "github",
  "discord",
  "telegram",
  "zalo",
] as const;
export type SocialPlatform = (typeof socialPlatforms)[number];

export type SiteMedia = {
  id: number;
  alias: number;
  name: string;
  mimeType: string;
  extension: string | null;
  downloadUrl: string;
};

export type WebsiteSocialLink = {
  platform: SocialPlatform;
  url: string;
  isActive: boolean;
  sortOrder: number;
};

export type WebsiteSettingsTranslation = {
  locale: string;
  siteName: string | null;
  siteShortName: string | null;
  siteTagline: string | null;
  siteDescription: string | null;
};

export type AdminWebsiteSettings = {
  id: number;
  siteName: string;
  siteShortName: string | null;
  siteDescription: string | null;
  siteTagline: string | null;
  siteUrl: string | null;
  logoLightId: number | null;
  logoDarkId: number | null;
  logoIconId: number | null;
  faviconId: number | null;
  defaultOgImageId: number | null;
  branding: {
    logoLight: SiteMedia | null;
    logoDark: SiteMedia | null;
    logoIcon: SiteMedia | null;
    favicon: SiteMedia | null;
    defaultOgImage: SiteMedia | null;
  };
  socialLinks: WebsiteSocialLink[];
  contactEmail: string | null;
  supportEmail: string | null;
  phone: string | null;
  address: string | null;
  workingHours: string | null;
  mapUrl: string | null;
  showLanguageFlags: boolean;
  translations: WebsiteSettingsTranslation[];
  updatedAt: string;
};

export type PublicSiteSettings = {
  siteName: string;
  siteShortName: string | null;
  siteDescription: string | null;
  siteTagline: string | null;
  siteUrl: string | null;
  branding: Omit<AdminWebsiteSettings["branding"], "favicon">;
  socialLinks: WebsiteSocialLink[];
  contact: {
    email: string | null;
    supportEmail: string | null;
    phone: string | null;
    address: string | null;
    workingHours: string | null;
    mapUrl: string | null;
  };
  showLanguageFlags: boolean;
  updatedAt: string;
};
