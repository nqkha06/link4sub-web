import "server-only";

import type {
  AdminPermission,
  AdminRole,
  AuthorizationData,
} from "@/features/admin-authorization/types";
import { serverApiFetch } from "@/lib/auth/server-api";
import { readApiData } from "@/lib/api-response";

export async function getAuthorizationData(): Promise<AuthorizationData> {
  const [rolesResponse, permissionsResponse] = await Promise.all([
    serverApiFetch("/admin/roles"),
    serverApiFetch("/admin/permissions"),
  ]);
  return {
    roles: await readApiData<AdminRole[]>(rolesResponse),
    permissions: await readApiData<AdminPermission[]>(permissionsResponse),
  };
}
