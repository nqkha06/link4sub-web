import type { Metadata } from "next";

import { getAuthorizationData } from "@/features/admin-authorization/api/authorization.server";
import { AuthorizationManager } from "@/features/admin-authorization/components/authorization-manager";

export const metadata: Metadata = { title: "Vai trò và quyền hạn" };

export default async function AdminRolesPage() {
  const data = await getAuthorizationData();

  return (
    <main className="flex flex-1 flex-col px-4 py-4 lg:px-6 lg:py-6">
      <AuthorizationManager {...data} />
    </main>
  );
}
