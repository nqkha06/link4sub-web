"use client";

import { Crown, HardDrive, Info } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { formatBytes } from "./file-utils";

export function StorageUsage({ used, reserved, limit, boosted = false }: { used: number; reserved: number; limit: number; boosted?: boolean }) {
  const t = useTranslations("Files.storage");
  const locale = useLocale();
  const percent = limit > 0 ? Math.min(((used + reserved) / limit) * 100, 100) : 0;

  return (
    <TooltipProvider>
      <section className="grid gap-4 rounded-xl border border-border bg-card px-4 py-4 sm:grid-cols-[1fr_minmax(260px,380px)] sm:items-center sm:px-5" aria-label={t("label")}>
        <div className="flex items-start gap-3">
          <HardDrive className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div>
            <div className="flex flex-wrap items-center gap-1.5 text-sm text-foreground">
              <span className="font-medium">{t("used", { used: formatBytes(used), limit: formatBytes(limit) })}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="rounded-sm text-muted-foreground hover:text-foreground" aria-label={t("infoLabel")}><Info className="size-3.5" /></button>
                </TooltipTrigger>
                <TooltipContent className="max-w-64">{t("info", { reserved: formatBytes(reserved) })}</TooltipContent>
              </Tooltip>
              {boosted ? (
                <span className="ml-1 inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-300/70 bg-gradient-to-r from-amber-50 to-yellow-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:border-amber-500/30 dark:from-amber-500/10 dark:to-yellow-500/10 dark:text-amber-300">
                  <Crown className="size-3" aria-hidden="true" />
                  {t("tierBadge")}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t("percent", { percent: percent.toLocaleString(locale, { maximumFractionDigits: 2 }) })}</p>
          </div>
        </div>
        <Progress value={percent} className="h-1.5 bg-muted" aria-label={t("percent", { percent: percent.toFixed(2) })} aria-valuenow={Math.round(percent)} />
      </section>
    </TooltipProvider>
  );
}
