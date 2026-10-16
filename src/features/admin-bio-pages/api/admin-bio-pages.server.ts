import "server-only";

import { serializeBioPagesTableQuery } from "@/features/admin-bio-pages/api/admin-bio-pages-query-serializer";
import type { BioPagesTableQuery } from "@/features/admin-bio-pages/query/bio-pages-search-params";
import type {
  AdminBioPagesResponse,
  AdminBioPagesTableData,
} from "@/features/admin-bio-pages/types";
import { serverApiFetch } from "@/lib/auth/server-api";
import { readPaginatedApiResponse } from "@/lib/api-response";

export async function getAdminBioPagesTableData(
  state: BioPagesTableQuery,
): Promise<AdminBioPagesTableData> {
  const response = await serverApiFetch(
    `/admin/bio-pages?${serializeBioPagesTableQuery(state)}`,
    { cache: "no-store" },
  );
  const result = (await readPaginatedApiResponse(response)) as AdminBioPagesResponse;
  return {
    data: result.data,
    total: result.meta.total,
    pageCount: result.meta.totalPages,
    summary: result.meta.summary ?? { published: 0, draft: 0 },
  };
}
