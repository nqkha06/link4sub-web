"use client";

import type { Table } from "@tanstack/react-table";
import {
  CircleDollarSign,
  Clock3,
  LoaderCircle,
  RotateCcw,
  TriangleAlert,
  X,
  XCircle,
} from "lucide-react";
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
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import {
  bulkMarkAdminWithdrawalsPaid,
  bulkProcessAdminWithdrawals,
  bulkRejectAdminWithdrawals,
  markAdminWithdrawalPaid,
  processAdminWithdrawal,
} from "@/features/withdrawals/api/withdrawals.client";
import { getAdminWithdrawalsTableColumns } from "@/features/withdrawals/components/admin-withdrawals-table-columns";
import { EditWithdrawalPaymentInfoDialog } from "@/features/withdrawals/components/edit-withdrawal-payment-info-dialog";
import { RejectWithdrawalDialog } from "@/features/withdrawals/components/reject-withdrawal-dialog";
import { WithdrawalDetailSheet } from "@/features/withdrawals/components/withdrawal-detail-sheet";
import {
  useWithdrawalExtraFilters,
  WithdrawalExtraFilters,
} from "@/features/withdrawals/components/withdrawal-extra-filters";
import type {
  AdminWithdrawal,
  AdminWithdrawalFilterOptions,
  AdminWithdrawalsTableData,
  BulkWithdrawalActionResult,
  WithdrawalStatus,
} from "@/features/withdrawals/types";
import { useDataTable } from "@/hooks/use-data-table";

export function AdminWithdrawalsTable({
  data,
  pageCount,
  filteredUserId,
  filterOptions,
}: AdminWithdrawalsTableData & {
  filteredUserId: number | null;
  filterOptions: AdminWithdrawalFilterOptions;
}) {
  const t = useTranslations("Admin.withdrawals");
  const tc = useTranslations("Admin.common");
  const locale = useLocale();
  const permissions = useAdminPermissions();
  const extraFilters = useWithdrawalExtraFilters();
  const canProcess = permissions.includes("withdrawals.process");
  const router = useRouter();
  const [busyId, setBusyId] = React.useState<number | null>(null);
  const [detailTarget, setDetailTarget] =
    React.useState<AdminWithdrawal | null>(null);
  const [rejectTarget, setRejectTarget] =
    React.useState<AdminWithdrawal | null>(null);
  const [editTarget, setEditTarget] = React.useState<AdminWithdrawal | null>(
    null,
  );

  const refresh = React.useCallback(
    (table?: Table<AdminWithdrawal>) => {
      table?.toggleAllRowsSelected(false);
      router.refresh();
    },
    [router],
  );

  const changeStatus = React.useCallback(
    async (withdrawal: AdminWithdrawal, status: WithdrawalStatus) => {
      if (status === withdrawal.status) return;
      if (status === "rejected") {
        setRejectTarget(withdrawal);
        return;
      }

      const operation =
        status === "processing"
          ? processAdminWithdrawal
          : status === "paid"
            ? markAdminWithdrawalPaid
            : null;

      if (!operation) return;

      try {
        setBusyId(withdrawal.id);
        await operation(withdrawal.id);
        toast.success(
          status === "processing"
            ? t("toast.processed")
            : t("toast.paid"),
        );
        refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : t("toast.statusError"),
        );
      } finally {
        setBusyId(null);
      }
    },
    [refresh, t],
  );

  const columns = React.useMemo(
    () =>
      getAdminWithdrawalsTableColumns({
        t,
        tc,
        locale,
        canProcess,
        busyId,
        onStatusChange: (withdrawal, status) => {
          void changeStatus(withdrawal, status);
        },
        onView: setDetailTarget,
        onReject: setRejectTarget,
        onEditPaymentInfo: setEditTarget,
      }),
    [busyId, canProcess, changeStatus, t, tc, locale],
  );

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    enableRowSelection: canProcess,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    getRowId: (row) => String(row.id),
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      {filteredUserId ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
          <p className="text-sm">
            {t("table.filteredUser", { id: filteredUserId })}
          </p>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/withdrawals">
              <X /> {t("table.clearUserFilter")}
            </Link>
          </Button>
        </div>
      ) : null}

      <DataTable
        table={table}
        emptyMessage={t("table.empty")}
        actionBar={
          canProcess ? (
            <WithdrawalsSelectionActionBar
              table={table}
              onSuccess={() => refresh(table)}
            />
          ) : undefined
        }
      >
        <DataTableToolbar
          table={table}
          extraFilters={
            <WithdrawalExtraFilters
              filters={extraFilters}
              paymentMethods={filterOptions.paymentMethods}
              currency={data[0]?.currency}
            />
          }
          extraFiltersActive={extraFilters.activeCount > 0}
          onResetExtraFilters={extraFilters.reset}
        >
          <DataTableSortList table={table} align="end" />
        </DataTableToolbar>
      </DataTable>

      {detailTarget ? (
        <WithdrawalDetailSheet
          key={detailTarget.id}
          withdrawal={detailTarget}
          canEdit={canProcess}
          onEdit={(withdrawal) => {
            setDetailTarget(null);
            setEditTarget(withdrawal);
          }}
          onOpenChange={(open) => {
            if (!open) setDetailTarget(null);
          }}
        />
      ) : null}
      {rejectTarget ? (
        <RejectWithdrawalDialog
          key={rejectTarget.id}
          withdrawal={rejectTarget}
          onOpenChange={(open) => {
            if (!open) setRejectTarget(null);
          }}
          onSuccess={refresh}
        />
      ) : null}
      {editTarget ? (
        <EditWithdrawalPaymentInfoDialog
          key={editTarget.id}
          withdrawal={editTarget}
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
          onSuccess={() => {
            setEditTarget(null);
            refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function WithdrawalsSelectionActionBar({
  table,
  onSuccess,
}: {
  table: Table<AdminWithdrawal>;
  onSuccess: () => void;
}) {
  const t = useTranslations("Admin.withdrawals.bulk");
  const [mutating, setMutating] = React.useState(false);
  const [bulkRejectOpen, setBulkRejectOpen] = React.useState(false);
  const selected = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original);

  async function run(
    action: (ids: number[]) => Promise<BulkWithdrawalActionResult>,
    successKey: "processed" | "paid" | "rejected",
  ) {
    setMutating(true);
    try {
      const result = await action(selected.map((item) => item.id));
      if (result.succeeded > 0) {
        toast.success(t(`success.${successKey}`, { count: result.succeeded }));
      }
      if (result.failed.length > 0) {
        toast.error(
          t("failed", {
            count: result.failed.length,
            ids: result.failed.map((item) => item.id).join(", #"),
          }),
        );
      }
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("error"),
      );
    } finally {
      setMutating(false);
    }
  }

  return (
    <>
      <div
        role="toolbar"
        className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card p-2 shadow-sm"
      >
        <span className="px-1 text-sm">
          {t.rich("selected", {
            count: selected.length,
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </span>
        <div className="flex flex-wrap items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={mutating}
            onClick={() =>
              void run(bulkProcessAdminWithdrawals, "processed")
            }
          >
            <Clock3 /> {t("process")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={mutating}
            onClick={() =>
              void run(bulkMarkAdminWithdrawalsPaid, "paid")
            }
          >
            <CircleDollarSign /> {t("markPaid")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled={mutating}
            onClick={() => setBulkRejectOpen(true)}
          >
            <XCircle /> {t("reject")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={mutating}
            onClick={() => table.toggleAllRowsSelected(false)}
          >
            <X /> {t("clear")}
          </Button>
        </div>
      </div>
      {bulkRejectOpen ? (
        <BulkRejectWithdrawalDialog
          count={selected.length}
          submitting={mutating}
          onOpenChange={setBulkRejectOpen}
          onConfirm={async (reason) => {
            await run(
              (ids) => bulkRejectAdminWithdrawals(ids, reason),
              "rejected",
            );
            setBulkRejectOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function BulkRejectWithdrawalDialog({
  count,
  submitting,
  onOpenChange,
  onConfirm,
}: {
  count: number;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const t = useTranslations("Admin.withdrawals.bulkReject");
  const tc = useTranslations("Admin.common");
  const tr = useTranslations("Admin.withdrawals.reject");
  const [reason, setReason] = React.useState("");

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!submitting) onOpenChange(open);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <TriangleAlert />
          </AlertDialogMedia>
          <AlertDialogTitle>{t("title", { count })}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("description")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <label htmlFor="bulk-reject-reason" className="text-sm font-medium">
            {tr("reasonLabel")}
          </label>
          <Textarea
            id="bulk-reject-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t("reasonPlaceholder")}
            maxLength={500}
            disabled={submitting}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            {tr("minChars", { count: reason.length })}
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>
            {tc("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={submitting || reason.trim().length < 3}
            onClick={(event) => {
              event.preventDefault();
              void onConfirm(reason.trim());
            }}
          >
            {submitting ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <RotateCcw />
            )}
            {tr("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
