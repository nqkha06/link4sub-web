import { redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getTranslations } from "next-intl/server";
import { getAdminWithdrawalSettings } from "@/features/business-settings/api/business-settings.server";
import { WithdrawalSettingsForm } from "@/features/business-settings/components/withdrawal-settings-form";
import { requireAdmin } from "@/lib/auth/server-access";

export default async function AdminWithdrawalSettingsPage() {
  const t = await getTranslations("Admin.routes.settings.withdrawals");
  const { currentUser } = await requireAdmin();
  if (!currentUser.permissions?.includes("settings.read")) redirect("/admin");
  const settings = await getAdminWithdrawalSettings();

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6">
        <AdminPageHeader
          title={t("title")}
          description={t("description")}
        />
        <WithdrawalSettingsForm
          initialSettings={settings}
          canUpdate={Boolean(
            currentUser.permissions?.includes("settings.update"),
          )}
        />
      </div>
    </main>
  );
}
