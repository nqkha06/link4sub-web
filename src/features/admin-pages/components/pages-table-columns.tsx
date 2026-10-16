"use client";

import type { ColumnDef, Row } from "@tanstack/react-table";
import {
  Archive,
  CalendarDays,
  CircleDashed,
  Copy,
  Ellipsis,
  Eye,
  ExternalLink,
  FileText,
  Pencil,
  RotateCcw,
  Send,
  Trash2,
} from "lucide-react";
import Link from "next/link";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PageStatusBadge } from "@/features/admin-pages/components/page-status-badge";
import { getPageStatusOptions } from "@/features/admin-pages/page-status";
import type {
  AdminPageListItem,
  PageStatus,
} from "@/features/admin-pages/types";
import {
  canViewPublicPage,
  publicPagePath,
} from "@/features/pages/public-page-url";

export type PageRowAction = {
  row: Row<AdminPageListItem>;
  variant: "delete";
};

type Translate = (key: string, values?: Record<string, string | number>) => string;

export function getPagesTableColumns({
  t,
  tc,
  locale,
  canUpdate,
  canDelete,
  canPublish,
  onStatusChange,
  onCopyPublicUrl,
  setRowAction,
}: {
  /** Translator scoped to `Admin.pages`. */
  t: Translate;
  /** Translator scoped to `Admin.common`. */
  tc: Translate;
  locale: string;
  canUpdate: boolean;
  canDelete: boolean;
  canPublish: boolean;
  onStatusChange: (page: AdminPageListItem, status: PageStatus) => void;
  onCopyPublicUrl: (page: AdminPageListItem) => void;
  setRowAction: React.Dispatch<React.SetStateAction<PageRowAction | null>>;
}): ColumnDef<AdminPageListItem>[] {
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
          onClick={(event) => event.stopPropagation()}
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
        <DataTableColumnHeader column={column} label={t("table.columns.page")} />
      ),
      cell: ({ row }) => (
        <div className="flex min-w-64 max-w-[32rem] items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-md border bg-muted/30">
            <FileText className="size-4 text-primary" />
          </div>
          <div className="min-w-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`/admin/pages/${row.original.id}`}
                    className="block truncate font-medium text-sm hover:text-primary hover:underline hover:underline-offset-4"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {row.original.title}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm">
                  {row.original.title}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <p className="max-w-80 truncate font-mono text-muted-foreground text-xs">
              /{row.original.slug}
            </p>
          </div>
        </div>
      ),
      meta: {
        label: tc("title"),
        placeholder: t("table.columns.titleFilter"),
        variant: "text",
        icon: FileText,
      },
      enableColumnFilter: true,
    },
    {
      id: "slug",
      accessorKey: "slug",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("fields.slug")} />
      ),
      cell: ({ row }) => (
        <span className="block max-w-56 truncate font-mono text-muted-foreground text-xs">
          {row.original.slug}
        </span>
      ),
      meta: {
        label: t("fields.slug"),
        placeholder: t("table.columns.slugFilter"),
        variant: "text",
        icon: FileText,
      },
      enableColumnFilter: true,
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={tc("status")} />
      ),
      cell: ({ row }) => <PageStatusBadge status={row.original.status} />,
      meta: {
        label: tc("status"),
        variant: "multiSelect",
        options: getPageStatusOptions(t),
        icon: CircleDashed,
      },
      enableColumnFilter: true,
    },
    {
      id: "sortOrder",
      accessorKey: "sortOrder",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("table.columns.sortOrder")} />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.sortOrder}</span>
      ),
    },
    {
      id: "updatedAt",
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("table.columns.updated")} />
      ),
      cell: ({ row }) => (
        <time
          dateTime={row.original.updatedAt}
          className="whitespace-nowrap text-muted-foreground text-xs"
        >
          {formatDate(row.original.updatedAt, locale)}
        </time>
      ),
      meta: {
        label: t("table.columns.updatedAt"),
        variant: "dateRange",
        icon: CalendarDays,
      },
      enableColumnFilter: true,
    },
    {
      id: "publishedAt",
      accessorKey: "publishedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("table.columns.published")} />
      ),
      cell: ({ row }) =>
        row.original.publishedAt ? (
          <time
            dateTime={row.original.publishedAt}
            className="whitespace-nowrap text-muted-foreground text-xs"
          >
            {formatDate(row.original.publishedAt, locale)}
          </time>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
      meta: {
        label: t("table.columns.publishedAt"),
        variant: "dateRange",
        icon: CalendarDays,
      },
      enableColumnFilter: true,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={tc("createdAt")} />
      ),
      cell: ({ row }) => (
        <time
          dateTime={row.original.createdAt}
          className="whitespace-nowrap text-muted-foreground text-xs"
        >
          {formatDate(row.original.createdAt, locale)}
        </time>
      ),
      meta: {
        label: tc("createdAt"),
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
              aria-label={t("table.openMenu", { title: row.original.title })}
              variant="ghost"
              className="flex size-8 p-0 data-[state=open]:bg-muted"
              onClick={(event) => event.stopPropagation()}
            >
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-52"
            onClick={(event) => event.stopPropagation()}
          >
            <DropdownMenuItem asChild>
              <Link href={`/admin/pages/${row.original.id}`}>
                <FileText /> {tc("viewDetails")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/admin/pages/${row.original.id}/preview`}>
                <Eye /> {t("table.actions.preview")}
              </Link>
            </DropdownMenuItem>
            {canViewPublicPage(row.original) ? (
              <>
                <DropdownMenuItem asChild>
                  <Link
                    href={publicPagePath(row.original.slug) || "/"}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink /> {t("publicActions.view")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => onCopyPublicUrl(row.original)}
                >
                  <Copy /> {t("table.actions.copyPublicUrl")}
                </DropdownMenuItem>
              </>
            ) : null}
            {canUpdate && row.original.status !== "ARCHIVED" ? (
              <DropdownMenuItem asChild>
                <Link href={`/admin/pages/${row.original.id}/edit`}>
                  <Pencil /> {tc("edit")}
                </Link>
              </DropdownMenuItem>
            ) : null}
            {(canUpdate || canDelete) && <DropdownMenuSeparator />}
            {canUpdate && canPublish && row.original.status === "DRAFT" ? (
              <DropdownMenuItem
                onSelect={() => onStatusChange(row.original, "PUBLISHED")}
              >
                <Send /> {t("table.actions.publish")}
              </DropdownMenuItem>
            ) : null}
            {canUpdate && row.original.status === "PUBLISHED" ? (
              <DropdownMenuItem
                onSelect={() => onStatusChange(row.original, "DRAFT")}
              >
                <RotateCcw /> {t("table.actions.toDraft")}
              </DropdownMenuItem>
            ) : null}
            {canUpdate && row.original.status !== "ARCHIVED" ? (
              <DropdownMenuItem
                onSelect={() => onStatusChange(row.original, "ARCHIVED")}
              >
                <Archive /> {t("table.actions.archive")}
              </DropdownMenuItem>
            ) : null}
            {canUpdate && row.original.status === "ARCHIVED" ? (
              <DropdownMenuItem
                onSelect={() => onStatusChange(row.original, "DRAFT")}
              >
                <RotateCcw /> {t("table.actions.restoreToDraft")}
              </DropdownMenuItem>
            ) : null}
            {canDelete ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setRowAction({ row, variant: "delete" })}
                >
                  <Trash2 /> {tc("delete")}
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
