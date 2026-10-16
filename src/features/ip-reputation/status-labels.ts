import type { ReputationStatus, RiskLevel, TemporalMatch } from "./types";

export const reputationStatusOptions: Record<
  ReputationStatus,
  { labelKey: string; dotClassName: string; badgeClassName: string }
> = {
  active: {
    labelKey: "status.active",
    dotClassName: "bg-destructive",
    badgeClassName: "border-destructive/20 bg-destructive/10 text-destructive",
  },
  expired: {
    labelKey: "status.expired",
    dotClassName: "bg-muted-foreground",
    badgeClassName: "border-border bg-muted text-muted-foreground",
  },
  none: {
    labelKey: "status.none",
    dotClassName: "bg-muted-foreground",
    badgeClassName: "border-border bg-muted text-muted-foreground",
  },
};

export const temporalMatchOptions: Record<
  TemporalMatch,
  { labelKey: string; dotClassName: string; badgeClassName: string }
> = {
  MATCH: {
    labelKey: "temporal.match",
    dotClassName: "bg-destructive",
    badgeClassName: "border-destructive/20 bg-destructive/10 text-destructive",
  },
  EXPIRED: {
    labelKey: "temporal.expired",
    dotClassName: "bg-amber-500",
    badgeClassName:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  NO_MATCH: {
    labelKey: "temporal.noMatch",
    dotClassName: "bg-emerald-500",
    badgeClassName:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
};

export const riskLevelOptions: Record<
  RiskLevel,
  { labelKey: string; dotClassName: string; badgeClassName: string }
> = {
  HIGH_RISK: {
    labelKey: "risk.highRisk",
    dotClassName: "bg-destructive",
    badgeClassName: "border-destructive/20 bg-destructive/10 text-destructive",
  },
  REVIEW: {
    labelKey: "risk.review",
    dotClassName: "bg-amber-500",
    badgeClassName:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  PASS: {
    labelKey: "risk.pass",
    dotClassName: "bg-emerald-500",
    badgeClassName:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
};

/** `labelKey` is relative to the Admin.ipReputation namespace. */
export function formatIpReputationDate(value: string | null, locale: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
