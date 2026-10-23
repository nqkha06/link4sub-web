"use client"

import type React from "react"
import { useState } from "react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog"
import type { BioDesignFontFamily, BioUsernameEffect as BioUsernameEffectType } from "@/contracts"
import { BioPublicFonts, getBioFontStack } from "@/features/link-in-bio/public/bio-public-fonts"
import { BioUsernameEffect } from "@/features/link-in-bio/public/username/bio-username-effect"
import { cn } from "@/lib/utils"

import styles from "./username-effect-picker.module.css"

/** Thứ tự hiển thị trong bộ chọn ("pulse" vẫn được hỗ trợ cho dữ liệu cũ). */
export const USERNAME_EFFECT_OPTIONS: BioUsernameEffectType[] = [
  "none", "typewriter", "rainbow", "shine", "glitch", "shimmer",
  "neon", "wave", "scramble", "scramble-2", "lightning", "glitch-2",
  "stars", "distort", "fuzzy",
  "sparkles-black", "sparkles-blue", "sparkles-green", "sparkles-pink",
  "sparkles-red", "sparkles-white", "sparkles-yellow",
]

function NoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" d="m18.5 5.5l-13 13" />
        <circle cx="12" cy="12" r="10" />
      </g>
    </svg>
  )
}

/**
 * Bộ chọn hiệu ứng tên: lưới ô chạy thử trực tiếp, khung xem trước với tên
 * thật trên nền thẻ của trang, và mô tả hiệu ứng. Chỉ áp dụng khi bấm "Lưu".
 */
export function UsernameEffectPicker({
  value,
  name,
  fontFamily,
  previewStyle,
  onChange,
}: {
  value: BioUsernameEffectType
  name: string
  fontFamily: BioDesignFontFamily
  /** Nền/chữ của thẻ hồ sơ để khung xem trước giống trang thật. */
  previewStyle?: React.CSSProperties
  onChange: (value: BioUsernameEffectType) => void
}) {
  const t = useTranslations("BioStudio.nameEffects")
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)
  const previewName = name.trim() || t("previewName")
  const font = getBioFontStack(fontFamily)

  const openChange = (next: boolean) => {
    if (next) setDraft(value)
    setOpen(next)
  }

  const tileLabel = (effect: BioUsernameEffectType) =>
    effect.startsWith("sparkles-") ? t("sparklesLabel") : t(`items.${effect}.label`)

  return (
    <ResponsiveDialog open={open} onOpenChange={openChange}>
      <ResponsiveDialogTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg border border-border bg-background p-2 text-left transition hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className={styles.triggerPreview} style={{ fontFamily: font }}>
            <BioUsernameEffect text={previewName} effect={value} />
          </span>
          <span className="shrink-0 pr-1 text-right">
            <span className="block text-sm font-medium text-foreground">{t(`items.${value}.label`)}</span>
            <span className="block text-xs text-muted-foreground">{t("change")}</span>
          </span>
        </button>
      </ResponsiveDialogTrigger>

      <ResponsiveDialogContent aria-describedby={undefined}>
        {open ? <BioPublicFonts families={[fontFamily]} /> : null}
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t("title")}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody>
          <div className="flex flex-col-reverse gap-5 md:flex-row md:items-start">
            <div role="radiogroup" aria-label={t("title")} className={styles.grid} style={{ fontFamily: font }}>
              {USERNAME_EFFECT_OPTIONS.map((effect) => {
                const selected = draft === effect
                return (
                  <button
                    key={effect}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={t(`items.${effect}.label`)}
                    title={t(`items.${effect}.label`)}
                    onClick={() => setDraft(effect)}
                    onDoubleClick={() => { onChange(effect); setOpen(false) }}
                    className={cn(
                      styles.tile,
                      "border-border hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected && "border-primary ring-2 ring-primary/30 hover:border-primary",
                    )}
                  >
                    {effect === "none" ? (
                      <span className={styles.noneTile}>
                        <NoneIcon />
                        <span>{t("noneTile")}</span>
                      </span>
                    ) : (
                      <BioUsernameEffect text={tileLabel(effect)} effect={effect} />
                    )}
                  </button>
                )
              })}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className={cn(styles.preview, "border border-border")} style={{ color: previewStyle?.color ?? "#ffffff", fontFamily: font }}>
                {/* Lớp thẻ của trang (màu/độ trong) phủ trên nền tối, giống trang bio. */}
                <span
                  aria-hidden
                  className={styles.previewCard}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    backgroundImage: "linear-gradient(25deg, rgba(255, 255, 255, 0.03), rgba(99, 99, 99, 0.03))",
                    ...previewStyle,
                  }}
                />
                <BioUsernameEffect key={draft} as="h3" text={previewName} effect={draft} className="relative" style={{ fontWeight: previewStyle?.fontWeight }} />
              </div>
              <div className="rounded-lg bg-muted/60 p-3">
                <h3 className="text-sm font-semibold text-foreground">{t(`items.${draft}.label`)}</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{t(`items.${draft}.description`)}</p>
              </div>
            </div>
          </div>
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
          <Button type="button" onClick={() => { onChange(draft); setOpen(false) }}>{t("save")}</Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
