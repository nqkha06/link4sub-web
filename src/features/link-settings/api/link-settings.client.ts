"use client";

import { authenticatedApiFetch } from "@/lib/api-client";
import { readApiData } from "@/lib/api-response";
import type { AdminLinkSettings, LinkCleanupPreview, LinkSettings } from "../types";

export async function updateLinkSettings(values: AdminLinkSettings) {
  const response = await authenticatedApiFetch("/admin/settings/links", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      publicDomain: values.publicDomain,
      socialPrefix: values.socialPrefix,
      bioPrefix: values.bioPrefix,
      aliasLength: values.aliasLength,
      aliasCaseSensitive: values.aliasCaseSensitive,
      cleanupInactiveEnabled: values.cleanupInactiveEnabled,
      cleanupInactiveDays: values.cleanupInactiveDays,
      cleanupApiEnabled: values.cleanupApiEnabled,
      cleanupApiDays: values.cleanupApiDays,
      cleanupExpiredEnabled: values.cleanupExpiredEnabled,
      cleanupExpiredDays: values.cleanupExpiredDays,
      cleanupTrashEnabled: values.cleanupTrashEnabled,
      cleanupTrashDays: values.cleanupTrashDays,
      cleanupAccessLogRetentionDays: values.cleanupAccessLogRetentionDays,
    }),
  });
  return readApiData<AdminLinkSettings>(response);
}

export async function getLinkCleanupPreview() {
  const response = await authenticatedApiFetch(
    "/admin/settings/links/cleanup/preview",
    { cache: "no-store" },
  );
  return readApiData<LinkCleanupPreview>(response);
}

export async function getPublicLinkSettingsClient() {
  const response = await authenticatedApiFetch("/public/link-settings");
  return readApiData<LinkSettings>(response);
}
