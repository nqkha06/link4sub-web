"use client";

import { Files, HardDrive, RotateCcw, Trash2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
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
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import {
  downloadAdminMemberFile,
  purgeAdminMemberFiles,
  restoreAdminMemberFiles,
  trashAdminMemberFiles,
} from "@/features/admin-member-files/api/admin-member-files.client";
import { AdminMemberFilePreviewSheet } from "@/features/admin-member-files/components/admin-member-file-preview-sheet";
import type {
  AdminMemberFile,
  AdminMemberFilesTableData,
} from "@/features/admin-member-files/types";
import { useDataTable } from "@/hooks/use-data-table";

import {
  formatFileSize,
  getAdminMemberFilesTableColumns,
  type MemberFileAction,
} from "./admin-member-files-table-columns";

type PendingConfirm = { action: "trash" | "purge"; files: AdminMemberFile[] };

export function AdminMemberFilesTable({
  data,
  pageCount,
  summary,
  filteredUserId,
}: AdminMemberFilesTableData & { filteredUserId: number | null }) {
  const t = useTranslations("Admin.memberFiles");
  const tc = useTranslations("Admin.common");
  const locale = useLocale();
  const router = useRouter();
  const canDelete = useAdminPermissions().includes("member-files.delete");
  const [confirm, setConfirm] = React.useState<PendingConfirm | null>(null);
  const [previewFile, setPreviewFile] = React.useState<AdminMemberFile | null>(
    null,
  );
  const [mutating, setMutating] = React.useState(false);
  // Bumped after a successful mutation to clear the row selection.
  const [selectionReset, setSelectionReset] = React.useState(0);

  const mutate = React.useCallback(
    async (action: "trash" | "restore" | "purge", files: AdminMemberFile[]) => {
      if (!files.length) return;
      setMutating(true);
      try {
        const ids = files.map((file) => file.id);
        const result =
          action === "trash"
            ? await trashAdminMemberFiles(ids)
            : action === "restore"
              ? await restoreAdminMemberFiles(ids)
              : await purgeAdminMemberFiles(ids);
        toast.success(t(`toast.${action}`, { count: result.affected }));
        setSelectionReset((value) => value + 1);
        router.refresh();
      } catch (failure) {
        toast.error(failure instanceof Error && failure.message ? failure.message : t("toast.error"));
      } finally {
        setMutating(false);
        setConfirm(null);
      }
    },
    [router, t],
  );

  const handleAction = React.useCallback(
    (action: MemberFileAction, file: AdminMemberFile) => {
      if (action === "preview") {
        setPreviewFile(file);
      } else if (action === "download") {
        void downloadAdminMemberFile(file.id, file.name).catch(() =>
          toast.error(t("toast.downloadError")),
        );
      } else if (action === "restore") {
        void mutate("restore", [file]);
      } else {
        setConfirm({ action, files: [file] });
      }
    },
    [mutate, t],
  );

  const columns = React.useMemo(
    () => getAdminMemberFilesTableColumns({ t, tc, locale, canDelete, onAction: handleAction }),
    [canDelete, handleAction, locale, t, tc],
  );

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      pagination: { pageIndex: 0, pageSize: 20 },
      columnVisibility: { state: false },
      columnPinning: { right: ["actions"] },
    },
    getRowId: (row) => String(row.id),
    shallow: false,
    clearOnDefault: true,
  });
  const handledReset = React.useRef(0);
  React.useEffect(() => {
    if (selectionReset === handledReset.current) return;
    handledReset.current = selectionReset;
    table.toggleAllRowsSelected(false);
  }, [selectionReset, table]);

  const selected = table.getFilteredSelectedRowModel().rows.map((row) => row.original);
  const selectedActive = selected.filter((file) => !file.deletedAt);
  const selectedTrashed = selected.filter((file) => Boolean(file.deletedAt));
  const confirmBytes = confirm?.files.reduce((sum, file) => sum + file.size, 0) ?? 0;
  const confirmUsage = confirm?.files.reduce((sum, file) => sum + file.usageCount, 0) ?? 0;

  const stats = [
    { key: "activeFiles", icon: Files, value: new Intl.NumberFormat(locale).format(summary.activeFiles) },
    { key: "activeBytes", icon: HardDrive, value: formatFileSize(summary.activeBytes) },
    { key: "trashedFiles", icon: Trash2, value: new Intl.NumberFormat(locale).format(summary.trashedFiles) },
    { key: "trashedBytes", icon: HardDrive, value: formatFileSize(summary.trashedBytes) },
  ] as const;

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      {filteredUserId ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
          <p className="text-sm">{t("table.filteredUser", { id: filteredUserId })}</p>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/files">
              <X /> {t("table.clearUserFilter")}
            </Link>
          </Button>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ key, icon: Icon, value }) => (
          <Card className="gap-0 py-0 shadow-none" key={key}>
            <CardContent className="flex items-center gap-4 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">{t(`summary.${key}`)}</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DataTable
        table={table}
        emptyMessage={t("table.empty")}
        actionBar={
          canDelete ? (
            <div
              role="toolbar"
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card p-2 shadow-sm"
            >
              <span className="px-1 text-sm">
                {t.rich("bulk.selected", {
                  count: selected.length,
                  size: formatFileSize(selected.reduce((sum, file) => sum + file.size, 0)),
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {selectedTrashed.length ? (
                  <Button variant="ghost" size="sm" disabled={mutating} onClick={() => void mutate("restore", selectedTrashed)}>
                    <RotateCcw /> {t("actions.restore")}
                  </Button>
                ) : null}
                {selectedActive.length ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={mutating}
                    onClick={() => setConfirm({ action: "trash", files: selectedActive })}
                  >
                    <Trash2 /> {t("actions.trash")}
                  </Button>
                ) : null}
                {selectedTrashed.length ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={mutating}
                    onClick={() => setConfirm({ action: "purge", files: selectedTrashed })}
                  >
                    <Trash2 /> {t("actions.purge")}
                  </Button>
                ) : null}
                <Button variant="ghost" size="sm" disabled={mutating} onClick={() => table.toggleAllRowsSelected(false)}>
                  <X /> {t("bulk.clearSelection")}
                </Button>
              </div>
            </div>
          ) : undefined
        }
      >
        <DataTableToolbar table={table}>
          <DataTableSortList table={table} align="end" />
        </DataTableToolbar>
      </DataTable>

      <AdminMemberFilePreviewSheet
        file={previewFile}
        open={Boolean(previewFile)}
        onOpenChange={(open) => {
          if (!open) setPreviewFile(null);
        }}
        onDownloadError={() => toast.error(t("toast.downloadError"))}
      />

      <AlertDialog open={Boolean(confirm)} onOpenChange={(open) => (!open && !mutating ? setConfirm(null) : undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm ? t(`confirm.${confirm.action}.title`, { count: confirm.files.length }) : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm
                ? t(`confirm.${confirm.action}.description`, { size: formatFileSize(confirmBytes) })
                : ""}
              {confirm && confirmUsage > 0 ? ` ${t("confirm.usageWarning", { count: confirmUsage })}` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutating}>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={mutating}
              onClick={(event) => {
                event.preventDefault();
                if (confirm) void mutate(confirm.action, confirm.files);
              }}
            >
              {confirm ? t(`actions.${confirm.action}`) : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
