import "server-only";

import { cache } from "react";

import { publicPagePath } from "@/features/pages/public-page-url";
import type { PublicPage } from "@/features/pages/types";
import { getServerConfig } from "@/config/server";
import { readApiData } from "@/lib/api-response";

export const getPublicPage = cache(async (input: string, locale?: string) => {
  const path = publicPagePath(input);
  const backendApiUrl = getServerConfig().apiInternalUrl;
  if (!path || !backendApiUrl) return null;

  const slug = path.slice(1);
  const query = locale ? `?locale=${encodeURIComponent(locale)}` : "";
  const response = await fetch(
    `${backendApiUrl}/public/pages/${encodeURIComponent(slug)}${query}`,
    { cache: "no-store" },
  );
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Không thể tải trang public (${response.status}).`);
  }
  return readApiData<PublicPage>(response);
});
