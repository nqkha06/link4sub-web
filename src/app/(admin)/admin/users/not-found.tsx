import Link from "next/link";

import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

export default async function AdminUserNotFound() {
  const t = await getTranslations("Admin.routes.users.notFound");
  const tErrors = await getTranslations("Admin.errors");

  return (
    <main className="grid min-h-80 flex-1 place-items-center p-6 text-center">
        <div>
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("description")}
          </p>
          <Button className="mt-5" asChild>
            <Link href="/admin/users">{tErrors("backToList")}</Link>
          </Button>
        </div>
      </main>
  );
}
