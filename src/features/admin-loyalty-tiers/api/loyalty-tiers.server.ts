import "server-only";

import { serializeLoyaltyTiersQuery } from "@/features/admin-loyalty-tiers/api/loyalty-tiers-query-serializer";
import { adaptLoyaltyTiersResponse } from "@/features/admin-loyalty-tiers/api/loyalty-tiers-response-adapter";
import type { LoyaltyTiersTableQuery } from "@/features/admin-loyalty-tiers/query/loyalty-tiers-search-params";
import type {
  AdminLoyaltyTier,
  LoyaltyTiersResponse,
} from "@/features/admin-loyalty-tiers/types";
import { serverApiFetch } from "@/lib/auth/server-api";
import { readApiData, readPaginatedApiResponse } from "@/lib/api-response";

export async function getLoyaltyTiersTableData(
  state: LoyaltyTiersTableQuery,
) {
  const response = await serverApiFetch(
    `/admin/loyalty-tiers?${serializeLoyaltyTiersQuery(state)}`,
    { cache: "no-store" },
  );
  return adaptLoyaltyTiersResponse(
    (await readPaginatedApiResponse(response)) as LoyaltyTiersResponse,
  );
}

export async function getLoyaltyTier(
  id: number,
): Promise<AdminLoyaltyTier | null> {
  const response = await serverApiFetch(
    `/admin/loyalty-tiers/${id}`,
    { cache: "no-store" },
  );
  if (response.status === 404) return null;
  return readApiData<AdminLoyaltyTier>(response);
}
