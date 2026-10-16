"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import { getAdminSupportTicket } from "@/features/admin-support/api/admin-support.client";
import type {
  AdminSupportTableData,
  AdminSupportTicket,
  AdminSupportTicketListItem,
} from "@/features/admin-support/types";
import { useDataTable } from "@/hooks/use-data-table";

import { AdminSupportSummary } from "./admin-support-summary";
import { getAdminSupportTableColumns } from "./admin-support-table-columns";
import { TicketDetailSheet } from "./support-ticket-detail-sheet";

export function AdminSupportTable({ data, pageCount, summary }: AdminSupportTableData) {
  const t = useTranslations("Admin.support");
  const tc = useTranslations("Admin.common");
  const locale = useLocale();
  const router = useRouter();
  const permissions = useAdminPermissions();
  const canReply = permissions.includes("support.reply");
  const canManage = permissions.includes("support.manage");
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<AdminSupportTicket>();
  const [detailLoading, setDetailLoading] = React.useState(false);

  const openTicket = React.useCallback(
    async (ticket: AdminSupportTicketListItem) => {
      setDetailOpen(true);
      setDetail(undefined);
      try {
        setDetailLoading(true);
        setDetail(await getAdminSupportTicket(ticket.id));
      } catch (openError) {
        toast.error(
          openError instanceof Error
            ? openError.message || t("errors.requestFailed")
            : t("errors.openFailed"),
        );
        setDetailOpen(false);
      } finally {
        setDetailLoading(false);
      }
    },
    [t],
  );

  const columns = React.useMemo(
    () => getAdminSupportTableColumns({ t, tc, locale, onOpen: (ticket) => void openTicket(ticket) }),
    [locale, openTicket, t, tc],
  );

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    initialState: {
      sorting: [{ id: "lastMessageAt", desc: true }],
      columnVisibility: { createdAt: false },
      columnPinning: { right: ["actions"] },
    },
    getRowId: (row) => String(row.id),
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <AdminSupportSummary summary={summary} />

      <DataTable table={table} emptyMessage={t("empty.title")}>
        <DataTableToolbar table={table}>
          <DataTableSortList table={table} align="end" />
        </DataTableToolbar>
      </DataTable>

      <TicketDetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        ticket={detail}
        loading={detailLoading}
        canReply={canReply}
        canManage={canManage}
        onUpdated={(updated) => {
          setDetail(updated);
          router.refresh();
        }}
      />
    </div>
  );
}
