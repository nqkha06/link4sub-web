"use client";

import { CheckCircle2, Layers3, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar";
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import { DeleteLoyaltyTierDialog } from "@/features/admin-loyalty-tiers/components/delete-loyalty-tier-dialog";
import {
  getLoyaltyTiersTableColumns,
  type LoyaltyTierRowAction,
} from "@/features/admin-loyalty-tiers/components/loyalty-tiers-table-columns";
import type { LoyaltyTiersTableData } from "@/features/admin-loyalty-tiers/types";
import { useDataTable } from "@/hooks/use-data-table";

export function LoyaltyTiersTable({
  data,
  pageCount,
  total,
  summary,
}: LoyaltyTiersTableData) {
  const t = useTranslations("Admin.loyaltyTiers");
  const tc = useTranslations("Admin.common");
  const permissions = useAdminPermissions();
  const locale = useLocale();
  const router = useRouter();
  const canCreate = permissions.includes("loyalty-tiers.create");
  const canUpdate = permissions.includes("loyalty-tiers.update");
  const canDelete = permissions.includes("loyalty-tiers.delete");
  const [rowAction, setRowAction] =
    React.useState<LoyaltyTierRowAction | null>(null);
  const columns = React.useMemo(
    () =>
      getLoyaltyTiersTableColumns({
        t,
        tc,
        locale,
        canCreate,
        canUpdate,
        canDelete,
        onEdit: (id) => router.push(`/admin/loyalty/${id}/edit`),
        onDuplicate: (id) => router.push(`/admin/loyalty/create?from=${id}`),
        setRowAction,
      }),
    [canCreate, canDelete, canUpdate, locale, router, t, tc],
  );
  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data,
    columns,
    pageCount,
    enableAdvancedFilter: true,
    initialState: {
      sorting: [{ id: "sortOrder", desc: false }],
      columnPinning: { right: ["actions"] },
    },
    getRowId: (row) => String(row.id),
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={Layers3}
          label={t("summary.total")}
          value={total}
          description={t("summary.totalHint")}
          locale={locale}
        />
        <SummaryCard
          icon={CheckCircle2}
          label={t("summary.published")}
          value={summary.publishedTiers}
          description={t("summary.publishedHint")}
          locale={locale}
        />
        <SummaryCard
          icon={TrendingUp}
          label={t("summary.highest")}
          value={summary.highestThreshold}
          description={t("summary.highestHint", {
            count: summary.configuredBenefits.toLocaleString(locale),
          })}
          locale={locale}
        />
      </div>

      <DataTable table={table}>
        <DataTableAdvancedToolbar table={table}>
          <DataTableFilterList
            table={table}
            shallow={shallow}
            debounceMs={debounceMs}
            throttleMs={throttleMs}
            align="start"
          />
          <DataTableSortList table={table} align="start" />
        </DataTableAdvancedToolbar>
      </DataTable>

      <DeleteLoyaltyTierDialog
        tier={rowAction?.row.original ?? null}
        onOpenChange={() => setRowAction(null)}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
  locale,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  description: string;
  locale: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] tabular-nums">
        {value.toLocaleString(locale)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
