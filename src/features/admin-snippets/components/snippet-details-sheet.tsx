"use client"

import { CalendarDays, FileCode2, Link2, UserRound } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { AdminSnippet } from "@/features/admin-snippets/types"

export function SnippetDetailsSheet({
  snippet,
  onOpenChange,
}: {
  snippet: AdminSnippet | null
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations("Admin.snippets.details")
  const tc = useTranslations("Admin.common")
  const locale = useLocale()
  const formatTimestamp = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value))

  return (
    <Sheet open={Boolean(snippet)} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden sm:max-w-2xl">
        <SheetHeader className="border-b px-6 py-5">
          <div className="flex items-start gap-3 pr-8">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
              <FileCode2 className="size-5 text-muted-foreground" />
            </span>
            <div className="min-w-0">
              <SheetTitle className="truncate">{snippet?.name}</SheetTitle>
              <SheetDescription>
                {t("description")}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {snippet ? (
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoItem
                icon={UserRound}
                label={t("owner")}
                value={`${snippet.owner.name} · ${snippet.owner.email}`}
              />
              <InfoItem
                icon={Link2}
                label={t("linksInUse")}
                value={t("linksCount", { count: snippet.linksCount })}
              />
              <InfoItem
                icon={CalendarDays}
                label={tc("createdAt")}
                value={formatTimestamp(snippet.createdAt)}
              />
              <InfoItem
                icon={CalendarDays}
                label={t("lastUpdated")}
                value={formatTimestamp(snippet.updatedAt)}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-sm">{t("content")}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {t("characters", {
                    count: new Intl.NumberFormat(locale).format(snippet.contentLength),
                  })}
                </Badge>
                {snippet.deletedAt ? (
                  <Badge variant="destructive">{t("trashed")}</Badge>
                ) : null}
              </div>
            </div>
            <pre className="min-h-60 flex-1 overflow-auto whitespace-pre-wrap break-words rounded-lg border bg-muted/30 p-4 font-mono text-xs leading-6">
              {snippet.content}
            </pre>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="flex items-center gap-2 text-muted-foreground text-xs">
        <Icon className="size-3.5" /> {label}
      </p>
      <p className="mt-1.5 truncate text-sm" title={value}>
        {value}
      </p>
    </div>
  )
}
