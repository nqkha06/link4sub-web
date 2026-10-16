"use client";

import { authenticatedApiFetch } from "@/lib/api-client";
import { readApiData } from "@/lib/api-response";

export async function selectMemberMonetizationLevel(
  monetizationLevelId: number,
) {
  const response = await authenticatedApiFetch(
    "/member/monetization-levels/selection",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monetizationLevelId }),
    },
  );

  return readApiData<{
    monetizationLevelId: number;
    usesSystemDefault: false;
  }>(response);
}
