import "server-only"

import { serializeAdminSocialLinksQuery } from "@/features/admin-social-links/api/social-links-query-serializer"
import { adaptAdminSocialLinksResponse } from "@/features/admin-social-links/api/social-links-response-adapter"
import type { AdminSocialLinksTableQuery } from "@/features/admin-social-links/query/social-links-search-params"
import type { AdminSocialLinksResponse } from "@/features/admin-social-links/types"
import { serverApiFetch } from "@/lib/auth/server-api"
import { readPaginatedApiResponse } from "@/lib/api-response"

export async function getAdminSocialLinksTableData(
  state: AdminSocialLinksTableQuery,
) {
  const response = await serverApiFetch(
    `/admin/social-links?${serializeAdminSocialLinksQuery(state)}`,
    {
      cache: "no-store",
    },
  )

  return adaptAdminSocialLinksResponse(
    (await readPaginatedApiResponse(response)) as AdminSocialLinksResponse,
  )
}
