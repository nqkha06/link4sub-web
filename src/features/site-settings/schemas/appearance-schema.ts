import { z } from "zod";

import { socialPlatforms } from "../types.ts";

export type AppearanceValidationKey =
  | "invalidUrl"
  | "httpsUrl"
  | "siteNameRequired"
  | "urlRequired"
  | "duplicatePlatform"
  | "invalidContactEmail"
  | "invalidSupportEmail"
  | "duplicateLocale";

/**
 * Builds the schema with localised validation messages. `t` resolves a
 * validation key (see Admin.siteSettings.validation) to the active locale.
 */
export function createAppearanceSettingsSchema(
  t: (key: AppearanceValidationKey) => string,
) {
const optionalUrl = z.string().trim().refine(
  (value) => !value || URL.canParse(value),
  t("invalidUrl"),
);
const optionalHttpsUrl = z.string().trim().refine(
  (value) => !value || (URL.canParse(value) && new URL(value).protocol === "https:"),
  t("httpsUrl"),
);

return z.object({
  siteName: z.string().trim().min(1, t("siteNameRequired")).max(120),
  siteShortName: z.string().trim().max(40),
  siteDescription: z.string().trim().max(320),
  siteTagline: z.string().trim().max(160),
  siteUrl: optionalUrl,
  logoLightId: z.number().int().positive().nullable(),
  logoDarkId: z.number().int().positive().nullable(),
  logoIconId: z.number().int().positive().nullable(),
  faviconId: z.number().int().positive().nullable(),
  defaultOgImageId: z.number().int().positive().nullable(),
  socialLinks: z
    .array(
      z.object({
        platform: z.enum(socialPlatforms),
        url: optionalHttpsUrl.refine(Boolean, t("urlRequired")),
        isActive: z.boolean(),
        sortOrder: z.number().int().min(0).max(1000),
      }),
    )
    .max(10)
    .refine(
      (links) => new Set(links.map((link) => link.platform)).size === links.length,
      t("duplicatePlatform"),
    ),
  contactEmail: z.string().trim().refine(
    (value) => !value || z.email().safeParse(value).success,
    t("invalidContactEmail"),
  ),
  supportEmail: z.string().trim().refine(
    (value) => !value || z.email().safeParse(value).success,
    t("invalidSupportEmail"),
  ),
  phone: z.string().trim().max(50),
  address: z.string().trim().max(500),
  workingHours: z.string().trim().max(200),
  mapUrl: optionalHttpsUrl,
  showLanguageFlags: z.boolean(),
  translations: z
    .array(
      z.object({
        locale: z.string().trim().min(1),
        siteName: z.string().trim().max(120),
        siteShortName: z.string().trim().max(40),
        siteTagline: z.string().trim().max(160),
        siteDescription: z.string().trim().max(320),
      }),
    )
    .refine(
      (translations) =>
        new Set(translations.map((translation) => translation.locale)).size ===
        translations.length,
      t("duplicateLocale"),
    ),
});
}

/** Default instance (messages are the validation keys); the UI uses the factory. */
export const appearanceSettingsSchema = createAppearanceSettingsSchema((key) => key);

export type AppearanceSettingsValues = z.infer<typeof appearanceSettingsSchema>;
