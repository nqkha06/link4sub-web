import type { WithdrawalStatus } from "@/features/withdrawals/types";

export const withdrawalStatusOptions: Array<{
  value: WithdrawalStatus;
  labelKey: string;
  dotClassName: string;
  badgeClassName: string;
}> = [
  {
    value: "pending",
    labelKey: "status.pending",
    dotClassName: "bg-amber-500",
    badgeClassName:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  {
    value: "processing",
    labelKey: "status.processing",
    dotClassName: "bg-blue-500",
    badgeClassName:
      "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  {
    value: "paid",
    labelKey: "status.paid",
    dotClassName: "bg-emerald-500",
    badgeClassName:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  {
    value: "rejected",
    labelKey: "status.rejected",
    dotClassName: "bg-destructive",
    badgeClassName:
      "border-destructive/20 bg-destructive/10 text-destructive",
  },
  {
    value: "cancelled",
    labelKey: "status.cancelled",
    dotClassName: "bg-muted-foreground",
    badgeClassName: "border-border bg-muted text-muted-foreground",
  },
];

export function getWithdrawalStatusOption(status: WithdrawalStatus) {
  return (
    withdrawalStatusOptions.find((option) => option.value === status) ??
    withdrawalStatusOptions[0]
  );
}

export function getAllowedWithdrawalStatuses(
  status: WithdrawalStatus,
): WithdrawalStatus[] {
  if (status === "pending") {
    return ["pending", "processing", "rejected"] satisfies WithdrawalStatus[];
  }
  if (status === "processing") {
    return ["processing", "paid", "rejected"] satisfies WithdrawalStatus[];
  }
  return [status];
}

export function formatWithdrawalMoney(
  value: string,
  currency = "USD",
  locale = "vi",
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(Number(value));
}

export function formatWithdrawalDate(value: string | null, locale = "vi") {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
