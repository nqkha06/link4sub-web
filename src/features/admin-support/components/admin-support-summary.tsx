"use client";

import { Clock3, MessageCircle, ShieldAlert, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";

import type { AdminSupportSummary as Summary } from "../types";

export function AdminSupportSummary({ summary }: { summary: Summary }) {
  const t = useTranslations("Admin.support");
  const metrics = [
    { label: t("summary.open"), value: summary.open, icon: MessageCircle },
    { label: t("status.waiting_user"), value: summary.waiting, icon: Clock3 },
    { label: t("priority.urgent"), value: summary.urgent, icon: ShieldAlert },
    { label: t("assignment.unassigned"), value: summary.unassigned, icon: UserRound },
  ];
  return (
    <div className="grid overflow-hidden rounded-xl border bg-card sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(({ label, value, icon: Icon }) => (
        <div key={label} className="flex items-center gap-3 border-b p-4 last:border-b-0 sm:border-r sm:[&:nth-child(2)]:border-r-0 xl:border-b-0 xl:[&:nth-child(2)]:border-r">
          <span className="grid size-9 place-items-center rounded-lg bg-muted/50 text-muted-foreground"><Icon className="size-4" /></span>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-0.5 text-xl font-semibold tabular-nums">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
