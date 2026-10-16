import "server-only";

import type { MemberLoyaltyData } from "@/features/loyalty/types";
import { serverApiFetch } from "@/lib/auth/server-api";
import { readApiData } from "@/lib/api-response";

export async function getMemberLoyalty(locale: string) {
  const searchParams = new URLSearchParams({ locale });
  const response = await serverApiFetch(
    `/member/loyalty?${searchParams.toString()}`,
    { cache: "no-store" },
  );

  return readApiData<MemberLoyaltyData>(response);
}
