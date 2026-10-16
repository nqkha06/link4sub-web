import "server-only";

import { serializeAdminPagesQuery } from "@/features/admin-pages/api/pages-query-serializer";
import { adaptAdminPagesResponse } from "@/features/admin-pages/api/pages-response-adapter";
import type { AdminPagesTableQuery } from "@/features/admin-pages/query/pages-search-params";
import type {
  AdminPage,
  AdminPagesResponse,
} from "@/features/admin-pages/types";
import { serverApiFetch } from "@/lib/auth/server-api";
import { readApiData, readPaginatedApiResponse } from "@/lib/api-response";

export async function getAdminPagesTableData(state: AdminPagesTableQuery) {
  const response = await serverApiFetch(
    `/admin/pages?${serializeAdminPagesQuery(state)}`,
    { cache: "no-store" },
  );
  return adaptAdminPagesResponse(
    (await readPaginatedApiResponse(response)) as AdminPagesResponse,
  );
}

export async function getAdminPage(id: number) {
  const response = await serverApiFetch(
    `/admin/pages/${id}`,
    { cache: "no-store" },
  );
  if (response.status === 404) return null;
  return readApiData<AdminPage>(response);
}
