import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getAdminRegistrationSettings } from "@/features/business-settings/api/business-settings.server";
import { RegistrationSettingsForm } from "@/features/business-settings/components/registration-settings-form";
import { requireAdmin } from "@/lib/auth/server-access";

export default async function AdminRegistrationSettingsPage() {
  const t = await getTranslations("Admin.routes.settings.registration");
  const { currentUser } = await requireAdmin();
  if (!currentUser.permissions?.includes("settings.read")) redirect("/admin");
  const settings = await getAdminRegistrationSettings();

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6">
        <AdminPageHeader title={t("title")} description={t("description")} />
        <RegistrationSettingsForm
          initialSettings={settings}
          canUpdate={Boolean(currentUser.permissions?.includes("settings.update"))}
        />
      </div>
    </main>
  );
}
