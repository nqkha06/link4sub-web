"use client";

import type { ColumnDef, Row } from "@tanstack/react-table";
import {
  CalendarDays,
  CircleDashed,
  Copy,
  Ellipsis,
  Gauge,
  Globe2,
  Pencil,
  Route,
  Star,
  Trash2,
} from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminMonetizationLevel } from "@/features/admin-monetization-levels/types";
import { publicationStatuses } from "@/types/publication-status";

type TranslateFn = (key: string, values?: Record<string, string | number>) => string;

export type MonetizationLevelRowAction = {
  row: Row<AdminMonetizationLevel>;
  variant: "delete";
};

export function getMonetizationLevelsTableColumns({
  locale,
  t,
  tc,
  canUpdate,
  canDelete,
  onEdit,
  onDuplicate,
  setRowAction,
}: {
  locale: string;
  t: TranslateFn;
  tc: TranslateFn;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (id: number) => void;
  onDuplicate: (id: number) => void;
  setRowAction: React.Dispatch<
    React.SetStateAction<MonetizationLevelRowAction | null>
  >;
}): ColumnDef<AdminMonetizationLevel>[] {
  return [
    {
      id: "key",
      accessorKey: "key",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("table.columns.level")} />
      ),
      cell: ({ row }) => (
        <div className="flex min-w-60 items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-md border bg-muted/30">
            <Gauge className="size-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {canUpdate ? (
                <button
                  type="button"
                  className="truncate text-left text-sm font-medium hover:text-primary hover:underline hover:underline-offset-4"
                  onClick={() => onEdit(row.original.id)}
                >
                  {localizedLevelName(row.original, locale)}
                </button>
              ) : (
                <p className="truncate text-sm font-medium">
                  {localizedLevelName(row.original, locale)}
                </p>
              )}
              {row.original.isDefault ? (
                <Badge variant="secondary" className="gap-1">
                  <Star className="size-3 fill-current" />
                  {t("table.default")}
                </Badge>
              ) : null}
            </div>
            <p className="truncate font-mono text-xs text-muted-foreground">
              {row.original.key}
            </p>
          </div>
        </div>
      ),
      meta: {
        label: t("table.columns.nameOrKey"),
        placeholder: t("table.columns.searchPlaceholder"),
        variant: "text",
        icon: Gauge,
      },
      enableColumnFilter: true,
    },
    {
      id: "profit",
      accessorFn: (row) => row.metaData.profitBps,
      header: t("table.columns.profit"),
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">
          {(row.original.metaData.profitBps / 100).toLocaleString(locale, {
            maximumFractionDigits: 2,
          })}
          %
        </span>
      ),
      enableSorting: false,
    },
    {
      id: "stepCount",
      accessorFn: (row) => row.metaData.stepCount,
      header: t("table.columns.stepCount"),
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.metaData.stepCount}</span>
      ),
      enableSorting: false,
    },
    {
      id: "routes",
      accessorFn: (row) => row.routes.length,
      header: t("table.columns.routes"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm">
          <Route className="size-4 text-muted-foreground" />
          <span className="tabular-nums">{row.original.routes.length}</span>
        </div>
      ),
      enableSorting: false,
    },
    {
      id: "rates",
      accessorFn: (row) => row.rates.length,
      header: t("table.columns.rates"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm">
          <Globe2 className="size-4 text-muted-foreground" />
          <span className="tabular-nums">{row.original.rates.length}</span>
        </div>
      ),
      enableSorting: false,
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={tc("status")} />
      ),
      cell: ({ row }) => <StatusBadge status={row.original.status} t={t} />,
      meta: {
        label: tc("status"),
        variant: "multiSelect",
        options: publicationStatuses.map((value) => ({
          label: t(`table.status.${value}`),
          value,
        })),
        icon: CircleDashed,
      },
      enableColumnFilter: true,
    },
    {
      id: "usersCount",
      accessorKey: "usersCount",
      header: t("table.columns.inUse"),
      cell: ({ row }) => (
        <span className="tabular-nums">
          {t("table.usersCount", {
            count: row.original.usersCount.toLocaleString(locale),
          })}
        </span>
      ),
      enableSorting: false,
    },
    {
      id: "updatedAt",
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("table.columns.updatedAt")} />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {new Intl.DateTimeFormat(locale, {
            dateStyle: "short",
            timeStyle: "short",
          }).format(new Date(row.original.updatedAt))}
        </span>
      ),
      meta: {
        label: t("table.columns.updatedAt"),
        variant: "dateRange",
        icon: CalendarDays,
      },
    },
    {
      id: "actions",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) =>
        canUpdate || canDelete ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label={t("table.openMenu", {
                  name: localizedLevelName(row.original, locale),
                })}
                variant="ghost"
                className="flex size-8 p-0 data-[state=open]:bg-muted"
              >
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {canUpdate ? (
                <>
                  <DropdownMenuItem onSelect={() => onEdit(row.original.id)}>
                    <Pencil /> {tc("edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => onDuplicate(row.original.id)}
                  >
                    <Copy /> {t("table.duplicate")}
                  </DropdownMenuItem>
                </>
              ) : null}
              {canUpdate && canDelete ? <DropdownMenuSeparator /> : null}
              {canDelete ? (
                <DropdownMenuItem
                  variant="destructive"
                  disabled={
                    row.original.isDefault || row.original.usersCount > 0
                  }
                  onSelect={() => setRowAction({ row, variant: "delete" })}
                >
                  <Trash2 />
                  {row.original.isDefault
                    ? t("table.cannotDeleteDefault")
                    : row.original.usersCount > 0
                      ? t("table.cannotDeleteInUse")
                      : tc("delete")}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null,
    },
  ];
}

function localizedLevelName(level: AdminMonetizationLevel, locale: string) {
  const normalizedLocale = locale.toLowerCase();
  return (
    level.translations.find(
      (translation) => translation.locale.toLowerCase() === normalizedLocale,
    )?.name ??
    level.translations.find(
      (translation) =>
        translation.locale.toLowerCase() === normalizedLocale.split("-")[0],
    )?.name ??
    level.translations.find((translation) => translation.locale === "vi")
      ?.name ??
    level.translations.find((translation) => translation.locale === "en")
      ?.name ??
    level.displayName ??
    level.key
  );
}

function StatusBadge({
  status,
  t,
}: {
  status: AdminMonetizationLevel["status"];
  t: TranslateFn;
}) {
  if (status === "published") {
    return (
      <Badge className="bg-emerald-600 hover:bg-emerald-600">
        {t("table.status.published")}
      </Badge>
    );
  }
  if (status === "pending") {
    return <Badge variant="secondary">{t("table.status.pending")}</Badge>;
  }
  return <Badge variant="outline">{t("table.status.draft")}</Badge>;
}
