"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import {
  BarChart3,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  QrCode,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { BioPageDto } from "@/lib/api-client"

export function LinkInBioActionsMenu({
  page,
  onQr,
  onStats,
  onEdit,
  onDelete,
}: {
  page: BioPageDto
  onQr: () => void
  onStats: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const t = useTranslations("LinkInBio.card")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="size-11 rounded-lg text-muted-foreground sm:size-9" aria-label={t("actions", { name: page.name })}>
          <MoreHorizontal className="size-[18px]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-52 rounded-lg p-1.5">
        <DropdownMenuItem asChild><Link href={page.publicUrl} target="_blank" rel="noreferrer"><ExternalLink className="size-4" />{t("open")}</Link></DropdownMenuItem>
        <DropdownMenuItem onSelect={onQr}><QrCode className="size-4" />{t("qr")}</DropdownMenuItem>
        <DropdownMenuItem onSelect={onStats}><BarChart3 className="size-4" />{t("stats")}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onEdit}><Pencil className="size-4" />{t("edit")}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onDelete}><Trash2 className="size-4" />{t("delete")}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
