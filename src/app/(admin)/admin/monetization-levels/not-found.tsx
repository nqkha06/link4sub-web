import Link from "next/link";

import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

export default async function MonetizationLevelNotFound() {
  const t = await getTranslations("Admin.routes.monetizationLevels.notFound");
  const tErrors = await getTranslations("Admin.errors");

  return (
    <main className="grid min-w-0 flex-1 place-items-center p-6">
        <div className="max-w-md rounded-xl border bg-card p-6 text-center shadow-sm">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {t("badge")}
          </p>
          <h1 className="mt-3 text-xl font-semibold tracking-[-0.03em]">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t("description")}
          </p>
          <Button asChild className="mt-5">
            <Link href="/admin/monetization-levels">{tErrors("backToList")}</Link>
          </Button>
        </div>
      </main>
  );
}
