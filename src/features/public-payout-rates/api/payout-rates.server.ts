import "server-only";

import { cache } from "react";

import type { PublicPayoutRateLevel } from "@/features/public-payout-rates/types";
import { getServerConfig } from "@/config/server";
import { readApiData } from "@/lib/api-response";

export const getPublicPayoutRates = cache(
  async (levelId: number): Promise<PublicPayoutRateLevel | null> => {
    const backendApiUrl = getServerConfig().apiInternalUrl;
    if (!backendApiUrl) return null;

    try {
      const response = await fetch(
        `${backendApiUrl}/public/monetization-levels/${levelId}/payout-rates`,
        { next: { revalidate: 60, tags: [`public-payout-rates-${levelId}`] } },
      );
      if (!response.ok) return null;
      return await readApiData<PublicPayoutRateLevel>(response);
    } catch {
      return null;
    }
  },
);
