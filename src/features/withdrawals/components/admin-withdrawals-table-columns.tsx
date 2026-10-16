"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  CalendarDays,
  CircleDashed,
  CircleDollarSign,
  Clock3,
  Ellipsis,
  Eye,
  Landmark,
  Mail,
  Pencil,
  Timer,
  UserRound,
  Zap,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AdminWithdrawal,
  WithdrawalStatus,
} from "@/features/withdrawals/types";
import {
  formatWithdrawalDate,
  formatWithdrawalMoney,
  getAllowedWithdrawalStatuses,
  getWithdrawalStatusOption,
  withdrawalStatusOptions,
} from "@/features/withdrawals/withdrawal-status";
import { cn } from "@/lib/utils";

type Translator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export function getAdminWithdrawalsTableColumns({
  t,
  tc,
  locale,
  canProcess,
  busyId,
  onStatusChange,
  onView,
  onReject,
  onEditPaymentInfo,
}: {
  t: Translator;
  tc: Translator;
  locale: string;
  canProcess: boolean;
  busyId: number | null;
  onStatusChange: (
    withdrawal: AdminWithdrawal,
    status: WithdrawalStatus,
  ) => void;
  onView: (withdrawal: AdminWithdrawal) => void;
  onReject: (withdrawal: AdminWithdrawal) => void;
  onEditPaymentInfo: (withdrawal: AdminWithdrawal) => void;
}): ColumnDef<AdminWithdrawal>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label={t("columns.selectAll")}
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) =>
            table.toggleAllPageRowsSelected(Boolean(value))
          }
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={t("columns.selectRow", { id: row.original.id })}
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onClick={(event) => event.stopPropagation()}
          onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
        />
      ),
      enableHiding: false,
      enableSorting: false,
      size: 40,
    },
    {
      id: "id",
      accessorKey: "id",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("columns.id")} />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          #{row.original.id}
        </span>
      ),
      meta: { label: t("columns.idLabel") },
      size: 72,
    },
    {
      id: "member",
      accessorFn: (row) => `${row.user.name} ${row.user.email}`,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("columns.member")} />
      ),
      cell: ({ row }) => (
        <div className="group relative flex min-w-60 items-center gap-3">
          <Avatar className="rounded-lg border">
            <AvatarFallback className="rounded-lg text-xs">
              {initials(row.original.user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <span className="truncate group-hover:underline">
                {row.original.user.name}
              </span>
              <Link
                href={`/admin/withdrawals?userId=${row.original.user.id}`}
                title={t("table.filterByMember")}
                aria-label={t("table.filterByMember")}
                className="relative z-10 shrink-0 rounded border px-1 font-mono text-[11px] font-normal text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                #{row.original.user.id}
              </Link>
            </p>
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <Mail className="size-3" />
              {row.original.user.email}
            </p>
          </div>
          <Link
            href={`/admin/users/${row.original.user.id}`}
            aria-label={row.original.user.name}
            className="absolute inset-0"
          />
        </div>
      ),
      meta: {
        label: t("columns.member"),
        placeholder: t("columns.memberPlaceholder"),
        variant: "text",
        icon: UserRound,
      },
      enableColumnFilter: true,
      enableSorting: false,
    },
    {
      id: "paymentMethod",
      accessorFn: (row) => row.paymentMethod.name,
      header: t("columns.paymentMethod"),
      meta: { label: t("columns.paymentMethodLabel") },
      cell: ({ row }) => (
        <div className="flex min-w-36 items-center gap-2 text-sm">
          <Landmark className="size-4 text-muted-foreground" />
          <span className="truncate">{row.original.paymentMethod.name}</span>
        </div>
      ),
      enableSorting: false,
    },
    {
      id: "amount",
      accessorKey: "amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("columns.amount")} />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap font-medium tabular-nums">
          {formatWithdrawalMoney(
            row.original.amount,
            row.original.currency,
            locale,
          )}
        </span>
      ),
      meta: { label: t("columns.amountLabel") },
    },
    {
      id: "withdrawalType",
      accessorKey: "withdrawalType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("columns.withdrawalType")} />
      ),
      cell: ({ row }) => {
        const fast = row.original.withdrawalType === "fast";
        const Icon = fast ? Zap : Timer;
        return (
          <Badge
            variant="outline"
            className={cn(
              "gap-1.5 whitespace-nowrap",
              fast &&
                "border-sky-500/25 bg-sky-500/[0.08] text-sky-700 dark:text-sky-400",
            )}
          >
            <Icon className="size-3" />
            {fast ? t("type.fast") : t("type.normal")}
          </Badge>
        );
      },
      meta: { label: t("columns.withdrawalType") },
    },
    {
      id: "netAmount",
      accessorKey: "netAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("columns.netAmount")} />
      ),
      cell: ({ row }) => (
        <div className="whitespace-nowrap tabular-nums">
          <p className="font-medium">
            {formatWithdrawalMoney(
              row.original.netAmount,
              row.original.currency,
              locale,
            )}
          </p>
          {Number(row.original.feeAmount) > 0 ? (
            <p className="text-xs text-muted-foreground">
              {t("columns.fee", {
                amount: formatWithdrawalMoney(
                  row.original.feeAmount,
                  row.original.currency,
                  locale,
                ),
              })}
            </p>
          ) : null}
        </div>
      ),
      meta: { label: t("columns.netAmountLabel") },
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={tc("status")} />
      ),
      cell: ({ row }) => (
        <WithdrawalStatusCell
          withdrawal={row.original}
          canProcess={canProcess}
          busy={busyId === row.original.id}
          onStatusChange={onStatusChange}
        />
      ),
      meta: {
        label: tc("status"),
        variant: "multiSelect",
        options: withdrawalStatusOptions.map(({ labelKey, value }) => ({
          label: t(labelKey),
          value,
        })),
        icon: CircleDashed,
      },
      enableColumnFilter: true,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={tc("createdAt")} />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {formatWithdrawalDate(row.original.createdAt, locale)}
        </span>
      ),
      meta: {
        label: t("columns.createdAtLabel"),
        icon: CalendarDays,
      },
    },
    {
      id: "processedAt",
      accessorKey: "processedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t("columns.processedAt")} />
      ),
      cell: ({ row }) => (
        <div className="min-w-32 text-xs">
          <p className="whitespace-nowrap text-muted-foreground">
            {formatWithdrawalDate(row.original.processedAt, locale)}
          </p>
          {row.original.processedBy ? (
            <p className="mt-0.5 truncate">{row.original.processedBy.name}</p>
          ) : null}
        </div>
      ),
      meta: { label: t("columns.processedAtLabel") },
    },
    {
      id: "actions",
      header: () => <div className="text-right">{tc("actions")}</div>,
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => {
        const canTransition =
          canProcess &&
          (row.original.status === "pending" ||
            row.original.status === "processing");

        return (
          <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label={t("actions.open", { id: row.original.id })}
                variant="ghost"
                className="flex size-8 p-0 data-[state=open]:bg-muted"
              >
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onSelect={() => onView(row.original)}
              >
                <Eye /> {tc("viewDetails")}
              </DropdownMenuItem>
              {canTransition ? (
                <DropdownMenuItem
                  onSelect={() => onEditPaymentInfo(row.original)}
                >
                  <Pencil /> {t("actions.editPayment")}
                </DropdownMenuItem>
              ) : null}
              {canTransition ? <DropdownMenuSeparator /> : null}
              {row.original.status === "pending" && canProcess ? (
                <DropdownMenuItem
                  disabled={busyId === row.original.id}
                  onSelect={() => onStatusChange(row.original, "processing")}
                >
                  <Clock3 /> {t("actions.process")}
                </DropdownMenuItem>
              ) : null}
              {row.original.status === "processing" && canProcess ? (
                <DropdownMenuItem
                  disabled={busyId === row.original.id}
                  onSelect={() => onStatusChange(row.original, "paid")}
                >
                  <CircleDollarSign /> {t("actions.markPaid")}
                </DropdownMenuItem>
              ) : null}
              {canTransition ? (
                <DropdownMenuItem
                  variant="destructive"
                  disabled={busyId === row.original.id}
                  onSelect={() => onReject(row.original)}
                >
                  <XCircle /> {t("actions.reject")}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        );
      },
      size: 72,
    },
  ];
}

function WithdrawalStatusCell({
  withdrawal,
  canProcess,
  busy,
  onStatusChange,
}: {
  withdrawal: AdminWithdrawal;
  canProcess: boolean;
  busy: boolean;
  onStatusChange: (
    withdrawal: AdminWithdrawal,
    status: WithdrawalStatus,
  ) => void;
}) {
  const t = useTranslations("Admin.withdrawals");
  const current = getWithdrawalStatusOption(withdrawal.status);
  const allowedStatuses = getAllowedWithdrawalStatuses(withdrawal.status);
  const editable = canProcess && allowedStatuses.length > 1;

  if (!editable) {
    return (
      <Badge
        variant="outline"
        className={cn("whitespace-nowrap font-medium", current.badgeClassName)}
      >
        <span className={cn("size-1.5 rounded-full", current.dotClassName)} />
        {t(current.labelKey)}
      </Badge>
    );
  }

  return (
    <Select
      value={withdrawal.status}
      disabled={busy}
      onValueChange={(value) =>
        onStatusChange(withdrawal, value as WithdrawalStatus)
      }
    >
      <SelectTrigger
        size="sm"
        aria-label={t("statusCell.aria", { id: withdrawal.id })}
        className="min-w-40"
      >
        <SelectValue>
          <span className={cn("size-2 rounded-full", current.dotClassName)} />
          {busy ? t("statusCell.updating") : t(current.labelKey)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {withdrawalStatusOptions
          .filter((option) => allowedStatuses.includes(option.value))
          .map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span
                className={cn("size-2 rounded-full", option.dotClassName)}
              />
              {t(option.labelKey)}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}
