"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  CalendarDays,
  CircleDashed,
  Ellipsis,
  Eye,
  Flag,
  Mail,
  MessageSquareText,
  Tags,
  UserCheck,
} from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminSupportTicketListItem } from "@/features/admin-support/types";

import {
  CATEGORY_VALUES,
  formatDate,
  PRIORITY_VALUES,
  PriorityBadge,
  STATUS_VALUES,
  StatusBadge,
} from "./support-ticket-badges";

type Translator = (key: string, values?: Record<string, string | number>) => string;

export function getAdminSupportTableColumns({
  t,
  tc,
  locale,
  onOpen,
}: {
  t: Translator;
  tc: Translator;
  locale: string;
  onOpen: (ticket: AdminSupportTicketListItem) => void;
}): ColumnDef<AdminSupportTicketListItem>[] {
  return [
    {
      id: "ticket",
      accessorFn: (row) => `${row.reference} ${row.subject}`,
      header: ({ column }) => <DataTableColumnHeader column={column} label={t("table.columns.ticket")} />,
      cell: ({ row }) => (
        <div className="min-w-64 max-w-sm">
          <p className="font-mono text-xs text-muted-foreground">{row.original.reference}</p>
          <button
            type="button"
            className="mt-0.5 block max-w-full truncate text-left text-sm font-medium hover:underline"
            onClick={() => onOpen(row.original)}
          >
            {row.original.subject}
          </button>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("table.messageCount", { count: row.original.messageCount })}
          </p>
        </div>
      ),
      meta: {
        label: t("table.columns.ticket"),
        placeholder: t("filters.searchPlaceholder"),
        variant: "text",
        icon: MessageSquareText,
      },
      enableColumnFilter: true,
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "member",
      accessorFn: (row) => row.user.email,
      header: t("table.columns.member"),
      cell: ({ row }) => (
        <div className="min-w-44 max-w-56">
          <p className="truncate text-sm font-medium">{row.original.user.name}</p>
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <Mail className="size-3 shrink-0" />
            {row.original.user.email}
          </p>
        </div>
      ),
      meta: { label: t("table.columns.member") },
      enableSorting: false,
    },
    {
      id: "category",
      accessorKey: "category",
      header: t("table.columns.category"),
      cell: ({ row }) => <span className="whitespace-nowrap text-sm">{t(`category.${row.original.category}`)}</span>,
      meta: {
        label: t("table.columns.category"),
        variant: "multiSelect",
        options: CATEGORY_VALUES.map((value) => ({ value, label: t(`category.${value}`) })),
        icon: Tags,
      },
      enableColumnFilter: true,
      enableSorting: false,
    },
    {
      id: "status",
      accessorKey: "status",
      header: tc("status"),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      meta: {
        label: tc("status"),
        variant: "multiSelect",
        options: STATUS_VALUES.map((value) => ({ value, label: t(`status.${value}`) })),
        icon: CircleDashed,
      },
      enableColumnFilter: true,
      enableSorting: false,
    },
    {
      id: "priority",
      accessorKey: "priority",
      header: t("table.columns.priority"),
      cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
      meta: {
        label: t("table.columns.priority"),
        variant: "multiSelect",
        options: PRIORITY_VALUES.map((value) => ({ value, label: t(`priority.${value}`) })),
        icon: Flag,
      },
      enableColumnFilter: true,
      enableSorting: false,
    },
    {
      id: "assignment",
      accessorFn: (row) => row.assignedTo?.name ?? "",
      header: t("table.columns.assignment"),
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {row.original.assignedTo?.name || t("assignment.unassigned")}
        </span>
      ),
      meta: {
        label: t("table.columns.assignment"),
        variant: "select",
        options: [
          { value: "mine", label: t("filters.assignedToMe") },
          { value: "unassigned", label: t("assignment.unassigned") },
        ],
        icon: UserCheck,
      },
      enableColumnFilter: true,
      enableSorting: false,
    },
    {
      id: "lastMessageAt",
      accessorKey: "lastMessageAt",
      header: ({ column }) => <DataTableColumnHeader column={column} label={t("table.columns.updated")} />,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
          {formatDate(row.original.lastMessageAt, locale)}
        </span>
      ),
      meta: { label: t("table.columns.updated") },
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => <DataTableColumnHeader column={column} label={tc("createdAt")} />,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
          {formatDate(row.original.createdAt, locale)}
        </span>
      ),
      meta: { label: tc("createdAt"), icon: CalendarDays },
    },
    {
      id: "actions",
      header: tc("actions"),
      enableHiding: false,
      enableSorting: false,
      size: 72,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={t("table.actions.open", { reference: row.original.reference })}
              variant="ghost"
              className="flex size-8 p-0 data-[state=open]:bg-muted"
            >
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onSelect={() => onOpen(row.original)}>
              <Eye /> {tc("viewDetails")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
