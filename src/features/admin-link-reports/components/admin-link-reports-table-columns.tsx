"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  CalendarDays,
  CircleDashed,
  Ellipsis,
  Eye,
  Flag,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LinkReportReasonBadge,
  LinkReportStatusBadge,
  formatLinkReportDate,
  linkReportStatusIcons,
} from "@/features/admin-link-reports/components/link-report-badges";
import {
  linkReportReasons,
  linkReportStatuses,
} from "@/features/admin-link-reports/query/link-reports-search-params";
import type {
  AdminLinkReportListItem,
  LinkReportStatus,
} from "@/features/admin-link-reports/types";

type Translator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export function getAdminLinkReportsTableColumns({
  t,
  tc,
  locale,
  canManage,
  canDelete,
  busy,
  onView,
  onStatusChange,
  onDelete,
}: {
  /** Translator scoped to `Admin.linkReports`. */
  t: Translator;
  /** Translator scoped to `Admin.common`. */
  tc: Translator;
  locale: string;
  canManage: boolean;
  canDelete: boolean;
  busy: boolean;
  onView: (report: AdminLinkReportListItem) => void;
  onStatusChange: (
    reports: AdminLinkReportListItem[],
    status: LinkReportStatus,
  ) => void;
  onDelete: (reports: AdminLinkReportListItem[]) => void;
}): ColumnDef<AdminLinkReportListItem>[] {
  const selectable = canManage || canDelete;
  return [
    ...(selectable
      ? [
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
                aria-label={t("table.selectRow", {
                  reference: row.original.reference,
                })}
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
              />
            ),
            enableHiding: false,
            enableSorting: false,
            size: 40,
          } satisfies ColumnDef<AdminLinkReportListItem>,
        ]
      : []),
    {
      id: "report",
      accessorFn: (row) => `${row.reference} ${row.reportedUrl}`,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("table.columns.report")} />
      ),
      cell: ({ row }) => (
        <div className="min-w-60 max-w-sm">
          <button
            type="button"
            className="font-mono text-xs text-muted-foreground hover:text-foreground hover:underline"
            onClick={() => onView(row.original)}
          >
            {row.original.reference}
          </button>
          <p className="mt-0.5 truncate text-sm font-medium">
            {row.original.reportedUrl}
          </p>
        </div>
      ),
      meta: {
        label: t("table.columns.report"),
        placeholder: t("filters.searchPlaceholder"),
        variant: "text",
        icon: Search,
      },
      enableColumnFilter: true,
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "email",
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("table.columns.sender")} />
      ),
      cell: ({ row }) => (
        <span className="block max-w-56 truncate text-sm">
          {row.original.email}
        </span>
      ),
      meta: { label: t("table.columns.sender") },
    },
    {
      id: "reason",
      accessorKey: "reason",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("table.columns.reason")} />
      ),
      cell: ({ row }) => <LinkReportReasonBadge reason={row.original.reason} />,
      meta: {
        label: t("table.columns.reason"),
        variant: "multiSelect",
        options: linkReportReasons.map((value) => ({
          value,
          label: t(`reason.${value}`),
        })),
        icon: Flag,
      },
      enableColumnFilter: true,
      enableSorting: false,
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={tc("status")} />
      ),
      cell: ({ row }) => <LinkReportStatusBadge status={row.original.status} />,
      meta: {
        label: tc("status"),
        variant: "multiSelect",
        options: linkReportStatuses.map((value) => ({
          value,
          label: t(`status.${value}`),
        })),
        icon: CircleDashed,
      },
      enableColumnFilter: true,
    },
    {
      id: "reviewer",
      accessorFn: (row) => row.reviewedBy?.name ?? "",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("table.columns.reviewer")} />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {row.original.reviewedBy?.name || t("table.noReviewer")}
        </span>
      ),
      meta: { label: t("table.columns.reviewer") },
      enableSorting: false,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={tc("createdAt")} />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
          {formatLinkReportDate(row.original.createdAt, locale)}
        </span>
      ),
      meta: { label: tc("createdAt"), variant: "dateRange", icon: CalendarDays },
      enableColumnFilter: true,
    },
    {
      id: "updatedAt",
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={tc("updatedAt")} />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
          {formatLinkReportDate(row.original.updatedAt, locale)}
        </span>
      ),
      meta: { label: tc("updatedAt") },
    },
    {
      id: "actions",
      header: tc("actions"),
      enableHiding: false,
      enableSorting: false,
      size: 72,
      cell: ({ row }) => {
        const report = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label={t("table.openMenu", { reference: report.reference })}
                variant="ghost"
                className="flex size-8 p-0 data-[state=open]:bg-muted"
              >
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onSelect={() => onView(report)}>
                <Eye /> {t("table.view")}
              </DropdownMenuItem>
              {canManage ? (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger disabled={busy}>
                    <RefreshCw /> {t("table.changeStatus")}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {linkReportStatuses
                      .filter((status) => status !== report.status)
                      .map((status) => {
                        const Icon = linkReportStatusIcons[status];
                        return (
                          <DropdownMenuItem
                            key={status}
                            onSelect={() => onStatusChange([report], status)}
                          >
                            <Icon /> {t(`status.${status}`)}
                          </DropdownMenuItem>
                        );
                      })}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ) : null}
              {canDelete ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => onDelete([report])}
                  >
                    <Trash2 /> {tc("delete")}
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
