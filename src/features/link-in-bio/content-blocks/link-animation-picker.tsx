"use client";

import { Check, ChevronDown, Settings2, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import type { LinkAnimationEffect } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  getLinkAnimationClassName,
  getLinkAnimationPreviewClassName,
  linkAnimationPresets,
  normalizeLinkAnimationEffect,
} from "./link-animation";

function AnimationOptions({
  selectedEffect,
  onSelect,
}: {
  selectedEffect: LinkAnimationEffect;
  onSelect: (effect: LinkAnimationEffect) => void;
}) {
  const t = useTranslations("BioLinkEffects");
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
    <div role="group" aria-label={t("title")} className="grid grid-cols-3 gap-2">
      {linkAnimationPresets.map(({ effect, group }) => {
        const selected = effect === selectedEffect;
        const aura = group === "aura";
        return (
          <button
            key={effect}
            type="button"
            aria-pressed={selected}
            aria-label={t(`items.${effect}`)}
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
              <span className="text-xs font-medium text-foreground">{t(`items.${effect}`)}</span>
              {selected ? <Check className="size-3.5 shrink-0 text-primary" aria-hidden /> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function LinkEffectPicker({
  value,
  disabled,
  onChange,
}: {
  value: LinkAnimationEffect;
  disabled?: boolean;
  onChange: (effect: LinkAnimationEffect) => void;
}) {
  const t = useTranslations("BioLinkEffects");
  const id = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-xs font-medium text-foreground">{t("field")}</label>
      <ResponsiveDialog open={open} onOpenChange={(next) => {
        if (next) setDraft(value);
        setOpen(next);
      }}>
        <ResponsiveDialogTrigger asChild>
          <button
            id={id}
            type="button"
            disabled={disabled}
            aria-describedby={`${id}-hint`}
            className="flex min-h-11 w-full items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2 text-left text-sm text-foreground outline-none transition-colors hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60"
          >
            <Sparkles className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="flex-1">{t(`items.${value}`)}</span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </button>
        </ResponsiveDialogTrigger>
        <ResponsiveDialogContent className="sm:max-w-lg">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{t("title")}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>{t("description")}</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/30 px-8 py-5">
              <p className="mb-4 text-center text-xs text-muted-foreground">{t("preview")}</p>
              <div
                key={draft}
                className={cn("mx-auto flex min-h-11 max-w-64 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground", getLinkAnimationPreviewClassName(draft))}
              >
                <Sparkles className="size-4 shrink-0" aria-hidden />
                <span>{t("previewLink")}</span>
              </div>
            </div>
            <AnimationOptions selectedEffect={draft} onSelect={setDraft} />
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <Button type="button" variant="outline" className="min-h-11" onClick={() => setOpen(false)}>{t("cancel")}</Button>
            <Button type="button" disabled={disabled} className="min-h-11" onClick={() => {
              onChange(draft);
              setOpen(false);
            }}>{t("apply")}</Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
      <p id={`${id}-hint`} className="text-[11px] text-muted-foreground">{t("hint")}</p>
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
  const t = useTranslations("BioLinkEffects");
  const selectedEffect = normalizeLinkAnimationEffect(effect);

  return (
    <details className="group rounded-lg border border-border bg-background">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium text-foreground outline-none transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <Settings2 className="size-4 text-muted-foreground" aria-hidden />
        <span className="flex-1">{t("advanced")}</span>
        {selectedEffect !== "none" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            <Sparkles className="size-3" aria-hidden />
            {t(`items.${selectedEffect}`)}
          </span>
        ) : null}
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <fieldset disabled={disabled} className="border-t border-border disabled:opacity-60">
        {iconSlot ? (
          <div className="border-b border-border px-3 py-3 sm:px-4">
            <p className="mb-2 text-xs font-medium text-foreground">{t("icon")}</p>
            {iconSlot}
          </div>
        ) : null}
        <div className="p-3 sm:px-4">
          <LinkEffectPicker value={selectedEffect} disabled={disabled} onChange={onChange} />
        </div>
      </fieldset>
    </details>
  );
}
