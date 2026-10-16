import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { IpReputationAdminPage } from "@/features/ip-reputation/components/ip-reputation-admin-page";
import { requireAdmin } from "@/lib/auth/server-access";

export const metadata: Metadata = { title: "Độ tin cậy IP" };

export default async function AdminIpReputationPage() {
  const t = await getTranslations("Admin.routes.ipReputation");
  const { currentUser } = await requireAdmin();
  if (!currentUser.permissions.includes("ip_reputation.view")) redirect("/admin");

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
      />
      <IpReputationAdminPage />
    </main>
  );
}
