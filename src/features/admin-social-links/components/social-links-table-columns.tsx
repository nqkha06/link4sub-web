"use client"

import type { ColumnDef, Row } from "@tanstack/react-table"
import {
  CalendarIcon,
  Check,
  CircleDashed,
  CircleDollarSign,
  Code2,
  Copy,
  Ellipsis,
  ExternalLink,
  Eye,
  Globe2,
  Link2,
  MousePointerClick,
  RotateCcw,
  Trash2,
  UserRound,
  Waypoints,
  Workflow,
} from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import * as React from "react"
import { toast } from "sonner"

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
import type { AdminSocialLink } from "@/features/admin-social-links/types"
import { copyToClipboard } from "@/lib/clipboard"

export type SocialLinkRowAction = {
  row: Row<AdminSocialLink>
  variant: "view" | "update" | "delete" | "restore"
}

type Translator = ReturnType<typeof useTranslations>

export function getSocialLinksTableColumns({
  canDelete,
  canUpdate,
  setRowAction,
  t,
  tc,
  locale,
}: {
  canDelete: boolean
  canUpdate: boolean
  t: Translator
  tc: Translator
  locale: string
  setRowAction: React.Dispatch<
    React.SetStateAction<SocialLinkRowAction | null>
  >
}): ColumnDef<AdminSocialLink>[] {
  const statusOptions = [
    { label: tc("active"), value: "active" },
    { label: tc("inactive"), value: "inactive" },
    { label: t("status.paused"), value: "paused" },
  ]

  const deletionOptions = [
    { label: t("table.scope.active"), value: "active" },
    { label: t("table.scope.deleted"), value: "deleted" },
  ]

  const sourceOptions = [
    { label: t("source.web"), value: "web" },
    { label: t("source.api"), value: "api" },
  ]

  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label={t("table.selectAll")}
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
          aria-label={t("table.selectRow", { title: row.original.title })}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
        />
      ),
      enableHiding: false,
      enableSorting: false,
      size: 40,
    },
    {
      id: "title",
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          label={t("table.columns.socialLink")}
        />
      ),
      cell: ({ row }) => (
        <div className="flex min-w-64 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
            <Link2 className="size-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-sm">
              {row.original.title}
            </p>
            <div className="flex items-center gap-1">
              <a
                href={row.original.publicUrl}
                target="_blank"
                rel="noreferrer"
                className="truncate text-muted-foreground text-xs hover:text-foreground hover:underline"
              >
                {publicPath(row.original.publicUrl)}
              </a>
              <CopySocialLinkButton publicUrl={row.original.publicUrl} />
            </div>
          </div>
        </div>
      ),
      meta: {
        label: t("table.filters.titleOrAlias"),
        placeholder: t("table.filters.titlePlaceholder"),
        variant: "text",
        icon: Link2,
      },
      enableColumnFilter: true,
    },
    {
      id: "owner",
      accessorFn: (row) => row.owner.email,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("table.columns.owner")} />
      ),
      cell: ({ row }) => (
        <div className="group relative flex min-w-52 items-center gap-2">
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
            <p className="flex items-center gap-1.5 text-sm">
              <span className="truncate group-hover:underline">
                {row.original.owner.name}
              </span>
              <Link
                href={`/admin/social-links?userId=${row.original.owner.id}`}
                title={t("table.filterByOwner")}
                aria-label={t("table.filterByOwner")}
                className="relative z-10 shrink-0 rounded border px-1 font-mono text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                #{row.original.owner.id}
              </Link>
            </p>
            <p className="truncate text-muted-foreground text-xs">
              {row.original.owner.email}
            </p>
          </div>
          <Link
            href={`/admin/users/${row.original.owner.id}`}
            aria-label={row.original.owner.name}
            className="absolute inset-0"
          />
        </div>
      ),
      meta: {
        label: t("table.columns.owner"),
        placeholder: t("table.filters.ownerPlaceholder"),
        variant: "text",
        icon: UserRound,
      },
      enableColumnFilter: true,
      enableSorting: false,
    },
    {
      id: "source",
      accessorKey: "source",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          label={t("table.columns.source")}
        />
      ),
      cell: ({ row }) => (
        <LinkSourceBadge source={row.original.source} t={t} />
      ),
      meta: {
        label: t("table.columns.source"),
        variant: "multiSelect",
        options: sourceOptions,
        icon: Waypoints,
      },
      enableColumnFilter: true,
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={tc("status")} />
      ),
      cell: ({ row }) => <LinkStatusCell link={row.original} />,
      meta: {
        label: tc("status"),
        variant: "multiSelect",
        options: statusOptions,
        icon: CircleDashed,
      },
      enableColumnFilter: true,
    },
    {
      id: "revenue",
      accessorKey: "revenue",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          label={t("table.columns.revenue")}
        />
      ),
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">
          {formatMoney(row.original.revenue, locale)}
        </span>
      ),
      meta: {
        label: t("table.columns.revenue"),
        icon: CircleDollarSign,
      },
      enableColumnFilter: false,
    },
    {
      id: "views",
      accessorKey: "views",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          label={t("table.columns.views")}
        />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums">
          {new Intl.NumberFormat(locale).format(row.original.views)}
        </span>
      ),
      meta: {
        label: t("table.columns.views"),
        placeholder: t("table.filters.viewsPlaceholder"),
        variant: "number",
        icon: MousePointerClick,
      },
      enableColumnFilter: true,
    },
    {
      id: "deletedState",
      accessorKey: "deletedState",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          label={t("table.columns.scope")}
        />
      ),
      cell: ({ row }) =>
        row.original.deletedAt ? (
          <Badge variant="destructive">{t("table.scope.trash")}</Badge>
        ) : (
          <Badge variant="outline">{t("table.scope.active")}</Badge>
        ),
      meta: {
        label: t("table.columns.scope"),
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
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground text-xs">
          {formatDate(row.original.createdAt, locale)}
        </span>
      ),
      meta: {
        label: tc("createdAt"),
        variant: "dateRange",
        icon: CalendarIcon,
      },
      enableColumnFilter: true,
    },
    {
      id: "actions",
      enableHiding: false,
      enableSorting: false,
      size: 48,
      cell: ({ row }) => (
        <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={t("table.openMenu", { title: row.original.title })}
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
              <Eye /> {tc("viewDetails")}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a
                href={row.original.publicUrl}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink /> {t("details.openPublic")}
              </a>
            </DropdownMenuItem>
            {canUpdate && !row.original.deletedAt ? (
              <DropdownMenuItem
                onSelect={() => setRowAction({ row, variant: "update" })}
              >
                <Workflow /> {tc("edit")}
              </DropdownMenuItem>
            ) : null}
            {(canUpdate || canDelete) && <DropdownMenuSeparator />}
            {canUpdate && row.original.deletedAt ? (
              <DropdownMenuItem
                onSelect={() => setRowAction({ row, variant: "restore" })}
              >
                <RotateCcw /> {t("restore.confirm")}
              </DropdownMenuItem>
            ) : null}
            {canDelete && !row.original.deletedAt ? (
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setRowAction({ row, variant: "delete" })}
              >
                <Trash2 /> {t("delete.confirm")}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      ),
    },
  ]
}

function LinkSourceBadge({
  source,
  t,
}: {
  source: AdminSocialLink["source"]
  t: Translator
}) {
  if (source === "api") {
    return (
      <Badge className="gap-1 border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50">
        <Code2 className="size-3" /> {t("source.api")}
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="gap-1">
      <Globe2 className="size-3" /> {t("source.web")}
    </Badge>
  )
}

function LinkStatusCell({ link }: { link: AdminSocialLink }) {
  const t = useTranslations("Admin.socialLinks")
  const tc = useTranslations("Admin.common")
  if (link.deletedAt) {
    return <Badge variant="destructive">{t("status.deleted")}</Badge>
  }
  if (link.status === "active") {
    return (
      <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
        {tc("active")}
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="bg-muted text-muted-foreground">
      {link.status === "paused" ? t("status.paused") : tc("inactive")}
    </Badge>
  )
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

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
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

function CopySocialLinkButton({ publicUrl }: { publicUrl: string }) {
  const tc = useTranslations("Admin.common")
  const tCommon = useTranslations("Common")
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  return (
    <button
      type="button"
      aria-label={copied ? tc("copied") : tc("copy")}
      title={copied ? tc("copied") : tc("copy")}
      className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
      onClick={() => {
        void copyToClipboard(publicUrl).then((ok) => {
          if (!ok) {
            toast.error(tCommon("copyFailed"))
            return
          }
          setCopied(true)
          toast.success(tc("copied"))
        })
      }}
    >
      {copied ? (
        <Check className="size-3 text-emerald-600" />
      ) : (
        <Copy className="size-3" />
      )}
    </button>
  )
}

function publicPath(value: string) {
  try {
    return new URL(value).pathname
  } catch {
    return value
  }
}
