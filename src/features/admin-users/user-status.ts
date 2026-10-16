import { Ban, CircleCheck, Clock3, PauseCircle } from "lucide-react";

import type { UserStatus } from "@/features/admin-users/types";

export const userStatusConfig: Record<
  UserStatus,
  {
    labelKey: string;
    descriptionKey: string;
    icon: typeof CircleCheck;
    className: string;
  }
> = {
  pending: {
    labelKey: "status.pending.label",
    descriptionKey: "status.pending.description",
    icon: Clock3,
    className:
      "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  active: {
    labelKey: "status.active.label",
    descriptionKey: "status.active.description",
    icon: CircleCheck,
    className:
      "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  suspended: {
    labelKey: "status.suspended.label",
    descriptionKey: "status.suspended.description",
    icon: PauseCircle,
    className:
      "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  banned: {
    labelKey: "status.banned.label",
    descriptionKey: "status.banned.description",
    icon: Ban,
    className: "border-destructive/25 bg-destructive/10 text-destructive",
  },
};

export function getUserStatusOptions(t: (key: string) => string) {
  return Object.entries(userStatusConfig).map(([value, config]) => ({
    value,
    label: t(config.labelKey),
    icon: config.icon,
  }));
}
