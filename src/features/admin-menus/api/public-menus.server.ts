import "server-only";

import { cache } from "react";

import type {
  PublicMenusResponse,
} from "../types";
import { getServerConfig } from "@/config/server";
import { readApiData } from "@/lib/api-response";

export const getPublicMenus = cache(
  async (
    locale: string,
    locations?: readonly string[],
  ): Promise<PublicMenusResponse> => {
    const backendApiUrl = getServerConfig().apiInternalUrl;
    const fallback: PublicMenusResponse = { locale, locations: [], menus: {} };
    if (!backendApiUrl) return fallback;
    try {
      const query = new URLSearchParams({ locale });
      if (locations?.length) query.set("locations", locations.join(","));
      const response = await fetch(
        `${backendApiUrl}/website/menus?${query.toString()}`,
        { next: { revalidate: 60, tags: ["public-website-menus"] } },
      );
      if (!response.ok) return fallback;
      return await readApiData<PublicMenusResponse>(response);
    } catch {
      return fallback;
    }
  },
);
