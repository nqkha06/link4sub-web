"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export default function AdminUsersError({ reset }: { reset: () => void }) {
  const t = useTranslations("Admin.routes.users");
  const tCommon = useTranslations("Admin.common");

  return (
    <div className="flex min-h-80 flex-col items-center justify-center gap-3 p-6 text-center">
      <h2 className="font-semibold text-lg">{t("errorTitle")}</h2>
      <p className="text-muted-foreground text-sm">
        {t("errorDescription")}
      </p>
      <Button variant="outline" onClick={reset}>
        {tCommon("retry")}
      </Button>
    </div>
  );
}
