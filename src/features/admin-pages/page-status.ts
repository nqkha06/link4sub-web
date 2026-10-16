import {
  Archive,
  CircleDashed,
  Send,
  type LucideIcon,
} from "lucide-react";

import type { PageStatus } from "@/features/admin-pages/types";

export const pageStatusConfig: Record<
  PageStatus,
  {
    labelKey: string;
    descriptionKey: string;
    badgeClassName: string;
    icon: LucideIcon;
  }
> = {
  DRAFT: {
    labelKey: "status.draft.label",
    descriptionKey: "status.draft.description",
    badgeClassName: "border-border bg-muted text-muted-foreground",
    icon: CircleDashed,
  },
  PUBLISHED: {
    labelKey: "status.published.label",
    descriptionKey: "status.published.description",
    badgeClassName:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
    icon: Send,
  },
  ARCHIVED: {
    labelKey: "status.archived.label",
    descriptionKey: "status.archived.description",
    badgeClassName:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
    icon: Archive,
  },
};

/**
 * Builds select options for status filters. `t` must be a translator scoped to
 * the `Admin.pages` namespace.
 */
export function getPageStatusOptions(t: (key: string) => string) {
  return (
    Object.entries(pageStatusConfig) as Array<
      [PageStatus, (typeof pageStatusConfig)[PageStatus]]
    >
  ).map(([value, config]) => ({
    value,
    label: t(config.labelKey),
    icon: config.icon,
  }));
}
