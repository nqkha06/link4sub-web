"use client"

import type { Table } from "@tanstack/react-table"
import { RotateCcw, Search, Trash2, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { parseAsInteger, parseAsString, useQueryState } from "nuqs"
import * as React from "react"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar"
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list"
import { DataTableSortList } from "@/components/data-table/data-table-sort-list"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider"
import {
  SnippetActionDialog,
  type SnippetConfirmationAction,
} from "@/features/admin-snippets/components/snippet-action-dialog"
import { SnippetDetailsSheet } from "@/features/admin-snippets/components/snippet-details-sheet"
import { SnippetCreateDialog } from "@/features/admin-snippets/components/snippet-create-dialog"
import { SnippetEditorDialog } from "@/features/admin-snippets/components/snippet-editor-dialog"
import {
  getSnippetsTableColumns,
  type SnippetRowAction,
} from "@/features/admin-snippets/components/snippets-table-columns"
import type {
  AdminSnippet,
  AdminSnippetsTableData,
} from "@/features/admin-snippets/types"
import { useDataTable } from "@/hooks/use-data-table"
import { useDebouncedCallback } from "@/hooks/use-debounced-callback"

export function SnippetsTable({
  data,
  pageCount,
  total,
  filteredUserId,
}: AdminSnippetsTableData & { filteredUserId: number | null }) {
  const t = useTranslations("Admin.snippets")
  const tc = useTranslations("Admin.common")
  const locale = useLocale()
  const permissions = useAdminPermissions()
  const canUpdate = permissions.includes("snippets.update")
  const canDelete = permissions.includes("snippets.delete")
  const canCreate = permissions.includes("snippets.create")
  const router = useRouter()
  const [rowAction, setRowAction] = React.useState<SnippetRowAction | null>(null)
  const [bulkAction, setBulkAction] =
    React.useState<SnippetConfirmationAction | null>(null)
  const [create, setCreate] = useQueryState(
    "create",
    parseAsString.withDefault("").withOptions({
      shallow: true,
      clearOnDefault: true,
    }),
  )

  const columns = React.useMemo(
    () =>
      getSnippetsTableColumns({
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
      columnVisibility: {
        content: false,
        deletedState: false,
        updatedAt: false,
      },
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

  const confirmationAction = toConfirmationAction(rowAction, bulkAction)

  return (
    <div className="flex min-w-0 w-full flex-col gap-6">
      {filteredUserId ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
          <p className="text-sm">
            {t("table.filteredByUser", { id: filteredUserId })}
          </p>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/snippets">
              <X /> {t("table.clearUserFilter")}
            </Link>
          </Button>
        </div>
      ) : null}

      <div className="rounded-lg border bg-card px-4 py-3 sm:w-64">
        <p className="text-muted-foreground text-xs">
          {t("table.matchingResults")}
        </p>
        <p className="mt-1 font-semibold text-2xl tabular-nums">
          {new Intl.NumberFormat(locale).format(total)}
        </p>
      </div>

      <DataTable
        table={table}
        emptyMessage={t("table.empty")}
        actionBar={
          <SnippetsSelectionActionBar
            table={table}
            canUpdate={canUpdate}
            canDelete={canDelete}
            onAction={setBulkAction}
          />
        }
      >
        <DataTableAdvancedToolbar table={table}>
          <SnippetsSearchInput />
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

      <SnippetDetailsSheet
        snippet={rowAction?.variant === "view" ? rowAction.row.original : null}
        onOpenChange={() => setRowAction(null)}
      />

      {canCreate ? (
        <SnippetCreateDialog
          open={create === "1"}
          onOpenChange={(open) => void setCreate(open ? "1" : null)}
          onSuccess={() => {
            void setCreate(null)
            refresh()
          }}
        />
      ) : null}

      <SnippetEditorDialog
        key={
          rowAction?.variant === "update"
            ? rowAction.row.original.id
            : "closed"
        }
        snippet={
          rowAction?.variant === "update" ? rowAction.row.original : null
        }
        onOpenChange={() => setRowAction(null)}
        onSuccess={refresh}
      />

      <SnippetActionDialog
        action={confirmationAction}
        onOpenChange={() => {
          setRowAction(null)
          setBulkAction(null)
        }}
        onSuccess={refresh}
      />
    </div>
  )
}

function SnippetsSearchInput() {
  const t = useTranslations("Admin.snippets.table")
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault("").withOptions({
      shallow: false,
      clearOnDefault: true,
    }),
  )
  const [, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions({
      shallow: false,
      clearOnDefault: true,
    }),
  )
  const commit = useDebouncedCallback((next: string) => {
    void setPage(1)
    void setSearch(next || null)
  }, 300)

  return (
    <div className="relative min-w-52 flex-1 sm:max-w-sm">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        key={search}
        defaultValue={search}
        onChange={(event) => commit(event.target.value.trim())}
        className="pr-8 pl-8"
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchAria")}
      />
      {search ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-1/2 right-0.5 -translate-y-1/2"
          aria-label={t("clearSearch")}
          onClick={() => {
            void setPage(1)
            void setSearch(null)
          }}
        >
          <X />
        </Button>
      ) : null}
    </div>
  )
}

function SnippetsSelectionActionBar({
  table,
  canUpdate,
  canDelete,
  onAction,
}: {
  table: Table<AdminSnippet>
  canUpdate: boolean
  canDelete: boolean
  onAction: (action: SnippetConfirmationAction) => void
}) {
  const t = useTranslations("Admin.snippets")
  const tc = useTranslations("Admin.common")
  const selected = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original)
  const activeSnippets = selected.filter((snippet) => !snippet.deletedAt)
  const deletedSnippets = selected.filter((snippet) => Boolean(snippet.deletedAt))

  return (
    <div
      role="toolbar"
      className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card p-2 shadow-sm"
    >
      <span className="px-1 text-sm">
        {t.rich("table.selectedCount", {
          count: selected.length,
          strong: (chunks) => <strong>{chunks}</strong>,
        })}
      </span>
      <div className="flex flex-wrap items-center gap-1">
        {canUpdate && deletedSnippets.length ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onAction({ type: "restore", snippets: deletedSnippets })
            }
          >
            <RotateCcw /> {t("restore")}
          </Button>
        ) : null}
        {canDelete && activeSnippets.length ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onAction({ type: "delete", snippets: activeSnippets })}
          >
            <Trash2 /> {tc("delete")}
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => table.toggleAllRowsSelected(false)}
        >
          <X /> {t("table.clearSelection")}
        </Button>
      </div>
    </div>
  )
}

function toConfirmationAction(
  rowAction: SnippetRowAction | null,
  bulkAction: SnippetConfirmationAction | null,
): SnippetConfirmationAction | null {
  if (bulkAction) return bulkAction
  if (rowAction?.variant === "delete") {
    return { type: "delete", snippets: [rowAction.row.original] }
  }
  if (rowAction?.variant === "restore") {
    return { type: "restore", snippets: [rowAction.row.original] }
  }
  return null
}
