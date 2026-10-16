"use client";

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
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import {
  deleteAdminAnnouncement,
  duplicateAdminAnnouncement,
  pauseAdminAnnouncement,
  publishAdminAnnouncement,
} from "@/features/announcements/api/announcements.client";
import type { AdminAnnouncementsTableData } from "@/features/announcements/api/announcements.server";
import {
  getAdminAnnouncementsTableColumns,
  type AnnouncementRowAction,
} from "@/features/announcements/components/admin-announcements-table-columns";
import type { AdminAnnouncement } from "@/features/announcements/types";
import { useDataTable } from "@/hooks/use-data-table";

export function AdminAnnouncementsTable({ data, pageCount }: AdminAnnouncementsTableData) {
  const t = useTranslations("Admin.announcements");
  const tc = useTranslations("Admin.common");
  const locale = useLocale();
  const router = useRouter();
  const permissions = useAdminPermissions();
  const canCreate = permissions.includes("announcements.create");
  const canUpdate = permissions.includes("announcements.update");
  const canDelete = permissions.includes("announcements.delete");
  const canPublish = permissions.includes("announcements.publish");
  const [busyId, setBusyId] = React.useState<number | null>(null);
  const [deleting, setDeleting] = React.useState<AdminAnnouncement | null>(null);

  const runAction = React.useCallback(
    async (item: AdminAnnouncement, action: AnnouncementRowAction) => {
      setBusyId(item.id);
      try {
        if (action === "publish") await publishAdminAnnouncement(item.id);
        else if (action === "pause") await pauseAdminAnnouncement(item.id);
        else await duplicateAdminAnnouncement(item.id);
        toast.success(
          action === "publish" ? t("toast.published") : action === "pause" ? t("toast.paused") : t("toast.duplicated"),
        );
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("toast.actionError"));
      } finally {
        setBusyId(null);
      }
    },
    [router, t],
  );

  const columns = React.useMemo(
    () =>
      getAdminAnnouncementsTableColumns({
        t,
        tc,
        locale,
        canCreate,
        canUpdate,
        canDelete,
        canPublish,
        busyId,
        onAction: (item, action) => void runAction(item, action),
        onDelete: setDeleting,
      }),
    [busyId, canCreate, canDelete, canPublish, canUpdate, locale, runAction, t, tc],
  );

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    getRowId: (row) => String(row.id),
    shallow: false,
    clearOnDefault: true,
  });

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteAdminAnnouncement(deleting.id);
      toast.success(t("list.delete.deleted"));
      setDeleting(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("list.delete.error"));
    }
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <DataTable table={table} emptyMessage={t("list.empty")}>
        <DataTableToolbar table={table}>
          <DataTableSortList table={table} align="end" />
        </DataTableToolbar>
      </DataTable>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("list.delete.title", { title: deleting?.title ?? "" })}</AlertDialogTitle>
            <AlertDialogDescription>{t("list.delete.description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void confirmDelete()}>
              {t("list.delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
