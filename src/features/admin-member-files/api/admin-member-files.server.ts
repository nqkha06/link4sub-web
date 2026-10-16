import "server-only";

import { serializeMemberFilesTableQuery } from "@/features/admin-member-files/api/admin-member-files-query-serializer";
import type { MemberFilesTableQuery } from "@/features/admin-member-files/query/member-files-search-params";
import type {
  AdminMemberFilesResponse,
  AdminMemberFilesTableData,
} from "@/features/admin-member-files/types";
import { readPaginatedApiResponse } from "@/lib/api-response";
import { serverApiFetch } from "@/lib/auth/server-api";

export async function getAdminMemberFilesTableData(
  state: MemberFilesTableQuery,
): Promise<AdminMemberFilesTableData> {
  const response = await serverApiFetch(
    `/admin/files?${serializeMemberFilesTableQuery(state)}`,
    { cache: "no-store" },
  );
  const result = (await readPaginatedApiResponse(response)) as AdminMemberFilesResponse;
  return {
    data: result.data,
    total: result.meta.total,
    pageCount: result.meta.totalPages,
    summary: result.meta.summary ?? {
      activeFiles: 0,
      activeBytes: 0,
      trashedFiles: 0,
      trashedBytes: 0,
    },
  };
}
