import "server-only";

import { readApiData } from "@/lib/api-response";
import { serverApiFetch } from "@/lib/auth/server-api";

import type { LinkRecommendationsPreference } from "../types";

export async function getLinkRecommendationsPreference() {
  const response = await serverApiFetch(
    "/member/preferences/link-recommendations",
    { cache: "no-store" },
  );

  return readApiData<LinkRecommendationsPreference>(response);
}
