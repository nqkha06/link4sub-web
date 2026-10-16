import { redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getTranslations } from "next-intl/server";
import { getAdminLinkFraudSettings } from "@/features/link-fraud-settings/api/link-fraud-settings.server";
import { LinkFraudSettingsForm } from "@/features/link-fraud-settings/components/link-fraud-settings-form";
import { requireAdmin } from "@/lib/auth/server-access";

export default async function AdminLinkFraudSettingsPage() {
  const t = await getTranslations("Admin.routes.settings.linkFraud");
  const { currentUser } = await requireAdmin();
  if (!currentUser.permissions?.includes("settings.read")) redirect("/admin");
  const settings = await getAdminLinkFraudSettings();

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6">
        <AdminPageHeader
          title={t("title")}
          description={t("description")}
        />
        <LinkFraudSettingsForm
          initialSettings={settings}
          canUpdate={Boolean(currentUser.permissions?.includes("settings.update"))}
        />
      </div>
    </main>
  );
}
