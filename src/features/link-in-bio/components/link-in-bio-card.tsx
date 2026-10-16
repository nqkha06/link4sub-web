"use client"

import { useState } from "react"
import { Pencil } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import { CopyFeedbackIcon } from "@/components/copy-feedback-icon"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { BioPageDto } from "@/lib/api-client"
import { LinkInBioActionsMenu } from "./link-in-bio-actions-menu"
import { copyBioUrl, DeleteLinkInBioDialog, LinkInBioQrDialog, LinkInBioStatsDialog } from "./link-in-bio-dialogs"
import { LinkInBioThemeAccent } from "./link-in-bio-theme-indicator"

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("LinkInBio.status")
  if (status === "published") return <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">{t("published")}</Badge>
  if (status === "paused") return <Badge variant="outline" className="border-destructive/20 bg-destructive/10 text-destructive">{t("paused")}</Badge>
  return <Badge variant="secondary">{t("draft")}</Badge>
}

export function LinkInBioCard({
  page,
  onEdit,
  onDelete,
}: {
  page: BioPageDto
  onEdit: (page: BioPageDto) => void
  onDelete: (page: BioPageDto) => Promise<void>
}) {
  const [qrOpen, setQrOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const publicUrl = page.publicUrl
  const t = useTranslations("LinkInBio.card")
  const d = useTranslations("LinkInBio.dialogs")
  const format = useFormatter()
  const updatedDate = format.dateTime(new Date(page.updatedAt), { day: "2-digit", month: "2-digit", year: "numeric" })

  return (
    <>
      <Card className="relative gap-0 overflow-hidden rounded-xl border-border bg-card py-0 shadow-none">
        <LinkInBioThemeAccent appearance={page.appearance} />

        <div className="flex items-start justify-between gap-4 px-5 py-5">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold text-foreground">{page.name}</h2>
            <div className="mt-1 flex min-w-0 items-center gap-1.5">
              <span className="truncate text-xs text-muted-foreground">
                {publicUrl}
              </span>
              <Button type="button" variant="ghost" size="icon-sm" className="size-7 shrink-0 text-muted-foreground" onClick={() => void copyBioUrl(page, { copied: d("copied"), failed: d("copyFailed") })} aria-label={t("copyLink", { name: page.name })}><CopyFeedbackIcon className="size-3.5" /></Button>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <StatusBadge status={page.status} />
            <LinkInBioActionsMenu
              page={page}
              onQr={() => setQrOpen(true)}
              onStats={() => setStatsOpen(true)}
              onEdit={() => onEdit(page)}
              onDelete={() => setDeleteOpen(true)}
            />
          </div>
        </div>

        <div className="flex min-h-14 items-center justify-between gap-3 border-t border-border px-5 py-2.5">
          <p className="min-w-0 truncate text-xs text-muted-foreground">{t("updated", { date: updatedDate })}</p>
          <Button type="button" size="sm" className="h-10 shrink-0 rounded-lg px-3 shadow-none sm:h-9" onClick={() => onEdit(page)}><Pencil className="size-4" />{t("edit")}</Button>
        </div>
      </Card>

      <LinkInBioQrDialog page={page} open={qrOpen} onOpenChange={setQrOpen} />
      <LinkInBioStatsDialog page={page} open={statsOpen} onOpenChange={setStatsOpen} />
      <DeleteLinkInBioDialog page={page} open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={() => onDelete(page)} />
    </>
  )
}
