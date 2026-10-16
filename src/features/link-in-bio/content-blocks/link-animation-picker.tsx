"use client";

import { Check, ChevronDown, Settings2, Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";

import type { LinkAnimationEffect } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  getLinkAnimationClassName,
  linkAnimationPresets,
  normalizeLinkAnimationEffect,
  type LinkAnimationGroup,
} from "./link-animation";

const groupLabels: Record<LinkAnimationGroup, string> = {
  motion: "Chuyển động",
  aura: "Aura",
};

function AnimationOptions({
  selectedEffect,
  onSelect,
}: {
  selectedEffect: LinkAnimationEffect;
  onSelect: (effect: LinkAnimationEffect) => void;
}) {
  const [preview, setPreview] = useState<{ effect: LinkAnimationEffect; revision: number }>({
    effect: selectedEffect,
    revision: 0,
  });

  function replay(effect: LinkAnimationEffect) {
    setPreview((current) => ({
      effect,
      revision: current.revision + 1,
    }));
  }

  return (
    <div className="space-y-3 p-3 sm:p-4">
      {(["motion", "aura"] as const).map((group) => (
        <div key={group}>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            {groupLabels[group]}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {linkAnimationPresets
              .filter((preset) => preset.group === group)
              .map(({ effect, label }) => {
                const selected = effect === selectedEffect;
                const aura = group === "aura";
                return (
                  <button
                    key={effect}
                    type="button"
                    aria-pressed={selected}
                    aria-label={`Dùng hiệu ứng ${label}`}
                    onClick={() => {
                      replay(effect);
                      onSelect(effect);
                    }}
                    onPointerEnter={() => replay(effect)}
                    onFocus={() => replay(effect)}
                    className={cn(
                      "link-animation-option relative min-h-20 rounded-lg border bg-background p-2.5 text-left outline-none transition-colors hover:bg-accent/45 focus-visible:ring-2 focus-visible:ring-ring",
                      selected ? "border-primary bg-primary/5" : "border-border",
                    )}
                  >
                    <span className="mb-2 flex h-7 items-center justify-center overflow-visible px-1">
                      <span
                        key={`${effect}:${preview.effect === effect ? preview.revision : 0}`}
                        aria-hidden
                        className={cn(
                          "link-animation-option-preview block w-full max-w-20",
                          aura
                            ? "h-5 rounded-md border border-border bg-background"
                            : "h-4 rounded-full border border-primary/25 bg-primary/15",
                          getLinkAnimationClassName(effect),
                          !aura && preview.effect === effect && effect !== "none" && "link-animation-option-preview--playing",
                        )}
                      />
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-medium text-foreground">{label}</span>
                      {selected ? <Check className="size-3.5 shrink-0 text-primary" aria-hidden /> : null}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function LinkAdvancedSettings({
  effect,
  disabled,
  onChange,
  iconSlot,
}: {
  effect?: LinkAnimationEffect;
  disabled?: boolean;
  onChange: (effect: LinkAnimationEffect) => void;
  /** Phần chọn icon của liên kết, hiển thị đầu tiên trong khu Nâng cao. */
  iconSlot?: ReactNode;
}) {
  const selectedEffect = normalizeLinkAnimationEffect(effect);
  const selectedLabel =
    linkAnimationPresets.find((preset) => preset.effect === selectedEffect)?.label ?? "Không";

  return (
    <details className="group rounded-lg border border-border bg-background">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium text-foreground outline-none transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <Settings2 className="size-4 text-muted-foreground" aria-hidden />
        <span className="flex-1">Nâng cao</span>
        {selectedEffect !== "none" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            <Sparkles className="size-3" aria-hidden />
            {selectedLabel}
          </span>
        ) : null}
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <fieldset disabled={disabled} className="border-t border-border disabled:opacity-60">
        {iconSlot ? (
          <div className="border-b border-border px-3 py-3 sm:px-4">
            <p className="mb-2 text-xs font-medium text-foreground">Icon</p>
            {iconSlot}
          </div>
        ) : null}
        <div className="px-3 pt-3 sm:px-4">
          <p className="text-xs font-medium text-foreground">Hiệu ứng</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Làm nổi bật liên kết.</p>
        </div>
        <AnimationOptions selectedEffect={selectedEffect} onSelect={onChange} />
      </fieldset>
    </details>
  );
}
