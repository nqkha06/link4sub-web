"use client";

import { EyeOff, Globe } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import type { BioPageStatus } from "@/features/admin-bio-pages/types";

export const STATUS_VALUES: BioPageStatus[] = ["published", "draft"];

export function StatusBadge({ status }: { status: BioPageStatus }) {
  const t = useTranslations("Admin.bioPages");
  const config = {
    published: { icon: Globe, className: "border-primary/30 bg-primary/10 text-primary" },
    draft: { icon: EyeOff, className: "bg-muted text-muted-foreground" },
  }[status];
  const Icon = config.icon;
  return (
    <Badge className={config.className} variant="outline">
      <Icon /> {t(`status.${status}`)}
    </Badge>
  );
}

export function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
