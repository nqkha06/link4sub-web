import "server-only"

import { serializeAdminSnippetsQuery } from "@/features/admin-snippets/api/snippets-query-serializer"
import { adaptAdminSnippetsResponse } from "@/features/admin-snippets/api/snippets-response-adapter"
import type { AdminSnippetsTableQuery } from "@/features/admin-snippets/query/snippets-search-params"
import type { AdminSnippetsResponse } from "@/features/admin-snippets/types"
import { serverApiFetch } from "@/lib/auth/server-api"
import { readPaginatedApiResponse } from "@/lib/api-response"

export async function getAdminSnippetsTableData(
  state: AdminSnippetsTableQuery,
) {
  const response = await serverApiFetch(
    `/admin/snippets?${serializeAdminSnippetsQuery(state)}`,
    { cache: "no-store" },
  )
  return adaptAdminSnippetsResponse(
    (await readPaginatedApiResponse(response)) as AdminSnippetsResponse,
  )
}
