import "server-only";

import type { MemberMonetizationLevelsResponse } from "@/features/member-monetization-levels/types";
import { serverApiFetch } from "@/lib/auth/server-api";
import { readPaginatedApiResponse } from "@/lib/api-response";

export async function getMemberMonetizationLevels(): Promise<MemberMonetizationLevelsResponse> {
  const response = await serverApiFetch(
    "/member/monetization-levels",
    { cache: "no-store" },
  );

  return readPaginatedApiResponse<MemberMonetizationLevelsResponse["data"][number]>(
    response,
  ) as Promise<MemberMonetizationLevelsResponse>;
}
