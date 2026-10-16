"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export default function LogFilesError({ error, reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("Admin.routes.logFiles");
  const tCommon = useTranslations("Admin.common");

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-md rounded-xl border bg-card p-6 text-center">
        <h2 className="text-lg font-semibold">{t("errorTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <Button className="mt-4" onClick={reset}>{tCommon("retry")}</Button>
      </div>
    </main>
  );
}
