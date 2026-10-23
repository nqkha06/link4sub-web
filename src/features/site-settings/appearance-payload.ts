import type { AppearanceSettingsValues } from "./schemas/appearance-schema"

export function buildAppearanceSettingsPayload(
  values: AppearanceSettingsValues,
  defaultLocale?: string,
) {
  return {
    ...values,
    siteShortName: values.siteShortName || null,
    siteDescription: values.siteDescription || null,
    siteTagline: values.siteTagline || null,
    siteUrl: values.siteUrl || null,
    contactEmail: values.contactEmail || null,
    supportEmail: values.supportEmail || null,
    phone: values.phone || null,
    address: values.address || null,
    workingHours: values.workingHours || null,
    mapUrl: values.mapUrl || null,
    translations: values.translations
      .filter(
        (translation) =>
          translation.locale !== defaultLocale &&
          (translation.siteName ||
            translation.siteShortName ||
            translation.siteTagline ||
            translation.siteDescription),
      )
      .map((translation) => ({
        locale: translation.locale,
        siteName: translation.siteName || null,
        siteShortName: translation.siteShortName || null,
        siteTagline: translation.siteTagline || null,
        siteDescription: translation.siteDescription || null,
      })),
  }
}
