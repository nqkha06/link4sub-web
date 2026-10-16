"use client"

import { Search } from "lucide-react"
import { useTranslations } from "next-intl"

import { Input } from "@/components/member/fields/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/member/fields/select"
import type { BioSort, BioStatusFilter } from "./types"

export function LinkInBioToolbar({
  query,
  status,
  sort,
  onQueryChange,
  onStatusChange,
  onSortChange,
}: {
  query: string
  status: BioStatusFilter
  sort: BioSort
  onQueryChange: (value: string) => void
  onStatusChange: (value: BioStatusFilter) => void
  onSortChange: (value: BioSort) => void
}) {
  const t = useTranslations("LinkInBio.toolbar")
  const s = useTranslations("LinkInBio.status")

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center" role="search">
      <label className="relative min-w-0 flex-1 lg:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchLabel")}
          className="pl-9"
        />
      </label>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:ml-auto">
        <Select value={status} onValueChange={(value) => onStatusChange(value as BioStatusFilter)}>
          <SelectTrigger className="w-full sm:w-44" aria-label={t("statusLabel")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{s("all")}</SelectItem>
            <SelectItem value="published">{s("published")}</SelectItem>
            <SelectItem value="draft">{s("draft")}</SelectItem>
            <SelectItem value="paused">{s("paused")}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(value) => onSortChange(value as BioSort)}>
          <SelectTrigger className="w-full sm:w-48" aria-label={t("sortLabel")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">{t("sortUpdated")}</SelectItem>
            <SelectItem value="oldest">{t("sortOldest")}</SelectItem>
            <SelectItem value="views">{t("sortViews")}</SelectItem>
            <SelectItem value="ctr">{t("sortCtr")}</SelectItem>
            <SelectItem value="name">{t("sortName")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
