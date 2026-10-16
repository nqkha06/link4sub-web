"use client";

import type { ColumnDef, Row } from "@tanstack/react-table";
import {
  Award,
  Ban,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Ellipsis,
  Eye,
  KeyRound,
  LogIn,
  PauseCircle,
  Pencil,
  Shield,
  Trash2,
  UserRound,
  WalletCards,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserStatusBadge } from "@/features/admin-users/components/user-status-badge";
import type {
  AdminUserListItem,
  UserStatus,
} from "@/features/admin-users/types";
import { formatDateTime, formatUsd } from "@/features/admin-users/format";
import { getUserStatusOptions } from "@/features/admin-users/user-status";

export type UserRowAction = {
  row: Row<AdminUserListItem>;
  variant: "delete" | "revoke-sessions" | "impersonate";
};

type Translate = (key: string, values?: Record<string, string | number>) => string;

export function getUsersTableColumns({
  t,
  tc,
  locale,
  currentUserId,
  canUpdate,
  canDelete,
  canManageStatus,
  canRevokeSessions,
  canImpersonate,
  roleOptions,
  onStatusChange,
  setRowAction,
}: {
  t: Translate;
  tc: Translate;
  locale: string;
  currentUserId: number;
  canUpdate: boolean;
  canDelete: boolean;
  canManageStatus: boolean;
  canRevokeSessions: boolean;
  canImpersonate: boolean;
  roleOptions: Array<{ label: string; value: string; icon: typeof Shield }>;
  onStatusChange: (user: AdminUserListItem, status: UserStatus) => void;
  setRowAction: React.Dispatch<React.SetStateAction<UserRowAction | null>>;
}): ColumnDef<AdminUserListItem>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label={t("table.selectAllAria")}
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
          aria-label={t("table.selectRowAria", { name: row.original.name })}
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
      id: "name",
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          label={t("table.columns.user")}
        />
      ),
      cell: ({ row }) => (
        <div className="flex min-w-64 max-w-[28rem] items-center gap-3">
          <Avatar className="size-9 shrink-0 rounded-lg border">
            <AvatarImage
              src={row.original.avatar || undefined}
              alt={row.original.name}
            />
            <AvatarFallback className="rounded-lg text-xs">
              {initials(row.original.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={`/admin/users/${row.original.id}`}
                      className="block truncate font-medium text-sm hover:text-primary hover:underline hover:underline-offset-4"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {row.original.name}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>{row.original.name}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {row.original.id === currentUserId ? (
                <Badge variant="outline">{t("table.you")}</Badge>
              ) : null}
            </div>
            <p className="truncate text-muted-foreground text-xs">
              {row.original.email}
            </p>
          </div>
        </div>
      ),
      meta: {
        label: t("table.columns.nameOrEmail"),
        placeholder: t("table.columns.searchNameOrEmailPlaceholder"),
        variant: "text",
        icon: UserRound,
      },
      enableColumnFilter: true,
    },
    {
      id: "email",
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={tc("email")} />
      ),
      cell: ({ row }) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block max-w-64 truncate text-sm">
                {row.original.email}
              </span>
            </TooltipTrigger>
            <TooltipContent>{row.original.email}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      meta: {
        label: tc("email"),
        placeholder: t("table.columns.filterEmailPlaceholder"),
        variant: "text",
        icon: UserRound,
      },
      enableColumnFilter: true,
    },
    {
      id: "role",
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          label={t("table.columns.role")}
        />
      ),
      cell: ({ row }) => (
        <div className="flex max-w-60 flex-wrap gap-1">
          {row.original.roles.map((role) => (
            <Badge key={role.id} variant="outline">
              {role.name}
            </Badge>
          ))}
        </div>
      ),
      meta: {
        label: t("table.columns.role"),
        variant: "multiSelect",
        options: roleOptions,
        icon: Shield,
      },
      enableColumnFilter: true,
      enableSorting: false,
    },
    {
      id: "loyaltyTier",
      accessorFn: (row) => row.loyaltyTier?.name || t("table.noTier"),
      header: t("table.columns.tier"),
      cell: ({ row }) =>
        row.original.loyaltyTier ? (
          <Badge variant="secondary" className="whitespace-nowrap">
            <Award className="size-3" /> {row.original.loyaltyTier.name}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">
            {t("table.noTier")}
          </span>
        ),
      meta: {
        label: t("table.columns.tier"),
        icon: Award,
      },
      enableSorting: false,
    },
    {
      id: "monetizationLevel",
      accessorFn: (row) => row.monetizationLevel?.name || t("table.notConfigured"),
      header: t("table.columns.monetizationLevel"),
      cell: ({ row }) =>
        row.original.monetizationLevel ? (
          <div className="min-w-32">
            <p className="whitespace-nowrap font-medium text-sm">
              {row.original.monetizationLevel.name}
            </p>
            <p className="text-muted-foreground text-xs">
              {row.original.usesDefaultMonetizationLevel
                ? t("table.defaultLevel")
                : t("table.customLevel")}
            </p>
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">
            {t("table.notConfigured")}
          </span>
        ),
      meta: {
        label: t("table.columns.monetizationLevel"),
        icon: Zap,
      },
      enableSorting: false,
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={tc("status")} />
      ),
      cell: ({ row }) => <UserStatusBadge status={row.original.status} />,
      meta: {
        label: tc("status"),
        variant: "multiSelect",
        options: getUserStatusOptions(t),
        icon: CircleDashed,
      },
      enableColumnFilter: true,
    },
    {
      id: "balance",
      accessorKey: "balance",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          label={t("table.columns.balance")}
        />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap font-medium tabular-nums">
          {formatUsd(row.original.balance, locale)}
        </span>
      ),
      meta: {
        label: t("table.columns.balance"),
        placeholder: t("table.columns.filterBalancePlaceholder"),
        variant: "number",
        icon: WalletCards,
      },
      enableColumnFilter: true,
    },
    {
      id: "activeSessionsCount",
      accessorKey: "activeSessionsCount",
      header: t("table.columns.sessions"),
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.activeSessionsCount}</span>
      ),
      enableSorting: false,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={tc("createdAt")} />
      ),
      cell: ({ row }) => (
        <time
          dateTime={row.original.createdAt}
          className="whitespace-nowrap text-muted-foreground text-xs"
        >
          {formatDateTime(row.original.createdAt, locale)}
        </time>
      ),
      meta: {
        label: tc("createdAt"),
        variant: "dateRange",
        icon: CalendarDays,
      },
      enableColumnFilter: true,
    },
    {
      id: "updatedAt",
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          label={t("table.columns.updated")}
        />
      ),
      cell: ({ row }) => (
        <time
          dateTime={row.original.updatedAt}
          className="whitespace-nowrap text-muted-foreground text-xs"
        >
          {formatDateTime(row.original.updatedAt, locale)}
        </time>
      ),
      meta: {
        label: t("table.columns.updatedAtFilter"),
        variant: "dateRange",
        icon: CalendarDays,
      },
      enableColumnFilter: true,
    },
    {
      id: "actions",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={t("table.openMenuAria", { name: row.original.name })}
              variant="ghost"
              className="flex size-8 p-0 data-[state=open]:bg-muted"
              onClick={(event) => event.stopPropagation()}
            >
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56"
            onClick={(event) => event.stopPropagation()}
          >
            <DropdownMenuItem asChild>
              <Link href={`/admin/users/${row.original.id}`}>
                <Eye /> {tc("viewDetails")}
              </Link>
            </DropdownMenuItem>
            {canImpersonate &&
            row.original.id !== currentUserId &&
            row.original.status === "active" &&
            !row.original.permissions.includes("admin.access") ? (
              <DropdownMenuItem
                onSelect={() =>
                  setRowAction({ row, variant: "impersonate" })
                }
              >
                <LogIn /> {t("table.actions.impersonate")}
              </DropdownMenuItem>
            ) : null}
            {canUpdate ? (
              <DropdownMenuItem asChild>
                <Link href={`/admin/users/${row.original.id}/edit`}>
                  <Pencil /> {tc("edit")}
                </Link>
              </DropdownMenuItem>
            ) : null}
            {canManageStatus && row.original.id !== currentUserId ? (
              <>
                <DropdownMenuSeparator />
                {row.original.status === "active" ? (
                  <>
                    <DropdownMenuItem
                      onSelect={() => onStatusChange(row.original, "suspended")}
                    >
                      <PauseCircle /> {t("table.actions.suspend")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => onStatusChange(row.original, "banned")}
                    >
                      <Ban /> {t("table.actions.ban")}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem
                    onSelect={() => onStatusChange(row.original, "active")}
                  >
                    <CheckCircle2 /> {t("table.actions.activate")}
                  </DropdownMenuItem>
                )}
              </>
            ) : null}
            {canRevokeSessions &&
            row.original.id !== currentUserId &&
            row.original.activeSessionsCount > 0 ? (
              <DropdownMenuItem
                onSelect={() =>
                  setRowAction({ row, variant: "revoke-sessions" })
                }
              >
                <KeyRound /> {t("table.actions.revokeSessions")}
              </DropdownMenuItem>
            ) : null}
            {canDelete ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  disabled={row.original.id === currentUserId}
                  onSelect={() => setRowAction({ row, variant: "delete" })}
                >
                  <Trash2 /> {t("table.actions.deleteUser")}
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
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
