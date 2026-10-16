import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getAdminLinkSettings } from "@/features/link-settings/api/link-settings.server";
import { LinkSettingsForm } from "@/features/link-settings/components/link-settings-form";
import { requireAdmin } from "@/lib/auth/server-access";

export default async function AdminLinkSettingsPage() {
  const t = await getTranslations("Admin.routes.settings.links");
  const { currentUser } = await requireAdmin();
  if (!currentUser.permissions?.includes("settings.read")) redirect("/admin");
  const settings = await getAdminLinkSettings();

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-6">
        <AdminPageHeader title={t("title")} description={t("description")} />
        <LinkSettingsForm
          initialSettings={settings}
          canUpdate={Boolean(currentUser.permissions?.includes("settings.update"))}
        />
      </div>
    </main>
  );
}
