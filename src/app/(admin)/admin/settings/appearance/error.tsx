"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export default function AppearanceSettingsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Admin.routes.settings");
  const tCommon = useTranslations("Admin.common");

  return (
    <main className="px-4 py-8 lg:px-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <h1 className="font-semibold">{t("appearance.errorTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("errorDescription")}
          </p>
          <Button className="mt-4" onClick={reset}>{tCommon("retry")}</Button>
        </div>
      </main>
  );
}
