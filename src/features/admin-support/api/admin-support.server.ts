import "server-only";

import { serializeSupportTableQuery } from "@/features/admin-support/api/admin-support-query-serializer";
import type { SupportTableQuery } from "@/features/admin-support/query/support-search-params";
import type {
  AdminSupportTableData,
  AdminSupportTicketsResponse,
} from "@/features/admin-support/types";
import { serverApiFetch } from "@/lib/auth/server-api";
import { readPaginatedApiResponse } from "@/lib/api-response";

export async function getAdminSupportTableData(
  state: SupportTableQuery,
): Promise<AdminSupportTableData> {
  const response = await serverApiFetch(
    `/admin/support/tickets?${serializeSupportTableQuery(state)}`,
    { cache: "no-store" },
  );
  const result = (await readPaginatedApiResponse(response)) as AdminSupportTicketsResponse;
  return {
    data: result.data,
    total: result.meta.total,
    pageCount: result.meta.totalPages,
    summary: result.meta.summary ?? { open: 0, waiting: 0, urgent: 0, unassigned: 0 },
  };
}
