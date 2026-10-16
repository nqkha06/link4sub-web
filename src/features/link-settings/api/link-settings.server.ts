import "server-only";

import { cache } from "react";

import { getServerConfig } from "@/config/server";
import { readApiData } from "@/lib/api-response";
import { serverApiFetch } from "@/lib/auth/server-api";
import type { AdminLinkSettings, LinkSettings } from "../types";

export async function getAdminLinkSettings() {
  const response = await serverApiFetch("/admin/settings/links", {
    cache: "no-store",
  });
  return readApiData<AdminLinkSettings>(response);
}

export const getPublicLinkSettings = cache(async (): Promise<LinkSettings> => {
  const config = getServerConfig();
  const fallback: LinkSettings = {
    publicDomain: config.webUrl,
    socialPrefix: "",
    bioPrefix: "b",
    aliasLength: 8,
    aliasCaseSensitive: false,
  };
  if (!config.apiInternalUrl) return fallback;
  try {
    const response = await fetch(`${config.apiInternalUrl}/public/link-settings`, {
      cache: "no-store",
    });
    return response.ok ? readApiData<LinkSettings>(response) : fallback;
  } catch {
    return fallback;
  }
});
