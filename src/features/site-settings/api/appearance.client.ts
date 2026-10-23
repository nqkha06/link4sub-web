"use client";

import type { AppearanceSettingsValues } from "@/features/site-settings/schemas/appearance-schema";
import type { AdminWebsiteSettings } from "@/features/site-settings/types";
import { buildAppearanceSettingsPayload } from "@/features/site-settings/appearance-payload";
import { authenticatedApiFetch } from "@/lib/api-client";
import { readApiData } from "@/lib/api-response";

export async function updateAppearanceSettings(
  values: AppearanceSettingsValues,
  defaultLocale?: string,
) {
  const response = await authenticatedApiFetch("/admin/settings/appearance", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildAppearanceSettingsPayload(values, defaultLocale)),
  });
  return readApiData<AdminWebsiteSettings>(response);
}
