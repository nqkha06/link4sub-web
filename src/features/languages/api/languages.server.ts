import "server-only";

import type { PublicLanguagesResponse } from "../types";
import { getServerConfig } from "@/config/server";
import { readPaginatedApiResponse } from "@/lib/api-response";

export async function getPublicLanguageDirection(locale: string) {
  const backendApiUrl = getServerConfig().apiInternalUrl;
  if (!backendApiUrl) return "ltr" as const;
  try {
    const response = await fetch(`${backendApiUrl}/languages`, {
      cache: "no-store",
    });
    if (!response.ok) return "ltr" as const;
    const result = await readPaginatedApiResponse<PublicLanguagesResponse["data"][number]>(response);
    return result.data.find((item) => item.locale === locale)?.isRtl
      ? ("rtl" as const)
      : ("ltr" as const);
  } catch {
    return "ltr" as const;
  }
}
