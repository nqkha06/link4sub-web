"use client";

import type { Table } from "@tanstack/react-table";
import { EyeOff, Globe, Trash2, X } from "lucide-react";
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
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import {
  deleteAdminBioPage,
  getAdminBioPage,
  updateAdminBioPageStatus,
} from "@/features/admin-bio-pages/api/admin-bio-pages.client";
import type {
  AdminBioPageListItem,
  AdminBioPagesTableData,
  BioPageStatus,
} from "@/features/admin-bio-pages/types";
import { useDataTable } from "@/hooks/use-data-table";

import { AdminBioPagesSummary } from "./admin-bio-pages-summary";
import { getAdminBioPagesTableColumns } from "./admin-bio-pages-table-columns";
import { BioPageDetailSheet } from "./bio-page-detail-sheet";

export function AdminBioPagesTable({ data, pageCount, summary }: AdminBioPagesTableData) {
  const t = useTranslations("Admin.bioPages");
  const tc = useTranslations("Admin.common");
  const locale = useLocale();
  const router = useRouter();
  const permissions = useAdminPermissions();
  const canManage = permissions.includes("bio-pages.manage");
  const canDelete = permissions.includes("bio-pages.delete");
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<AdminBioPageListItem>();
  const [detailLoading, setDetailLoading] = React.useState(false);

  const openBioPage = React.useCallback(
    async (page: AdminBioPageListItem) => {
      setDetailOpen(true);
      setDetail(undefined);
      setDetailLoading(true);
      try {
        setDetail(await getAdminBioPage(page.id));
      } catch (failure) {
        toast.error(
          failure instanceof Error
            ? failure.message || t("errors.requestFailed")
            : t("errors.openFailed"),
        );
        setDetailOpen(false);
      } finally {
        setDetailLoading(false);
      }
    },
    [t],
  );

  const copyLink = React.useCallback(
    (page: AdminBioPageListItem) => {
      void navigator.clipboard
        .writeText(page.publicUrl)
        .then(() => toast.success(t("bulk.linkCopied")))
        .catch(() => toast.error(t("bulk.copyFailed")));
    },
    [t],
  );

  const columns = React.useMemo(
    () =>
      getAdminBioPagesTableColumns({
        t,
        tc,
        locale,
        onOpen: (page) => void openBioPage(page),
        onCopyLink: copyLink,
      }),
    [copyLink, locale, openBioPage, t, tc],
  );

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    initialState: {
      sorting: [{ id: "updatedAt", desc: true }],
      columnVisibility: { createdAt: false },
      columnPinning: { right: ["actions"] },
    },
    getRowId: (row) => String(row.id),
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <AdminBioPagesSummary summary={summary} />

      <DataTable
        table={table}
        emptyMessage={t("empty.title")}
        actionBar={
          canManage || canDelete ? (
            <BioPagesSelectionActionBar
              table={table}
              canManage={canManage}
              canDelete={canDelete}
              onSuccess={() => {
                table.toggleAllRowsSelected(false);
                router.refresh();
              }}
            />
          ) : undefined
        }
      >
        <DataTableToolbar table={table}>
          <DataTableSortList table={table} align="end" />
        </DataTableToolbar>
      </DataTable>

      <BioPageDetailSheet
        canDelete={canDelete}
        canManage={canManage}
        loading={detailLoading}
        onDeleted={() => {
          setDetailOpen(false);
          setDetail(undefined);
          router.refresh();
        }}
        onOpenChange={setDetailOpen}
        onUpdated={(updated) => {
          setDetail(updated);
          router.refresh();
        }}
        open={detailOpen}
        page={detail}
      />
    </div>
  );
}

function BioPagesSelectionActionBar({
  table,
  canManage,
  canDelete,
  onSuccess,
}: {
  table: Table<AdminBioPageListItem>;
  canManage: boolean;
  canDelete: boolean;
  onSuccess: () => void;
}) {
  const t = useTranslations("Admin.bioPages");
  const tc = useTranslations("Admin.common");
  const [mutating, setMutating] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const selected = table.getFilteredSelectedRowModel().rows.map((row) => row.original);
  const drafts = selected.filter((page) => page.status === "draft");
  const published = selected.filter((page) => page.status === "published");

  // There is no bulk endpoint, so each page goes through the single-item API.
  async function run(
    pages: AdminBioPageListItem[],
    action: (page: AdminBioPageListItem) => Promise<unknown>,
    successKey: "bulk.updated" | "bulk.deleted",
  ) {
    if (!pages.length) return;
    setMutating(true);
    try {
      const results = await Promise.allSettled(pages.map(action));
      const failed = results.filter((result) => result.status === "rejected").length;
      const succeeded = results.length - failed;
      if (succeeded) toast.success(t(successKey, { count: succeeded }));
      if (failed) toast.error(t("bulk.partialFailed", { count: failed }));
      if (succeeded) onSuccess();
    } finally {
      setMutating(false);
    }
  }

  const changeStatus = (pages: AdminBioPageListItem[], status: BioPageStatus) =>
    run(pages, (page) => updateAdminBioPageStatus(page.id, status), "bulk.updated");

  return (
    <>
      <div
        role="toolbar"
        className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card p-2 shadow-sm"
      >
        <span className="px-1 text-sm">
          {t.rich("bulk.selected", {
            count: selected.length,
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </span>
        <div className="flex flex-wrap items-center gap-1">
          {canManage && drafts.length ? (
            <Button variant="ghost" size="sm" disabled={mutating} onClick={() => void changeStatus(drafts, "published")}>
              <Globe /> {t("detail.publish")}
            </Button>
          ) : null}
          {canManage && published.length ? (
            <Button variant="ghost" size="sm" disabled={mutating} onClick={() => void changeStatus(published, "draft")}>
              <EyeOff /> {t("detail.unpublish")}
            </Button>
          ) : null}
          {canDelete ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              disabled={mutating}
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 /> {tc("delete")}
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" disabled={mutating} onClick={() => table.toggleAllRowsSelected(false)}>
            <X /> {t("bulk.clearSelection")}
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("bulk.deleteTitle", { count: selected.length })}</AlertDialogTitle>
            <AlertDialogDescription>{t("bulk.deleteDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => void run(selected, (page) => deleteAdminBioPage(page.id), "bulk.deleted")}
            >
              {tc("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
