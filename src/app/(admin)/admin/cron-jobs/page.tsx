import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getCronJobsOverview } from "@/features/cron-jobs/api/cron-jobs.server";
import { CronJobsDashboard } from "@/features/cron-jobs/components/cron-jobs-dashboard";
import { getApiErrorMessage } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/server-access";

export const metadata: Metadata = { title: "Cron jobs" };

export default async function CronJobsPage() {
  const t = await getTranslations("Admin.routes.cronJobs");
  const { currentUser } = await requireAdmin();
  if (!currentUser.permissions.includes("cron_jobs.view")) {
    redirect("/admin");
  }

  let overview: Awaited<ReturnType<typeof getCronJobsOverview>> | null = null;
  let loadError: string | null = null;
  try {
    overview = await getCronJobsOverview();
  } catch (error) {
    // API không bật queue (QUEUE_ENABLED=false) thì endpoint không tồn tại.
    loadError = getApiErrorMessage(error);
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <AdminPageHeader title={t("title")} description={t("description")} />
      {overview ? (
        <CronJobsDashboard
          initialOverview={overview}
          canManage={currentUser.permissions.includes("cron_jobs.manage")}
        />
      ) : (
        <Alert variant="destructive">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}
    </main>
  );
}
