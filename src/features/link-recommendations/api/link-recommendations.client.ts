"use client";

import { authenticatedApiRequest } from "@/lib/api-client";

import type { LinkRecommendationsPreference } from "../types";

export function updateLinkRecommendationsPreference(enabled: boolean) {
  return authenticatedApiRequest<LinkRecommendationsPreference>(
    "/member/preferences/link-recommendations",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    },
  );
}
