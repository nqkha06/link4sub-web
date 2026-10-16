import "server-only";

import { serializeMonetizationLevelsQuery } from "@/features/admin-monetization-levels/api/monetization-levels-query-serializer";
import { adaptMonetizationLevelsResponse } from "@/features/admin-monetization-levels/api/monetization-levels-response-adapter";
import type { MonetizationLevelsTableQuery } from "@/features/admin-monetization-levels/query/monetization-levels-search-params";
import type {
  AdminMonetizationLevel,
  MonetizationLevelsResponse,
} from "@/features/admin-monetization-levels/types";
import { serverApiFetch } from "@/lib/auth/server-api";
import { readApiData, readPaginatedApiResponse } from "@/lib/api-response";

export async function getMonetizationLevelsTableData(
  state: MonetizationLevelsTableQuery,
) {
  const response = await serverApiFetch(
    `/admin/monetization-levels?${serializeMonetizationLevelsQuery(state)}`,
    {
      cache: "no-store",
    },
  );
  return adaptMonetizationLevelsResponse(
    (await readPaginatedApiResponse(response)) as MonetizationLevelsResponse,
  );
}

export async function getMonetizationLevel(
  id: number,
): Promise<AdminMonetizationLevel | null> {
  const response = await serverApiFetch(
    `/admin/monetization-levels/${id}`,
    { cache: "no-store" },
  );

  if (response.status === 404) return null;
  return readApiData<AdminMonetizationLevel>(response);
}
