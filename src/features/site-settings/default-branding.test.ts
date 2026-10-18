import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { PublicSiteSettings, SiteMedia } from "./types.ts";
import {
  DEFAULT_SITE_LOGO_MEDIA,
  withDefaultSiteLogos,
} from "./default-branding.ts";
import {
  DEFAULT_SITE_LOGO_URL,
  fallbackToDefaultSiteLogo,
} from "../../lib/branding/default-site-brand.ts";

const settings: PublicSiteSettings = {
  siteName: "STU",
  siteShortName: null,
  siteDescription: null,
  siteTagline: null,
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

const customLogo: SiteMedia = {
  id: 42,
  alias: 42,
  name: "Custom light logo",
  mimeType: "image/png",
  extension: "png",
  downloadUrl: "/media/site/custom.png",
};

describe("default site branding", () => {
  it("uses the default image for all three empty logo slots", () => {
    const branded = withDefaultSiteLogos(settings);

    assert.equal(branded.branding.logoLight, DEFAULT_SITE_LOGO_MEDIA);
    assert.equal(branded.branding.logoDark, DEFAULT_SITE_LOGO_MEDIA);
    assert.equal(branded.branding.logoIcon, DEFAULT_SITE_LOGO_MEDIA);
  });

  it("preserves each admin override independently", () => {
    const branded = withDefaultSiteLogos({
      ...settings,
      branding: { ...settings.branding, logoLight: customLogo },
    });

    assert.equal(branded.branding.logoLight, customLogo);
    assert.equal(branded.branding.logoDark, DEFAULT_SITE_LOGO_MEDIA);
    assert.equal(branded.branding.logoIcon, DEFAULT_SITE_LOGO_MEDIA);
  });

  it("falls back when an admin logo URL no longer exists", () => {
    const image = {
      baseURI: "https://stu.example/admin/settings/appearance",
      src: "https://stu.example/media/site/missing.png",
    } as HTMLImageElement;

    fallbackToDefaultSiteLogo(image);

    assert.equal(image.src, `https://stu.example${DEFAULT_SITE_LOGO_URL}`);
  });
});
