"use client";

import { CheckCircle2, CircleDashed, Clock3, Flag, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { linkReportReasons } from "@/features/admin-link-reports/query/link-reports-search-params";
import type {
  LinkReportReason,
  LinkReportStatus,
} from "@/features/admin-link-reports/types";

export const linkReportStatusIcons = {
  pending: Clock3,
  reviewing: CircleDashed,
  resolved: CheckCircle2,
  dismissed: XCircle,
} as const;

const statusClassNames: Record<LinkReportStatus, string> = {
  pending: "",
  reviewing: "border-primary/30 bg-primary/10 text-primary",
  resolved: "border-primary/30 bg-primary/10 text-primary",
  dismissed: "bg-muted text-muted-foreground",
};

export function LinkReportStatusBadge({ status }: { status: LinkReportStatus }) {
  const t = useTranslations("Admin.linkReports");
  const Icon = linkReportStatusIcons[status];
  return (
    <Badge className={statusClassNames[status]} variant="outline">
      <Icon /> {t(`status.${status}`)}
    </Badge>
  );
}

export function LinkReportReasonBadge({ reason }: { reason: LinkReportReason }) {
  const t = useTranslations("Admin.linkReports");
  return (
    <Badge variant="secondary">
      <Flag /> {linkReportReasons.includes(reason) ? t(`reason.${reason}`) : reason}
    </Badge>
  );
}

export function formatLinkReportDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
