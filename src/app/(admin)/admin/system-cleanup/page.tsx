import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getSystemCleanupOverview } from "@/features/system-cleanup/api/system-cleanup.server";
import { SystemCleanupDashboard } from "@/features/system-cleanup/components/system-cleanup-dashboard";
import { requireAdmin } from "@/lib/auth/server-access";

export const metadata: Metadata = { title: "Dọn dẹp hệ thống" };

export default async function SystemCleanupPage() {
  const t = await getTranslations("Admin.routes.systemCleanup");
  const { currentUser } = await requireAdmin();
  if (!currentUser.permissions.includes("system_logs.view")) {
    redirect("/admin");
  }
  const overview = await getSystemCleanupOverview();

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <AdminPageHeader title={t("title")} description={t("description")} />
      <SystemCleanupDashboard
        initialOverview={overview}
        canDelete={currentUser.permissions.includes("system_logs.delete")}
      />
    </main>
  );
}
