"use client";

import type { AdminLinkFraudSettings } from "../types";
import { authenticatedApiFetch } from "@/lib/api-client";
import { readApiData } from "@/lib/api-response";

export type UpdateLinkFraudSettingsInput = Omit<
  AdminLinkFraudSettings,
  "updatedAt"
>;

export async function updateLinkFraudSettings(
  values: UpdateLinkFraudSettingsInput,
) {
  const response = await authenticatedApiFetch("/admin/settings/link-fraud", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  return readApiData<AdminLinkFraudSettings>(response);
}
