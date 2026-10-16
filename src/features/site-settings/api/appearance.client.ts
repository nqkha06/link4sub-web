"use client";

import type { AppearanceSettingsValues } from "@/features/site-settings/schemas/appearance-schema";
import type { AdminWebsiteSettings } from "@/features/site-settings/types";
import { authenticatedApiFetch } from "@/lib/api-client";
import { readApiData } from "@/lib/api-response";

export async function updateAppearanceSettings(
  values: AppearanceSettingsValues,
) {
  const response = await authenticatedApiFetch("/admin/settings/appearance", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
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
            translation.siteName ||
            translation.siteShortName ||
            translation.siteTagline ||
            translation.siteDescription,
        )
        .map((translation) => ({
          locale: translation.locale,
          siteName: translation.siteName || null,
          siteShortName: translation.siteShortName || null,
          siteTagline: translation.siteTagline || null,
          siteDescription: translation.siteDescription || null,
        })),
    }),
  });
  return readApiData<AdminWebsiteSettings>(response);
}
