"use client";

import { CheckCircle2, Clock3 } from "lucide-react";
import { useTranslations } from "next-intl";

import type {
  SupportCategory,
  SupportRequestStatus,
  SupportTicketPriority,
} from "@/components/dashboard/support/types";
import { Badge } from "@/components/ui/badge";

export const STATUS_VALUES: SupportRequestStatus[] = [
  "submitted",
  "in_progress",
  "waiting_user",
  "answered",
  "resolved",
  "closed",
];

export const PRIORITY_VALUES: SupportTicketPriority[] = [
  "low",
  "normal",
  "high",
  "urgent",
];

export const CATEGORY_VALUES: SupportCategory[] = [
  "usage",
  "technical",
  "social_links",
  "files",
  "link_in_bio",
  "monetization",
  "withdrawal",
  "rewards",
  "account",
  "abuse",
  "other",
];

export function StatusBadge({ status }: { status: SupportRequestStatus }) {
  const t = useTranslations("Admin.support");
  const label = STATUS_VALUES.includes(status) ? t(`status.${status}`) : status;
  const terminal = status === "resolved" || status === "closed";
  return (
    <Badge
      variant={terminal ? "secondary" : "outline"}
      className={status === "waiting_user" ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" : ""}
    >
      {terminal ? <CheckCircle2 /> : <Clock3 />}{label}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: SupportTicketPriority }) {
  const t = useTranslations("Admin.support");
  const label = PRIORITY_VALUES.includes(priority) ? t(`priority.${priority}`) : priority;
  return (
    <Badge
      variant="outline"
      className={priority === "urgent"
        ? "border-destructive/30 bg-destructive/10 text-destructive"
        : priority === "high"
          ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
          : ""}
    >
      {label}
    </Badge>
  );
}

export function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
