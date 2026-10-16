import type { ElementType } from "react";

import {
  BadgeCheck,
  Gamepad2,
  Gift,
  Link2,
  Mail,
  Music2,
  RefreshCw,
  Share2,
  TrendingUp,
  UserX,
} from "lucide-react";

/**
 * Structure for the /how-it-works page only (keys, icons, styling).
 * All visible copy lives in messages/{vi,en,id}.json under
 * `Landing.howItWorks.*`; each `key` below maps to an entry there.
 */

export type ProcessStep = {
  index: string;
  key: "create" | "share" | "grow";
  icon: ElementType;
};

export const processSteps: ProcessStep[] = [
  { index: "01", key: "create", icon: Link2 },
  { index: "02", key: "share", icon: Share2 },
  { index: "03", key: "grow", icon: TrendingUp },
];

export type Persona = {
  key: "youtuber" | "gamer" | "newsletter" | "musician";
  icon: ElementType;
  card: string;
  iconStyle: string;
  glow: string;
};

export const personas: Persona[] = [
  {
    key: "youtuber",
    icon: TrendingUp,
    card:
      "border-red-200/70 bg-gradient-to-br from-red-50/90 via-background to-background dark:border-red-900/50 dark:from-red-950/20",
    iconStyle:
      "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400",
    glow: "bg-red-400/15",
  },
  {
    key: "gamer",
    icon: Gamepad2,
    card:
      "border-indigo-200/70 bg-gradient-to-br from-indigo-50/90 via-background to-background dark:border-indigo-900/50 dark:from-indigo-950/20",
    iconStyle:
      "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400",
    glow: "bg-indigo-400/15",
  },
  {
    key: "newsletter",
    icon: Mail,
    card:
      "border-amber-200/70 bg-gradient-to-br from-amber-50/90 via-background to-background dark:border-amber-900/50 dark:from-amber-950/20",
    iconStyle:
      "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    glow: "bg-amber-400/15",
  },
  {
    key: "musician",
    icon: Music2,
    card:
      "border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 via-background to-background dark:border-emerald-900/50 dark:from-emerald-950/20",
    iconStyle:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    glow: "bg-emerald-400/15",
  },
];

export type Differentiator = {
  key: "noAccount" | "analytics" | "free" | "updated";
  icon: ElementType;
};

export const differentiators: Differentiator[] = [
  { key: "noAccount", icon: UserX },
  { key: "analytics", icon: BadgeCheck },
  { key: "free", icon: Gift },
  { key: "updated", icon: RefreshCw },
];

export const howItWorksFaqKeys = [
  "noAccount",
  "verify",
  "content",
  "spam",
  "platformChange",
  "dropoff",
] as const;
