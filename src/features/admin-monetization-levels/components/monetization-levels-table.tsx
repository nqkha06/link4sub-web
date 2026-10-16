"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar";
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import { DeleteMonetizationLevelDialog } from "@/features/admin-monetization-levels/components/delete-monetization-level-dialog";
import {
  getMonetizationLevelsTableColumns,
  type MonetizationLevelRowAction,
} from "@/features/admin-monetization-levels/components/monetization-levels-table-columns";
import type { MonetizationLevelsTableData } from "@/features/admin-monetization-levels/types";
import { useDataTable } from "@/hooks/use-data-table";

export function MonetizationLevelsTable({
  data,
  pageCount,
}: MonetizationLevelsTableData) {
  const permissions = useAdminPermissions();
  const locale = useLocale();
  const t = useTranslations("Admin.monetizationLevels");
  const tc = useTranslations("Admin.common");
  const canUpdate = permissions.includes("monetization-levels.update");
  const canDelete = permissions.includes("monetization-levels.delete");
  const router = useRouter();
  const [rowAction, setRowAction] =
    React.useState<MonetizationLevelRowAction | null>(null);
  const columns = React.useMemo(
    () =>
      getMonetizationLevelsTableColumns({
        locale,
        t,
        tc,
        canUpdate,
        canDelete,
        onEdit: (id) => router.push(`/admin/monetization-levels/${id}/edit`),
        onDuplicate: (id) =>
          router.push(`/admin/monetization-levels/create?from=${id}`),
        setRowAction,
      }),
    [canDelete, canUpdate, locale, router, t, tc],
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
  const refresh = React.useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
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

      <DeleteMonetizationLevelDialog
        level={rowAction?.row.original ?? null}
        onOpenChange={() => setRowAction(null)}
        onSuccess={refresh}
      />
    </div>
  );
}
