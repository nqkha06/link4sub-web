import { redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getTranslations } from "next-intl/server";
import { getAdminCurrencies } from "@/features/currencies/api/currencies.server";
import { CurrencySettingsManager } from "@/features/currencies/components/currency-settings-manager";
import { requireAdmin } from "@/lib/auth/server-access";

export default async function AdminCurrenciesPage() {
  const t = await getTranslations("Admin.routes.settings.currencies");
  const { currentUser } = await requireAdmin();
  if (!currentUser.permissions?.includes("currencies.read")) redirect("/admin");
  const currencies = await getAdminCurrencies();

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6">
        <AdminPageHeader
          title={t("title")}
          description={t("description", {
            baseCurrency: currencies.meta.baseCurrency,
          })}
        />
        <CurrencySettingsManager
          initialData={currencies}
          permissions={currentUser.permissions ?? []}
        />
      </div>
    </main>
  );
}
