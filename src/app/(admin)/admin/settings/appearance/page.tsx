import { redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getTranslations } from "next-intl/server";
import { getAdminAppearanceSettings } from "@/features/site-settings/api/appearance.server";
import { AppearanceSettingsForm } from "@/features/site-settings/components/appearance-settings-form";
import { requireAdmin } from "@/lib/auth/server-access";

export default async function AdminAppearanceSettingsPage() {
  const t = await getTranslations("Admin.routes.settings.appearance");
  const { currentUser } = await requireAdmin();
  if (!currentUser.permissions?.includes("settings.read")) redirect("/admin");
  const settings = await getAdminAppearanceSettings();

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
      />
      <AppearanceSettingsForm
        initialSettings={settings}
        canUpdate={Boolean(currentUser.permissions?.includes("settings.update"))}
      />
    </main>
  );
}
