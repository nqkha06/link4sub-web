import "server-only";

import { serializeLinkReportsTableQuery } from "@/features/admin-link-reports/api/link-reports-query-serializer";
import type { LinkReportsTableQuery } from "@/features/admin-link-reports/query/link-reports-search-params";
import type {
  AdminLinkReportListItem,
  AdminLinkReportsResponse,
  AdminLinkReportsTableData,
} from "@/features/admin-link-reports/types";
import { serverApiFetch } from "@/lib/auth/server-api";
import { readPaginatedApiResponse } from "@/lib/api-response";

export async function getAdminLinkReportsTableData(
  state: LinkReportsTableQuery,
): Promise<AdminLinkReportsTableData> {
  const response = await serverApiFetch(
    `/admin/link-reports?${serializeLinkReportsTableQuery(state)}`,
    { cache: "no-store" },
  );
  const result = (await readPaginatedApiResponse<AdminLinkReportListItem>(
    response,
  )) as AdminLinkReportsResponse;
  return {
    data: result.data,
    total: result.meta.total,
    pageCount: result.meta.totalPages,
    summary: result.meta.summary,
  };
}
