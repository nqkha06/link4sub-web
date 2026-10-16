"use client"
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react"
import QRCode from "qrcode"
import { Download, Eye, LayoutGrid, Link2, MousePointerClick, Percent, Share2, type LucideIcon } from "lucide-react"
import { CopyFeedbackIcon } from "@/components/copy-feedback-icon"
import { useFormatter, useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog"
import { Input } from "@/components/member/fields/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/member/fields/select"
import type { BioPageDto } from "@/lib/api-client"
import { getBioCtr, getVisibleBioLinks } from "./types"

type QrErrorCorrection = "L" | "M" | "Q" | "H"

function absolutePublicUrl(page: BioPageDto) {
  if (typeof window === "undefined") return page.publicUrl
  return new URL(page.publicUrl, window.location.origin).toString()
}

export async function copyBioUrl(page: BioPageDto, messages: { copied: string; failed: string }) {
  try {
    await navigator.clipboard.writeText(absolutePublicUrl(page))
    toast.success(messages.copied)
  } catch {
    toast.error(messages.failed)
  }
}

export function LinkInBioQrDialog({ page, open, onOpenChange }: { page: BioPageDto; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [size, setSize] = useState(224)
  const [margin, setMargin] = useState(1)
  const [errorCorrection, setErrorCorrection] = useState<QrErrorCorrection>("M")
  const [imageSrc, setImageSrc] = useState("")
  const publicUrl = absolutePublicUrl(page)
  const t = useTranslations("LinkInBio.dialogs")

  useEffect(() => {
    if (!open) return
    let active = true
    void QRCode.toDataURL(publicUrl, {
      width: size,
      margin,
      errorCorrectionLevel: errorCorrection,
      color: { dark: "#111827", light: "#ffffff" },
    }).then((value) => active && setImageSrc(value)).catch(() => active && setImageSrc(""))
    return () => { active = false }
  }, [errorCorrection, margin, open, publicUrl, size])

  const downloadQr = () => {
    if (!imageSrc) return
    const download = document.createElement("a")
    download.href = imageSrc
    download.download = `${page.slug}-qr.png`
    download.click()
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-xl">
        <ResponsiveDialogHeader className="border-b border-border">
          <ResponsiveDialogTitle>{t("qrTitle")}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="space-y-5 pt-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2"><Label htmlFor={`bio-qr-size-${page.id}`}>{t("qrSize")}</Label><Input id={`bio-qr-size-${page.id}`} type="number" min={120} max={640} value={size} onChange={(event) => setSize(Math.min(640, Math.max(120, Number(event.target.value) || 224)))} /></div>
            <div className="grid gap-2"><Label htmlFor={`bio-qr-margin-${page.id}`}>{t("qrMargin")}</Label><Input id={`bio-qr-margin-${page.id}`} type="number" min={0} max={20} value={margin} onChange={(event) => setMargin(Math.min(20, Math.max(0, Number(event.target.value) || 0)))} /></div>
            <div className="grid gap-2"><Label>{t("qrErrorCorrection")}</Label><Select value={errorCorrection} onValueChange={(value) => setErrorCorrection(value as QrErrorCorrection)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(["L", "M", "Q", "H"] as QrErrorCorrection[]).map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-4">{imageSrc ? <img src={imageSrc} alt={t("qrAlt", { name: page.name })} className="size-56 max-w-full" /> : <p className="text-sm text-muted-foreground">{t("qrFailed")}</p>}</div>
          <p className="break-all rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">{publicUrl}</p>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter className="flex-col gap-2 border-border bg-background sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => void copyBioUrl(page, { copied: t("copied"), failed: t("copyFailed") })}><CopyFeedbackIcon className="size-4" />{t("copyLink")}</Button>
          <Button onClick={downloadQr} disabled={!imageSrc}><Download className="size-4" />{t("downloadPng")}</Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

export function LinkInBioStatsDialog({ page, open, onOpenChange }: { page: BioPageDto; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("LinkInBio.dialogs")
  const format = useFormatter()
  const ctr = getBioCtr(page)
  const performance: Array<{ label: string; value: string; icon: LucideIcon }> = [
    { label: t("views"), value: format.number(page.views), icon: Eye },
    { label: t("clicks"), value: format.number(page.clicks), icon: MousePointerClick },
    { label: t("ctr"), value: `${format.number(ctr, { maximumFractionDigits: 1 })}%`, icon: Percent },
  ]
  const content: Array<{ label: string; value: string; icon: LucideIcon }> = [
    { label: t("publicLinks"), value: format.number(getVisibleBioLinks(page)), icon: Link2 },
    { label: t("socials"), value: format.number(page.socialLinks.length), icon: Share2 },
    { label: t("widgets"), value: format.number(page.widgets.length), icon: LayoutGrid },
  ]
  const [views, ...secondaryPerformance] = performance

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-xl">
        <ResponsiveDialogHeader className="border-b border-border">
          <ResponsiveDialogTitle>{t("statsTitle")}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {t("statsDescription", { name: page.name })}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="space-y-5 pt-5">
          <section aria-labelledby={`bio-performance-${page.id}`}>
            <h3 id={`bio-performance-${page.id}`} className="mb-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {t("performance")}
            </h3>
            <dl className="grid grid-cols-2 gap-3">
              <div className="col-span-2 flex items-center justify-between gap-4 overflow-hidden rounded-xl border border-primary/20 bg-primary/[0.05] p-4">
                <div className="min-w-0">
                  <dt className="text-sm font-medium text-muted-foreground">{views.label}</dt>
                  <dd className="mt-1 text-3xl font-semibold tracking-[-0.035em] tabular-nums text-foreground">{views.value}</dd>
                </div>
                <MetricIcon icon={views.icon} featured />
              </div>
              {secondaryPerformance.map((metric) => (
                <MetricCard key={metric.label} {...metric} />
              ))}
            </dl>
          </section>

          <section aria-labelledby={`bio-content-${page.id}`}>
            <h3 id={`bio-content-${page.id}`} className="mb-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {t("content")}
            </h3>
            <dl className="grid grid-cols-3 gap-3">
              {content.map((metric) => (
                <MetricCard key={metric.label} {...metric} compact />
              ))}
            </dl>
          </section>
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

function MetricIcon({ icon: Icon, featured = false }: { icon: LucideIcon; featured?: boolean }) {
  return (
    <span className={featured
      ? "grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
      : "grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"
    }>
      <Icon className={featured ? "size-5" : "size-4"} aria-hidden />
    </span>
  )
}

function MetricCard({ label, value, icon, compact = false }: { label: string; value: string; icon: LucideIcon; compact?: boolean }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card p-3.5">
      <MetricIcon icon={icon} />
      <dt className={`${compact ? "mt-3 min-h-8 text-xs leading-4" : "mt-4 text-sm"} font-medium text-muted-foreground`}>{label}</dt>
      <dd className={`${compact ? "mt-1 text-xl" : "mt-1.5 text-2xl"} font-semibold tracking-[-0.025em] tabular-nums text-foreground`}>{value}</dd>
    </div>
  )
}

export function DeleteLinkInBioDialog({ page, open, onOpenChange, onConfirm }: { page: BioPageDto; open: boolean; onOpenChange: (open: boolean) => void; onConfirm: () => Promise<void> }) {
  const t = useTranslations("LinkInBio.dialogs")
  const [deleting, setDeleting] = useState(false)
  const confirmDelete = async () => {
    if (deleting) return
    setDeleting(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteTitle", { name: page.name })}</AlertDialogTitle>
          <AlertDialogDescription>{t("deleteDescription")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={deleting} onClick={(event) => { event.preventDefault(); void confirmDelete() }}>{deleting ? t("deleting") : t("delete")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
