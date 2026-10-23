"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { BioDesign } from "@/contracts"
import { BioBackgroundEffect, getBioEffectFragment } from "@/features/link-in-bio/public/effects/bio-background-effect"
import { renderShaderSnapshot } from "@/features/link-in-bio/public/effects/shader-canvas"
import { cn } from "@/lib/utils"

import styles from "./background-effect-picker.module.css"

type EffectSettings = BioDesign["effects"]["background"]
type EffectType = EffectSettings["type"]

/** Thứ tự trong bộ chọn: giống zyo.lol, sau đó là các hiệu ứng riêng (kiểu guns.lol). */
export const BACKGROUND_EFFECT_OPTIONS: EffectType[] = [
  "none", "rain", "wave", "star-drop", "noise", "blurred", "dots", "dither", "plasma",
  "chroma-waves", "luminous-flow", "aurora-silk", "velvet-waves", "nebula-drift", "soft-horizon",
  "liquid-flow", "spectrum-warp", "aurora-lines", "chromatic-pulse", "glitter-warp", "light-droplets",
  "lightspeed", "liquid-lines", "metallic-swirl", "topography", "gradient-waves",
  "snowflakes", "aurora", "night-time", "old-tv",
]

const SNAPSHOT_SIZE = 220

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
 * Một khung chạy thử hiệu ứng (dùng đúng component của trang bio công khai).
 * `live = false` với hiệu ứng WebGL: chỉ hiện một khung tĩnh (vẽ một lần rồi
 * trả context), vì trình duyệt giới hạn ~16 context WebGL cùng lúc.
 */
function EffectStage({ settings, className, live = true, delay = 0 }: { settings: EffectSettings; className?: string; live?: boolean; delay?: number }) {
  const fragment = getBioEffectFragment(settings.type)
  const color = /^#[0-9a-f]{6}/i.test(settings.color) ? settings.color : "#FFFFFF"
  return (
    <span className={cn(styles.stage, className)} aria-hidden>
      {settings.type === "none" ? (
        <span className={styles.noneIcon}><NoneIcon /></span>
      ) : fragment && !live ? (
        // eslint-disable-next-line @next/next/no-img-element -- ảnh data URL vẽ từ shader
        <img
          alt=""
          className={styles.still}
          style={{ opacity: settings.opacity / 100 }}
          ref={(element) => {
            if (!element || element.dataset.shader === settings.type) return
            element.dataset.shader = settings.type
            // Rải việc biên dịch shader ra theo thứ tự ô để mở hộp thoại không bị khựng.
            window.setTimeout(() => {
              const url = renderShaderSnapshot(fragment, { width: SNAPSHOT_SIZE, height: SNAPSHOT_SIZE, color, amplitude: settings.intensity / 100 })
              if (url) element.src = url
            }, delay)
          }}
        />
      ) : (
        <BioBackgroundEffect settings={settings} fallbackColor="#FFFFFF" />
      )}
    </span>
  )
}

/**
 * Bộ chọn hiệu ứng nền: lưới ô chạy thử trực tiếp từng hiệu ứng (với màu, độ
 * trong, cường độ hiện tại), khung xem trước lớn, tên và mô tả. Chỉ áp dụng
 * khi bấm "Lưu"; bấm đúp một ô để chọn nhanh.
 */
export function BackgroundEffectPicker({
  value,
  onChange,
}: {
  value: EffectSettings
  onChange: (type: EffectType) => void
}) {
  const t = useTranslations("BioStudio.backgroundEffectPicker")
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<EffectType>(value.type)
  const [hovered, setHovered] = useState<EffectType | null>(null)

  const openChange = (next: boolean) => {
    if (next) setDraft(value.type)
    setOpen(next)
  }
  const withType = (type: EffectType): EffectSettings => ({ ...value, type })

  return (
    <Dialog open={open} onOpenChange={openChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg border border-border bg-background p-2 text-left transition hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className={styles.triggerStage}>
            <EffectStage key={value.type} settings={value} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-foreground">{t(`items.${value.type}.label`)}</span>
            <span className="block text-xs text-muted-foreground">{t("change")}</span>
          </span>
        </button>
      </DialogTrigger>

      <DialogContent aria-describedby={undefined} className="max-h-[calc(100dvh-2rem)] gap-5 overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col-reverse gap-5 md:flex-row md:items-start">
          <div role="radiogroup" aria-label={t("title")} className={styles.grid}>
            {BACKGROUND_EFFECT_OPTIONS.map((type, index) => (
              <button
                key={type}
                type="button"
                role="radio"
                aria-checked={draft === type}
                aria-label={t(`items.${type}.label`)}
                onClick={() => setDraft(type)}
                onPointerEnter={() => setHovered(type)}
                onPointerLeave={() => setHovered((current) => (current === type ? null : current))}
                onDoubleClick={() => { onChange(type); setOpen(false) }}
                className={cn(
                  styles.tile,
                  "border-border hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  draft === type && "border-primary ring-2 ring-primary/30 hover:border-primary",
                )}
              >
                <EffectStage settings={withType(type)} live={hovered === type || draft === type} delay={index * 25} />
                <span className={styles.label}>{t(`items.${type}.label`)}</span>
              </button>
            ))}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <EffectStage key={draft} settings={withType(draft)} className={cn(styles.stageLarge, "border border-border")} />
            <div className="rounded-lg bg-muted/60 p-3">
              <h3 className="text-sm font-semibold text-foreground">{t(`items.${draft}.label`)}</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{t(`items.${draft}.description`)}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
          <Button type="button" onClick={() => { onChange(draft); setOpen(false) }}>{t("save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
