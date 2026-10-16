"use client"

import type { ColumnDef, Row } from "@tanstack/react-table"
import {
  CalendarDays,
  Code2,
  Ellipsis,
  Eye,
  FileCode2,
  Link2,
  Pencil,
  RotateCcw,
  Trash2,
  UserRound,
} from "lucide-react"
import { useLocale } from "next-intl"

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { AdminSnippet } from "@/features/admin-snippets/types"

export type SnippetRowAction = {
  row: Row<AdminSnippet>
  variant: "view" | "update" | "delete" | "restore"
}

type Translate = (key: string, values?: Record<string, string | number>) => string

export function getSnippetsTableColumns({
  canDelete,
  canUpdate,
  setRowAction,
  t,
  tc,
  locale,
}: {
  canDelete: boolean
  canUpdate: boolean
  setRowAction: React.Dispatch<React.SetStateAction<SnippetRowAction | null>>
  t: Translate
  tc: Translate
  locale: string
}): ColumnDef<AdminSnippet>[] {
  const deletionOptions = [
    { label: t("columns.scope.active"), value: "active" },
    { label: t("columns.scope.deleted"), value: "deleted" },
  ]
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label={t("columns.selectAll")}
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) =>
            table.toggleAllPageRowsSelected(Boolean(value))
          }
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={t("columns.selectRow", { name: row.original.name })}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
        />
      ),
      enableHiding: false,
      enableSorting: false,
      size: 40,
    },
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("columns.snippet")} />
      ),
      cell: ({ row }) => (
        <button
          type="button"
          className="flex min-w-64 max-w-[32rem] items-center gap-3 text-left"
          onClick={() => setRowAction({ row, variant: "view" })}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
            <FileCode2 className="size-4 text-muted-foreground" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium text-sm hover:text-primary">
              {row.original.name}
            </span>
            <span className="block truncate text-muted-foreground text-xs">
              {contentPreview(row.original.content, t)}
            </span>
          </span>
        </button>
      ),
      meta: {
        label: t("columns.name"),
        placeholder: t("columns.nameFilter"),
        variant: "text",
        icon: FileCode2,
      },
      enableColumnFilter: true,
    },
    {
      id: "content",
      accessorKey: "content",
      header: t("columns.content"),
      cell: ({ row }) => (
        <code className="block max-w-72 truncate text-muted-foreground text-xs">
          {contentPreview(row.original.content, t)}
        </code>
      ),
      meta: {
        label: t("columns.content"),
        placeholder: t("columns.contentFilter"),
        variant: "text",
        icon: Code2,
      },
      enableColumnFilter: true,
      enableSorting: false,
    },
    {
      id: "owner",
      accessorFn: (row) => row.owner.email,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("columns.owner")} />
      ),
      cell: ({ row }) => (
        <div className="flex min-w-52 items-center gap-2">
          <Avatar className="size-8 border">
            <AvatarImage
              src={row.original.owner.avatar ?? undefined}
              alt={row.original.owner.name}
            />
            <AvatarFallback className="text-xs">
              {initials(row.original.owner.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm">{row.original.owner.name}</p>
            <p className="truncate text-muted-foreground text-xs">
              {row.original.owner.email}
            </p>
          </div>
        </div>
      ),
      meta: {
        label: t("columns.owner"),
        placeholder: t("columns.ownerFilter"),
        variant: "text",
        icon: UserRound,
      },
      enableColumnFilter: true,
      enableSorting: false,
    },
    {
      id: "linksCount",
      accessorKey: "linksCount",
      header: t("columns.inUse"),
      cell: ({ row }) => (
        <Badge variant={row.original.linksCount > 0 ? "secondary" : "outline"}>
          <Link2 className="size-3" />{" "}
          {t("linksCount", { count: row.original.linksCount })}
        </Badge>
      ),
      enableSorting: false,
    },
    {
      id: "contentLength",
      accessorKey: "contentLength",
      header: t("columns.size"),
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground text-xs tabular-nums">
          {t("characters", {
            count: new Intl.NumberFormat(locale).format(row.original.contentLength),
          })}
        </span>
      ),
      enableSorting: false,
    },
    {
      id: "deletedState",
      accessorKey: "deletedState",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("columns.scope.label")} />
      ),
      cell: ({ row }) =>
        row.original.deletedAt ? (
          <Badge variant="destructive">{t("columns.scope.trash")}</Badge>
        ) : (
          <Badge variant="outline">{t("columns.scope.active")}</Badge>
        ),
      meta: {
        label: t("columns.scope.label"),
        variant: "multiSelect",
        options: deletionOptions,
        icon: Trash2,
      },
      enableColumnFilter: true,
      enableSorting: false,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={tc("createdAt")} />
      ),
      cell: ({ row }) => <DateCell value={row.original.createdAt} />,
      meta: {
        label: tc("createdAt"),
        variant: "dateRange",
        icon: CalendarDays,
      },
      enableColumnFilter: true,
    },
    {
      id: "updatedAt",
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("columns.updated")} />
      ),
      cell: ({ row }) => <DateCell value={row.original.updatedAt} />,
      meta: {
        label: t("columns.updatedAt"),
        variant: "dateRange",
        icon: CalendarDays,
      },
      enableColumnFilter: true,
    },
    {
      id: "actions",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={t("columns.openMenu", { name: row.original.name })}
              variant="ghost"
              className="flex size-8 p-0 data-[state=open]:bg-muted"
            >
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onSelect={() => setRowAction({ row, variant: "view" })}
            >
              <Eye /> {t("columns.viewContent")}
            </DropdownMenuItem>
            {canUpdate && !row.original.deletedAt ? (
              <DropdownMenuItem
                onSelect={() => setRowAction({ row, variant: "update" })}
              >
                <Pencil /> {tc("edit")}
              </DropdownMenuItem>
            ) : null}
            {(canUpdate || canDelete) && <DropdownMenuSeparator />}
            {canUpdate && row.original.deletedAt ? (
              <DropdownMenuItem
                onSelect={() => setRowAction({ row, variant: "restore" })}
              >
                <RotateCcw /> {t("restore")}
              </DropdownMenuItem>
            ) : null}
            {canDelete && !row.original.deletedAt ? (
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setRowAction({ row, variant: "delete" })}
              >
                <Trash2 /> {t("moveToTrash")}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}

function DateCell({ value }: { value: string }) {
  const locale = useLocale()
  return (
    <time
      dateTime={value}
      className="whitespace-nowrap text-muted-foreground text-xs"
    >
      {new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))}
    </time>
  )
}

function contentPreview(content: string, t: Translate) {
  return content.replace(/\s+/g, " ").trim() || t("columns.emptySnippet")
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  )
}
