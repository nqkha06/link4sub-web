"use client";

import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { useDataTable } from "@/hooks/use-data-table";

import type { AccessLogsTableQuery } from "../query/access-logs-search-params";
import type { AdminAccessLog, AdminAccessLogsResponse } from "../types";
import { AccessLogDetailSheet } from "./access-log-detail-sheet";
import { AccessLogsFilters } from "./access-logs-filters";
import { getAccessLogsColumns } from "./access-logs-table-columns";

export function AccessLogsTable({
  result,
  query,
}: {
  result: AdminAccessLogsResponse;
  query: AccessLogsTableQuery;
}) {
  const t = useTranslations("Admin.accessLogs");
  const tc = useTranslations("Admin.common");
  const locale = useLocale();
  const [selected, setSelected] = React.useState<AdminAccessLog | null>(null);
  const columns = React.useMemo(
    () => getAccessLogsColumns({ onView: setSelected, t, tc, locale }),
    [t, tc, locale],
  );
  const { table } = useDataTable({
    data: result.data,
    columns,
    pageCount: result.meta.totalPages,
    initialState: {
      columnVisibility: { country: false, deviceLabel: false, riskScore: false },
      columnPinning: { right: ["actions"] },
    },
    getRowId: (row) => String(row.id),
    shallow: false,
    clearOnDefault: true,
  });
  return <div className="space-y-4">
    <AccessLogsFilters query={query} />
    <div className="flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{t("table.total", { count: new Intl.NumberFormat(locale).format(result.meta.total) })}</p><DataTableViewOptions table={table} /></div>
    <DataTable table={table} emptyMessage={t("table.empty")} />
    {selected ? <AccessLogDetailSheet log={selected} onOpenChange={(open) => !open && setSelected(null)} /> : null}
  </div>;
}
