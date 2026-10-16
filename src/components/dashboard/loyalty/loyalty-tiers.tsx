import { Check, XCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import {
  loyaltyCardClass,
  StatusBadge,
  TierTrophy,
} from "@/components/dashboard/loyalty/loyalty-ui";
import { SoftCard } from "@/components/dashboard/ui";
import type {
  LoyaltyTier,
  TierStatus,
} from "@/features/loyalty/types";
import { cn } from "@/lib/utils";

export function LoyaltyTierGrid({
  tiers,
  windowDays,
}: {
  tiers: LoyaltyTier[];
  windowDays: number;
}) {
  return (
    <section aria-labelledby="loyalty-tiers-heading">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiers.map((tier, index) => (
          <TierCard
            key={tier.id}
            tier={tier}
            tierIndex={index}
            windowDays={windowDays}
          />
        ))}
      </div>
    </section>
  );
}

function TierCard({
  tier,
  tierIndex,
  windowDays,
}: {
  tier: LoyaltyTier;
  tierIndex: number;
  windowDays: number;
}) {
  const t = useTranslations("SimplePages.loyalty");
  const locale = useLocale();

  const number = new Intl.NumberFormat(locale);

  const status: TierStatus = tier.isCurrent
    ? "current"
    : tier.isNext
      ? "next"
      : "locked";


  const includedBenefits = tier.benefits.filter(
    (benefit) => benefit.included,
  );

  const unavailableBenefits = tier.benefits.filter(
    (benefit) => !benefit.included,
  );

  return (
    <SoftCard
      className={cn(
        loyaltyCardClass,
        "flex flex-col p-5",
        tier.isCurrent && "border-primary/60 ring-1 ring-primary/15",
      )}
    >
      {/* Tier emblem + status */}
      <div className="flex items-start justify-between gap-3">
        <TierTrophy tierIndex={tierIndex} size="md" />

        {status !== "locked" ? <StatusBadge status={status} /> : null}
      </div>

      {/* Tier info */}
      <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground">
        {tier.name}
      </h3>

      {tier.description ? (
        <p className="mt-1 min-h-10 text-sm leading-5 text-muted-foreground">
          {tier.description}
        </p>
      ) : null}

      {/* Requirement */}
      <div className="mt-4 rounded-lg border border-border/70 bg-muted/70 px-3 py-2.5">
        <p className="text-xs font-medium text-muted-foreground">
          {t("requirement")}
        </p>

        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5">
          <span className="text-base font-semibold tracking-tight text-foreground tabular-nums">
            {number.format(tier.minimumValidViews)}
          </span>

          <span className="text-xs text-muted-foreground">
            lượt xem / {windowDays} ngày
          </span>
        </div>
      </div>

      {/* Benefits */}
      <ul className="mt-4 space-y-2.5">
        {includedBenefits.map((benefit) => (
          <li
            key={benefit.key}
            className="flex items-start gap-2.5 text-sm"
          >
            <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Check
                className="size-3"
                strokeWidth={2.5}
                aria-hidden="true"
              />
            </span>

            <span className="leading-5 text-foreground/90">
              <span className="sr-only">
                {t("included")}:{" "}
              </span>

              {benefit.label}

              {benefit.value ? (
                <span className="font-medium text-foreground">
                  {" "}
                  · {benefit.value}
                </span>
              ) : null}
            </span>
          </li>
        ))}

        {unavailableBenefits.map((benefit) => (
          <li
            key={benefit.key}
            className="flex items-start gap-2.5 text-sm text-muted-foreground/55"
          >
            <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground/60">
              <XCircle
                className="size-3"
                strokeWidth={2.25}
                aria-hidden="true"
              />
            </span>

            <span className="leading-5">
              <span className="sr-only">
                {t("notIncluded")}:{" "}
              </span>

              {benefit.label}

              {benefit.value ? <> · {benefit.value}</> : null}
            </span>
          </li>
        ))}
      </ul>
    </SoftCard>
  );
}
