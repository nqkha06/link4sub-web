"use client";

import type { Table } from "@tanstack/react-table";
import { Loader2, RefreshCw, Trash2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import {
  deleteAdminLinkReports,
  updateAdminLinkReportsStatus,
} from "@/features/admin-link-reports/api/admin-link-reports.client";
import { getAdminLinkReportsTableColumns } from "@/features/admin-link-reports/components/admin-link-reports-table-columns";
import { linkReportStatusIcons } from "@/features/admin-link-reports/components/link-report-badges";
import { LinkReportDetailSheet } from "@/features/admin-link-reports/components/link-report-detail-sheet";
import { linkReportStatuses } from "@/features/admin-link-reports/query/link-reports-search-params";
import type {
  AdminLinkReportListItem,
  AdminLinkReportsTableData,
  LinkReportStatus,
} from "@/features/admin-link-reports/types";
import { useDataTable } from "@/hooks/use-data-table";

export function AdminLinkReportsTable({
  data,
  pageCount,
  summary,
}: AdminLinkReportsTableData) {
  const t = useTranslations("Admin.linkReports");
  const tc = useTranslations("Admin.common");
  const locale = useLocale();
  const router = useRouter();
  const permissions = useAdminPermissions();
  const canManage = permissions.includes("link-reports.manage");
  const canDelete = permissions.includes("link-reports.delete");
  const [busy, setBusy] = React.useState(false);
  const [detailId, setDetailId] = React.useState<number | null>(null);
  const [deleting, setDeleting] = React.useState<AdminLinkReportListItem[]>([]);
  const refresh = React.useCallback(() => router.refresh(), [router]);

  const changeStatus = React.useCallback(
    async (reports: AdminLinkReportListItem[], status: LinkReportStatus) => {
      setBusy(true);
      try {
        const result = await updateAdminLinkReportsStatus(
          reports.map((report) => report.id),
          status,
        );
        toast.success(t("table.bulkUpdated", { count: result.updated }));
        refresh();
        return true;
      } catch (failure) {
        toast.error(
          failure instanceof Error
            ? failure.message || t("errors.requestFailed")
            : t("errors.updateFailed"),
        );
        return false;
      } finally {
        setBusy(false);
      }
    },
    [refresh, t],
  );

  const columns = React.useMemo(
    () =>
      getAdminLinkReportsTableColumns({
        t,
        tc,
        locale,
        canManage,
        canDelete,
        busy,
        onView: (report) => setDetailId(report.id),
        onStatusChange: (reports, status) => void changeStatus(reports, status),
        onDelete: setDeleting,
      }),
    [busy, canDelete, canManage, changeStatus, locale, t, tc],
  );

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      columnVisibility: { updatedAt: false },
      columnPinning: { right: ["actions"] },
    },
    getRowId: (row) => String(row.id),
    shallow: false,
    clearOnDefault: true,
  });

  const closeDetail = React.useCallback((open: boolean) => {
    if (!open) setDetailId(null);
  }, []);

  async function confirmDelete() {
    if (!deleting.length) return;
    setBusy(true);
    try {
      const result = await deleteAdminLinkReports(
        deleting.map((report) => report.id),
      );
      toast.success(t("table.bulkDeleted", { count: result.deleted }));
      setDeleting([]);
      table.toggleAllRowsSelected(false);
      refresh();
    } catch (failure) {
      toast.error(
        failure instanceof Error
          ? failure.message || t("errors.requestFailed")
          : t("errors.deleteFailed"),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {linkReportStatuses.map((status) => {
          const Icon = linkReportStatusIcons[status];
          return (
            <Card className="gap-0 py-0 shadow-none" key={status}>
              <CardContent className="flex items-center gap-4 p-4">
                <span className="grid size-10 place-items-center rounded-lg bg-muted text-primary">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t(`status.${status}`)}
                  </p>
                  <p className="mt-1 text-xl font-semibold tabular-nums">
                    {summary[status] ?? 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <DataTable
        table={table}
        emptyMessage={t("empty.title")}
        actionBar={
          <LinkReportsSelectionActionBar
            table={table}
            busy={busy}
            canManage={canManage}
            canDelete={canDelete}
            onDelete={setDeleting}
            onStatusChange={(reports, status) =>
              void changeStatus(reports, status).then((updated) => {
                if (updated) table.toggleAllRowsSelected(false);
              })
            }
          />
        }
      >
        <DataTableToolbar table={table}>
          <DataTableSortList table={table} align="end" />
        </DataTableToolbar>
      </DataTable>

      <LinkReportDetailSheet
        reportId={detailId}
        canDelete={canDelete}
        canManage={canManage}
        onOpenChange={closeDetail}
        onChanged={refresh}
      />

      <AlertDialog
        open={deleting.length > 0}
        onOpenChange={(open) => !open && !busy && setDeleting([])}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("delete.bulkTitle", { count: deleting.length })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={busy}
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              {busy ? <Loader2 className="animate-spin" /> : <Trash2 />}
              {busy ? t("delete.deleting") : tc("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function LinkReportsSelectionActionBar({
  table,
  busy,
  canManage,
  canDelete,
  onDelete,
  onStatusChange,
}: {
  table: Table<AdminLinkReportListItem>;
  busy: boolean;
  canManage: boolean;
  canDelete: boolean;
  onDelete: (reports: AdminLinkReportListItem[]) => void;
  onStatusChange: (
    reports: AdminLinkReportListItem[],
    status: LinkReportStatus,
  ) => void;
}) {
  const t = useTranslations("Admin.linkReports");
  const tc = useTranslations("Admin.common");
  const selected = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original);

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
        {canManage ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                {t("table.changeStatus")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {linkReportStatuses.map((status) => {
                const Icon = linkReportStatusIcons[status];
                return (
                  <DropdownMenuItem
                    key={status}
                    onSelect={() => onStatusChange(selected, status)}
                  >
                    <Icon /> {t(`status.${status}`)}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        {canDelete ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled={busy}
            onClick={() => onDelete(selected)}
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
  );
}
