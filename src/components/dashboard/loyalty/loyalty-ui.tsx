import Image from "next/image";
import { Gem, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";

import type { TierStatus } from "@/features/loyalty/types";
import { cn } from "@/lib/utils";

export const loyaltyCardClass = [
  "gap-0 rounded-xl border border-border bg-card py-0 shadow-none",
  "transition-[background-color,border-color] duration-200",
  "hover:border-foreground/20 hover:shadow-none",
].join(" ");

export const sectionLabelClass =
  "text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground";

export function StatusBadge({
  status,
}: {
  status: Exclude<TierStatus, "locked">;
}) {
  const t = useTranslations("SimplePages.loyalty");
  const label = status === "current" ? t("currentBadge") : t("nextBadge");

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
        status === "current"
          ? "border-primary/25 bg-primary/10 text-primary"
          : "border-border bg-muted/30 text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}

export function LoyaltyTierIcon({
  iconKey,
  className,
}: {
  iconKey: string | null;
  className?: string;
}) {
  if (iconKey === "gem") {
    return <Gem className={className} aria-hidden="true" />;
  }
  if (iconKey === "shield-check") {
    return <ShieldCheck className={className} aria-hidden="true" />;
  }
  if (iconKey === "trophy") {
    return <Trophy className={className} aria-hidden="true" />;
  }
  return <Sparkles className={className} aria-hidden="true" />;
}

/**
 * Temporary hardcoded tier artwork, matched by tier position.
 * Admin icon settings stay unchanged.
 */
const tierVisuals = [
  {
    image: "/assets/images/loyalty/trophy-starter-green.webp",
    tile: "border-emerald-200/70 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30",
  },
  {
    image: "/assets/images/loyalty/trophy-bronze.webp",
    tile: "border-orange-200/70 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-950/30",
  },
  {
    image: "/assets/images/loyalty/trophy-gold.webp",
    tile: "border-amber-200/70 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30",
  },
  {
    image: "/assets/images/loyalty/trophy-diamond.webp",
    tile: "border-violet-200/70 bg-violet-50 dark:border-violet-900/50 dark:bg-violet-950/30",
  },
] as const;

const trophySizes = {
  sm: { box: "size-11 rounded-xl", px: 44 },
  md: { box: "size-16 rounded-2xl", px: 64 },
  lg: { box: "size-20 rounded-2xl", px: 80 },
} as const;

/** 3D trophy shown as a compact tier emblem inside a soft tier-colored tile. */
export function TierTrophy({
  tierIndex,
  size = "md",
  className,
}: {
  tierIndex: number;
  size?: keyof typeof trophySizes;
  className?: string;
}) {
  const visual =
    tierVisuals[Math.max(tierIndex, 0)] ??
    tierVisuals[tierVisuals.length - 1];
  const dimension = trophySizes[size];

  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center border",
        dimension.box,
        visual.tile,
        className,
      )}
    >
      <Image
        src={visual.image}
        alt=""
        width={dimension.px * 2}
        height={dimension.px * 2}
        sizes={`${dimension.px}px`}
        className="size-[86%] object-contain drop-shadow-[0_4px_6px_rgba(15,23,42,0.16)]"
      />
    </span>
  );
}
