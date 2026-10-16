"use client";

import type { ColumnDef, Row } from "@tanstack/react-table";
import {
  CalendarDays,
  Check,
  CircleDashed,
  Copy,
  Ellipsis,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";

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
import { LoyaltyTierIcon } from "@/features/admin-loyalty-tiers/components/loyalty-tier-icon";
import type { AdminLoyaltyTier } from "@/features/admin-loyalty-tiers/types";

export type LoyaltyTierRowAction = {
  row: Row<AdminLoyaltyTier>;
  variant: "delete";
};

type Translator = ReturnType<typeof useTranslations>;

const STATUS_KEYS = ["draft", "pending", "published"] as const;

export function getLoyaltyTiersTableColumns({
  t,
  tc,
  locale,
  canUpdate,
  canCreate,
  canDelete,
  onEdit,
  onDuplicate,
  setRowAction,
}: {
  t: Translator;
  tc: Translator;
  locale: string;
  canUpdate: boolean;
  canCreate: boolean;
  canDelete: boolean;
  onEdit: (id: number) => void;
  onDuplicate: (id: number) => void;
  setRowAction: React.Dispatch<React.SetStateAction<LoyaltyTierRowAction | null>>;
}): ColumnDef<AdminLoyaltyTier>[] {
  return [
    {
      id: "key",
      accessorKey: "key",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("table.columns.tier")} />
      ),
      cell: ({ row }) => (
        <div className="flex min-w-60 items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-md border bg-primary/5">
            <LoyaltyTierIcon
              iconKey={row.original.iconKey}
              className="size-4 text-primary"
            />
          </div>
          <div className="min-w-0">
            {canUpdate ? (
              <button
                type="button"
                className="truncate text-left text-sm font-medium hover:text-primary hover:underline hover:underline-offset-4"
                onClick={() => onEdit(row.original.id)}
              >
                {localizedTierName(row.original, locale)}
              </button>
            ) : (
              <p className="truncate text-sm font-medium">
                {localizedTierName(row.original, locale)}
              </p>
            )}
            <p className="truncate font-mono text-xs text-muted-foreground">
              {row.original.key}
            </p>
          </div>
        </div>
      ),
      meta: {
        label: t("table.filters.nameOrKey"),
        placeholder: t("table.filters.searchPlaceholder"),
        variant: "text",
        icon: Eye,
      },
      enableColumnFilter: true,
    },
    {
      id: "minimumValidViews",
      accessorKey: "minimumValidViews",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("table.columns.threshold")} />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap font-medium tabular-nums">
          {t("table.viewsCount", {
            count: row.original.minimumValidViews.toLocaleString(locale),
          })}
        </span>
      ),
    },
    {
      id: "benefits",
      accessorFn: (row) => row.benefitsCount,
      header: t("table.columns.benefits"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm tabular-nums">
          <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
          <span>
            {row.original.includedBenefitsCount}/{row.original.benefitsCount}
          </span>
        </div>
      ),
      enableSorting: false,
    },
    {
      id: "sortOrder",
      accessorKey: "sortOrder",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("table.columns.sortOrder")} />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.sortOrder}</span>
      ),
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={tc("status")} />
      ),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      meta: {
        label: tc("status"),
        variant: "multiSelect",
        options: STATUS_KEYS.map((value) => ({
          label: t(`status.${value}`),
          value,
        })),
        icon: CircleDashed,
      },
      enableColumnFilter: true,
    },
    {
      id: "updatedAt",
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("table.columns.updated")} />
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
        label: t("table.columns.updated"),
        variant: "dateRange",
        icon: CalendarDays,
      },
    },
    {
      id: "actions",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) =>
        canUpdate || canCreate || canDelete ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label={t("table.openMenu", {
                  name: localizedTierName(row.original, locale),
                })}
                variant="ghost"
                className="flex size-8 p-0 data-[state=open]:bg-muted"
              >
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {canUpdate ? (
                <DropdownMenuItem onSelect={() => onEdit(row.original.id)}>
                  <Pencil /> {tc("edit")}
                </DropdownMenuItem>
              ) : null}
              {canCreate ? (
                <DropdownMenuItem onSelect={() => onDuplicate(row.original.id)}>
                  <Copy /> {t("table.duplicate")}
                </DropdownMenuItem>
              ) : null}
              {(canUpdate || canCreate) && canDelete ? (
                <DropdownMenuSeparator />
              ) : null}
              {canDelete ? (
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setRowAction({ row, variant: "delete" })}
                >
                  <Trash2 /> {tc("delete")}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null,
    },
  ];
}

function localizedTierName(tier: AdminLoyaltyTier, locale: string) {
  const normalized = locale.toLowerCase();
  return (
    tier.translations.find(
      (translation) => translation.locale.toLowerCase() === normalized,
    )?.name ??
    tier.translations.find(
      (translation) =>
        translation.locale.toLowerCase() === normalized.split("-")[0],
    )?.name ??
    tier.translations.find((translation) => translation.locale === "vi")?.name ??
    tier.translations.find((translation) => translation.locale === "en")?.name ??
    tier.displayName ??
    tier.key
  );
}

function StatusBadge({ status }: { status: AdminLoyaltyTier["status"] }) {
  const t = useTranslations("Admin.loyaltyTiers");
  if (status === "published") {
    return (
      <Badge className="bg-emerald-600 hover:bg-emerald-600">
        {t("status.published")}
      </Badge>
    );
  }
  if (status === "pending") {
    return <Badge variant="secondary">{t("status.pending")}</Badge>;
  }
  return <Badge variant="outline">{t("status.draft")}</Badge>;
}
