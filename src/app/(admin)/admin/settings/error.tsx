"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export default function AdminSettingsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Admin.routes.settings");
  const tCommon = useTranslations("Admin.common");

  return (
    <main className="flex min-w-0 flex-1 px-4 py-8 lg:px-6">
      <div className="mx-auto w-full max-w-[1240px] rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <h1 className="font-semibold">{t("errorTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("errorDescription")}
        </p>
        <Button className="mt-4" onClick={reset}>
          {tCommon("retry")}
        </Button>
      </div>
    </main>
  );
}
