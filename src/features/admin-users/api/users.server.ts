import "server-only";

import { adaptUsersResponse } from "@/features/admin-users/api/users-response-adapter";
import { serializeUsersTableQuery } from "@/features/admin-users/api/users-query-serializer";
import type { UsersTableQuery } from "@/features/admin-users/query/users-search-params";
import type {
  AdminUserDetail,
  UsersResponse,
  UsersAccessOptions,
} from "@/features/admin-users/types";
import { serverApiFetch } from "@/lib/auth/server-api";
import { readApiData, readPaginatedApiResponse } from "@/lib/api-response";

export async function getUsersTableData(state: UsersTableQuery) {
  const response = await serverApiFetch(
    `/admin/users?${serializeUsersTableQuery(state)}`,
    {
      cache: "no-store",
    },
  );

  return adaptUsersResponse(
    (await readPaginatedApiResponse(response)) as UsersResponse,
  );
}

export async function getUsersAccessOptions() {
  const response = await serverApiFetch(
    "/admin/users/access-options",
    { cache: "no-store" },
  );
  return readApiData<UsersAccessOptions>(response);
}

export async function getAdminUser(id: number) {
  const response = await serverApiFetch(
    `/admin/users/${id}`,
    { cache: "no-store" },
  );
  if (response.status === 404) return null;
  return readApiData<AdminUserDetail>(response);
}
