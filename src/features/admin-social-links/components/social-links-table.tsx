"use client"

import type { Table } from "@tanstack/react-table"
import {
  CirclePause,
  CirclePlay,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar"
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list"
import { DataTableSortList } from "@/components/data-table/data-table-sort-list"
import { Button } from "@/components/ui/button"
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider"
import {
  restoreAdminSocialLinks,
  updateAdminSocialLinksStatus,
} from "@/features/admin-social-links/api/social-links.client"
import { DeleteSocialLinksDialog } from "@/features/admin-social-links/components/delete-social-links-dialog"
import { RestoreSocialLinksDialog } from "@/features/admin-social-links/components/restore-social-links-dialog"
import { SocialLinkEditorDialog } from "@/features/admin-social-links/components/social-link-editor-dialog"
import { SocialLinkDetailsSheet } from "@/features/admin-social-links/components/social-link-details-sheet"
import { SocialLinksQuickFilters } from "@/features/admin-social-links/components/social-links-quick-filters"
import {
  getSocialLinksTableColumns,
  type SocialLinkRowAction,
} from "@/features/admin-social-links/components/social-links-table-columns"
import type {
  AdminSocialLink,
  AdminSocialLinksTableData,
  AdminSocialLinkStatus,
} from "@/features/admin-social-links/types"
import { useDataTable } from "@/hooks/use-data-table"

export function SocialLinksTable({
  data,
  pageCount,
  total,
  totalViews,
  totalRevenue,
  filteredUserId,
}: AdminSocialLinksTableData & { filteredUserId: number | null }) {
  const t = useTranslations("Admin.socialLinks")
  const tc = useTranslations("Admin.common")
  const locale = useLocale()
  const permissions = useAdminPermissions()
  const canUpdate = permissions.includes("links.update")
  const canDelete = permissions.includes("links.delete")
  const router = useRouter()
  const [rowAction, setRowAction] =
    React.useState<SocialLinkRowAction | null>(null)
  const [deleteLinks, setDeleteLinks] = React.useState<AdminSocialLink[]>([])

  const columns = React.useMemo(
    () =>
      getSocialLinksTableColumns({
        canDelete,
        canUpdate,
        setRowAction,
        t,
        tc,
        locale,
      }),
    [canDelete, canUpdate, t, tc, locale],
  )

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data,
    columns,
    pageCount,
    enableAdvancedFilter: true,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      columnVisibility: { deletedState: false },
      columnPinning: { right: ["actions"] },
    },
    getRowId: (row) => String(row.id),
    shallow: false,
    clearOnDefault: true,
  })

  const refresh = React.useCallback(() => {
    table.toggleAllRowsSelected(false)
    router.refresh()
  }, [router, table])

  return (
    <div className="flex min-w-0 w-full flex-col gap-6">
      {filteredUserId ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
          <p className="text-sm">
            {t("table.filteredUser", { id: filteredUserId })}
          </p>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/social-links">
              <X /> {t("table.clearUserFilter")}
            </Link>
          </Button>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label={t("table.summary.results")}
          value={total}
          locale={locale}
        />
        <SummaryCard
          label={t("table.summary.totalViews")}
          value={totalViews}
          locale={locale}
        />
        <SummaryCard
          label={t("table.summary.totalRevenue")}
          value={formatMoney(totalRevenue, locale)}
          locale={locale}
        />
        <SummaryCard
          label={t("table.summary.activeOnPage")}
          value={data.filter((link) => link.status === "active").length}
          locale={locale}
        />
      </div>

      <DataTable
        table={table}
        actionBar={
          <SocialLinksSelectionActionBar
            table={table}
            canUpdate={canUpdate}
            canDelete={canDelete}
            onDelete={setDeleteLinks}
            onSuccess={refresh}
          />
        }
      >
        <SocialLinksQuickFilters className="p-1" />
        <DataTableAdvancedToolbar table={table}>
          <DataTableFilterList
            table={table}
            shallow={shallow}
            debounceMs={debounceMs}
            throttleMs={throttleMs}
            align="start"
          />
          <DataTableSortList table={table} align="start" />
        </DataTableAdvancedToolbar>
      </DataTable>

      <SocialLinkEditorDialog
        key={
          rowAction?.variant === "update"
            ? rowAction.row.original.id
            : "closed"
        }
        link={
          rowAction?.variant === "update" ? rowAction.row.original : null
        }
        onOpenChange={() => setRowAction(null)}
        onSuccess={refresh}
      />

      <SocialLinkDetailsSheet
        link={
          rowAction?.variant === "view" ? rowAction.row.original : null
        }
        onOpenChange={() => setRowAction(null)}
      />

      <DeleteSocialLinksDialog
        links={
          rowAction?.variant === "delete"
            ? [rowAction.row.original]
            : deleteLinks
        }
        onOpenChange={() => {
          setRowAction(null)
          setDeleteLinks([])
        }}
        onSuccess={refresh}
      />

      <RestoreSocialLinksDialog
        links={
          rowAction?.variant === "restore"
            ? [rowAction.row.original]
            : []
        }
        onOpenChange={() => setRowAction(null)}
        onSuccess={refresh}
      />
    </div>
    
  )
}

function SocialLinksSelectionActionBar({
  table,
  canUpdate,
  canDelete,
  onDelete,
  onSuccess,
}: {
  table: Table<AdminSocialLink>
  canUpdate: boolean
  canDelete: boolean
  onDelete: (links: AdminSocialLink[]) => void
  onSuccess: () => void
}) {
  const t = useTranslations("Admin.socialLinks")
  const tc = useTranslations("Admin.common")
  const [mutating, setMutating] = React.useState(false)
  const selected = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original)
  const activeLinks = selected.filter((link) => !link.deletedAt)
  const deletedLinks = selected.filter((link) => Boolean(link.deletedAt))

  async function changeStatus(status: AdminSocialLinkStatus) {
    if (!activeLinks.length) return
    setMutating(true)
    try {
      const result = await updateAdminSocialLinksStatus(
        activeLinks.map((link) => link.id),
        status,
      )
      toast.success(t("table.bulk.updated", { count: result.updated }))
      onSuccess()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("table.bulk.updateError"),
      )
    } finally {
      setMutating(false)
    }
  }

  async function restore() {
    if (!deletedLinks.length) return
    setMutating(true)
    try {
      const result = await restoreAdminSocialLinks(
        deletedLinks.map((link) => link.id),
      )
      toast.success(t("restore.success", { count: result.restored }))
      onSuccess()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("restore.error"),
      )
    } finally {
      setMutating(false)
    }
  }

  return (
    <div
      role="toolbar"
      className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card p-2 shadow-sm"
    >
      <span className="px-1 text-sm">
        {t.rich("table.bulk.selected", {
          count: selected.length,
          strong: (chunks) => <strong>{chunks}</strong>,
        })}
      </span>
      <div className="flex flex-wrap items-center gap-1">
        {canUpdate && activeLinks.length ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              disabled={mutating}
              onClick={() => void changeStatus("active")}
            >
              <CirclePlay /> {t("table.bulk.activate")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={mutating}
              onClick={() => void changeStatus("paused")}
            >
              <CirclePause /> {t("status.paused")}
            </Button>
          </>
        ) : null}
        {canUpdate && deletedLinks.length ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={mutating}
            onClick={() => void restore()}
          >
            <RotateCcw /> {t("restore.confirm")}
          </Button>
        ) : null}
        {canDelete && activeLinks.length ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled={mutating}
            onClick={() => onDelete(activeLinks)}
          >
            <Trash2 /> {tc("delete")}
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          disabled={mutating}
          onClick={() => table.toggleAllRowsSelected(false)}
        >
          <X /> {t("table.bulk.clearSelection")}
        </Button>
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  locale,
}: {
  label: string
  value: number | string
  locale: string
}) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 font-semibold text-2xl tabular-nums">
        {typeof value === "number"
          ? new Intl.NumberFormat(locale).format(value)
          : value}
      </p>
    </div>
  )
}

function formatMoney(value: string, locale: string) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return value
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 4,
  }).format(amount)
}
