"use client";

import { EyeOff, Globe, Link2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card, CardContent } from "@/components/ui/card";
import type { AdminBioPagesSummary as Summary } from "@/features/admin-bio-pages/types";

export function AdminBioPagesSummary({ summary }: { summary: Summary }) {
  const t = useTranslations("Admin.bioPages");
  const items = [
    { key: "total", label: t("summary.total"), icon: Link2, value: summary.published + summary.draft },
    { key: "published", label: t("status.published"), icon: Globe, value: summary.published },
    { key: "draft", label: t("status.draft"), icon: EyeOff, value: summary.draft },
  ] as const;
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map(({ key, label, icon: Icon, value }) => (
        <Card className="gap-0 py-0 shadow-none" key={key}>
          <CardContent className="flex items-center gap-4 p-4">
            <span className="grid size-10 place-items-center rounded-lg bg-muted text-primary">
              <Icon className="size-5" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
