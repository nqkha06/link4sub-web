import type React from "react";

import type { LinkAnimationEffect } from "@/lib/api-client";

export type LinkAnimationGroup = "motion" | "aura";

export const linkAnimationPresets: Array<{
  effect: LinkAnimationEffect;
  label: string;
  group: LinkAnimationGroup;
}> = [
  { effect: "none", label: "Không có", group: "motion" },
  { effect: "pulse", label: "Nhịp đập", group: "motion" },
  { effect: "shake", label: "Lắc nhẹ", group: "motion" },
  { effect: "bounce", label: "Nảy", group: "motion" },
  { effect: "glow", label: "Phát sáng", group: "motion" },
  { effect: "aura-gold", label: "Vàng", group: "aura" },
  { effect: "aura-rainbow", label: "Cầu vồng", group: "aura" },
  { effect: "aura-holo", label: "Hologram", group: "aura" },
  { effect: "aura-mono", label: "Đen", group: "aura" },
];

export const linkAnimationClassNames: Record<LinkAnimationEffect, string> = {
  none: "",
  pulse: "link-bio-animation link-bio-animation--pulse",
  shake: "link-bio-animation link-bio-animation--shake",
  bounce: "link-bio-animation link-bio-animation--bounce",
  glow: "link-bio-animation link-bio-animation--glow",
  "aura-gold": "link-bio-aura link-bio-aura--gold",
  "aura-rainbow": "link-bio-aura link-bio-aura--rainbow",
  "aura-holo": "link-bio-aura link-bio-aura--holo",
  "aura-mono": "link-bio-aura link-bio-aura--mono",
};

export function normalizeLinkAnimationEffect(effect?: string): LinkAnimationEffect {
  return linkAnimationPresets.some((preset) => preset.effect === effect)
    ? effect as LinkAnimationEffect
    : "none";
}

export function isAuraEffect(effect?: string) {
  return normalizeLinkAnimationEffect(effect).startsWith("aura-");
}

export function getLinkAnimationClassName(effect?: string) {
  return linkAnimationClassNames[normalizeLinkAnimationEffect(effect)];
}

export function getLinkAnimationPreviewClassName(effect?: string) {
  const className = getLinkAnimationClassName(effect);
  return className && !isAuraEffect(effect) ? `${className} link-bio-animation--live-preview` : className;
}

export function getLinkAnimationStyle(index: number, staggerMs = 180): React.CSSProperties {
  return {
    "--link-animation-delay": `${Math.max(0, index) * staggerMs}ms`,
  } as React.CSSProperties;
}
