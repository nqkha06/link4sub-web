"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CircleDashed, Copy, Ellipsis, ExternalLink, Eye, FileText, Mail } from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminBioPageListItem } from "@/features/admin-bio-pages/types";

import { formatDate, STATUS_VALUES, StatusBadge } from "./bio-page-status-badge";

type Translator = (key: string, values?: Record<string, string | number>) => string;

export function getAdminBioPagesTableColumns({
  t,
  tc,
  locale,
  onOpen,
  onCopyLink,
}: {
  t: Translator;
  tc: Translator;
  locale: string;
  onOpen: (page: AdminBioPageListItem) => void;
  onCopyLink: (page: AdminBioPageListItem) => void;
}): ColumnDef<AdminBioPageListItem>[] {
  const number = new Intl.NumberFormat(locale);

  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label={t("bulk.selectAll")}
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={t("bulk.selectRow", { name: row.original.name })}
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
      header: ({ column }) => <DataTableColumnHeader column={column} label={t("table.columns.page")} />,
      cell: ({ row }) => (
        <div className="min-w-56 max-w-sm">
          <button
            type="button"
            className="block max-w-full truncate text-left text-sm font-medium hover:underline"
            onClick={() => onOpen(row.original)}
          >
            {row.original.name}
          </button>
          <div className="mt-0.5 flex items-center gap-1">
            {row.original.status === "published" ? (
              <a
                href={row.original.publicUrl}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 truncate font-mono text-xs text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
              >
                {publicPath(row.original.publicUrl)}
              </a>
            ) : (
              <span className="min-w-0 truncate font-mono text-xs text-muted-foreground">
                {publicPath(row.original.publicUrl)}
              </span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
              aria-label={t("bulk.copyLink", { name: row.original.name })}
              onClick={() => onCopyLink(row.original)}
            >
              <Copy className="size-3.5" />
            </Button>
          </div>
        </div>
      ),
      meta: {
        label: t("table.columns.page"),
        placeholder: t("filters.searchPlaceholder"),
        variant: "text",
        icon: FileText,
      },
      enableColumnFilter: true,
      enableHiding: false,
    },
    {
      id: "owner",
      accessorFn: (row) => row.owner?.email ?? "",
      header: t("table.columns.owner"),
      cell: ({ row }) =>
        row.original.owner ? (
          <div className="min-w-44 max-w-56">
            <p className="truncate text-sm font-medium">{row.original.owner.name}</p>
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <Mail className="size-3 shrink-0" />
              {row.original.owner.email}
            </p>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">{t("table.unknownOwnerShort")}</span>
        ),
      meta: { label: t("table.columns.owner") },
      enableSorting: false,
    },
    {
      id: "status",
      accessorKey: "status",
      header: tc("status"),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      meta: {
        label: tc("status"),
        variant: "multiSelect",
        options: STATUS_VALUES.map((value) => ({ value, label: t(`status.${value}`) })),
        icon: CircleDashed,
      },
      enableColumnFilter: true,
      enableSorting: false,
    },
    {
      id: "views",
      accessorKey: "views",
      header: ({ column }) => <DataTableColumnHeader column={column} label={t("table.columns.views")} />,
      cell: ({ row }) => <span className="text-sm tabular-nums">{number.format(row.original.views)}</span>,
      meta: { label: t("table.columns.views") },
    },
    {
      id: "clicks",
      accessorKey: "clicks",
      header: ({ column }) => <DataTableColumnHeader column={column} label={t("table.columns.clicks")} />,
      cell: ({ row }) => <span className="text-sm tabular-nums">{number.format(row.original.clicks)}</span>,
      meta: { label: t("table.columns.clicks") },
    },
    {
      id: "updatedAt",
      accessorKey: "updatedAt",
      header: ({ column }) => <DataTableColumnHeader column={column} label={t("table.columns.updated")} />,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
          {formatDate(row.original.updatedAt, locale)}
        </span>
      ),
      meta: { label: t("table.columns.updated") },
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => <DataTableColumnHeader column={column} label={tc("createdAt")} />,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
          {formatDate(row.original.createdAt, locale)}
        </span>
      ),
      meta: { label: tc("createdAt") },
    },
    {
      id: "actions",
      header: tc("actions"),
      enableHiding: false,
      enableSorting: false,
      size: 72,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={t("table.actions.open", { name: row.original.name })}
              variant="ghost"
              className="flex size-8 p-0 data-[state=open]:bg-muted"
            >
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onSelect={() => onOpen(row.original)}>
              <Eye /> {tc("viewDetails")}
            </DropdownMenuItem>
            {row.original.status === "published" ? (
              <DropdownMenuItem asChild>
                <a href={row.original.publicUrl} target="_blank" rel="noreferrer">
                  <ExternalLink /> {t("detail.openPublic")}
                </a>
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}

function publicPath(value: string) {
  try {
    return new URL(value).pathname
  } catch {
    return value
  }
}
