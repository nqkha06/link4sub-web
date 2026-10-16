"use client";

import { AlertCircle, RotateCcw } from "lucide-react";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export default function AdminPagesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Admin.routes.pages");
  const tCommon = useTranslations("Admin.common");

  return (
    <main className="grid flex-1 place-items-center p-6">
      <div className="max-w-md rounded-xl border bg-card p-6 text-center shadow-sm">
        <AlertCircle className="mx-auto size-8 text-destructive" />
        <h1 className="mt-4 text-lg font-semibold">
          {t("errorTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <Button className="mt-5" onClick={reset}>
          <RotateCcw /> {tCommon("retry")}
        </Button>
      </div>
    </main>
  );
}
