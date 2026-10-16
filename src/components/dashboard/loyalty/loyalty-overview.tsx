import {
  ArrowRight,
  Clock3,
  Crown,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import {
  loyaltyCardClass,
  LoyaltyTierIcon,
  StatusBadge,
  TierTrophy,
} from "@/components/dashboard/loyalty/loyalty-ui";
import { SoftCard } from "@/components/dashboard/ui";
import type { MemberLoyaltyData } from "@/features/loyalty/types";
import { cn } from "@/lib/utils";

export function LoyaltyOverview({
  data,
}: {
  data: MemberLoyaltyData;
}) {
  const t = useTranslations("SimplePages.loyalty");
  const locale = useLocale();
  const number = new Intl.NumberFormat(locale);

  const { summary } = data;

  const currentTier =
    data.tiers.find((tier) => tier.isCurrent) ?? null;

  const currentTierIndex = data.tiers.findIndex(
    (tier) => tier.isCurrent,
  );

  const nextTierIndex = summary.nextTier
    ? data.tiers.findIndex(
        (tier) => tier.name === summary.nextTier?.name,
      )
    : -1;

  const progress = Math.min(
    Math.max(summary.progress, 0),
    100,
  );

  const hasNextTier =
    summary.nextTier !== null &&
    summary.nextTierTarget !== null;

  return (
    <SoftCard
      className={cn(
        loyaltyCardClass,
        "overflow-hidden p-0",
      )}
    >
      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          {/* Current tier */}
          <div className="flex min-w-0 items-center gap-4">
            {currentTierIndex >= 0 ? (
              <TierTrophy tierIndex={currentTierIndex} size="lg" />
            ) : (
              <div className="grid size-20 shrink-0 place-items-center rounded-2xl border bg-muted/40 text-muted-foreground">
                <LoyaltyTierIcon iconKey={null} className="size-7" />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {t("currentTier")}
                </span>

                {currentTier ? (
                  <StatusBadge status="current" />
                ) : null}
              </div>

              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                {summary.currentTier?.name ?? t("unranked")}
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {number.format(summary.currentValue)} lượt xem
              </p>
            </div>
          </div>

          {/* Next tier */}
          {summary.nextTier ? (
            <div className="flex items-center gap-3">
              {nextTierIndex >= 0 ? (
                <TierTrophy tierIndex={nextTierIndex} size="sm" />
              ) : null}

              <div>
                <p className="text-xs text-muted-foreground">
                  {t("nextMilestone")}
                </p>

                <div className="mt-0.5 flex items-center gap-1.5">
                  <p className="font-semibold">
                    {summary.nextTier.name}
                  </p>

                  <ArrowRight className="size-3.5 text-muted-foreground" />
                </div>

                {summary.nextTierTarget !== null ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {number.format(summary.nextTierTarget)} lượt xem
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-400">
                <Crown className="size-5" />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  {t("highestTier")}
                </p>

                <p className="mt-0.5 font-semibold">
                  {summary.currentTier?.name ?? t("unranked")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="mt-6 border-t pt-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium">
                {summary.nextTier
                  ? t("progressTo", {
                      name: summary.nextTier.name,
                    })
                  : t("tierProgress")}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {hasNextTier
                  ? t("remainingViews", {
                      count: number.format(summary.remaining),
                    })
                  : t("highestTierDescription")}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xl font-semibold tabular-nums">
                {progress}%
              </p>

              {summary.nextTierTarget !== null ? (
                <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                  {number.format(summary.currentValue)}
                  {" / "}
                  {number.format(summary.nextTierTarget)}
                </p>
              ) : null}
            </div>
          </div>

          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label={t("progressLabel")}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>
      </div>
    </SoftCard>
  );
}