"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  CalendarDays,
  CircleDashed,
  Copy,
  Ellipsis,
  Flag,
  Megaphone,
  MonitorSmartphone,
  Pause,
  Pencil,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";

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
import {
  announcementDisplays,
  announcementPriorities,
  announcementStatuses,
} from "@/features/announcements/query/announcements-search-params";
import type { AdminAnnouncement, AnnouncementPriority, AnnouncementStatus } from "@/features/announcements/types";
import { announcementDisplayKeys, announcementStatusKeys, announcementTypeKeys } from "@/features/announcements/types";
import { cn } from "@/lib/utils";

type Translator = (key: string, values?: Record<string, string | number>) => string;

export type AnnouncementRowAction = "publish" | "pause" | "duplicate";

const statusBadgeClassName: Record<AnnouncementStatus, string> = {
  draft: "",
  scheduled: "border-sky-500/25 bg-sky-500/[0.08] text-sky-700 dark:text-sky-400",
  active: "border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-400",
  paused: "border-amber-500/25 bg-amber-500/[0.08] text-amber-700 dark:text-amber-400",
  expired: "text-muted-foreground",
};

const priorityBadgeClassName: Record<AnnouncementPriority, string> = {
  low: "text-muted-foreground",
  normal: "",
  high: "border-amber-500/25 bg-amber-500/[0.08] text-amber-700 dark:text-amber-400",
  critical: "border-destructive/30 bg-destructive/[0.08] text-destructive",
};

function formatDate(value: string | null, locale: string) {
  return value
    ? new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(new Date(value))
    : "—";
}

export function getAdminAnnouncementsTableColumns({
  t,
  tc,
  locale,
  canCreate,
  canUpdate,
  canDelete,
  canPublish,
  busyId,
  onAction,
  onDelete,
}: {
  t: Translator;
  tc: Translator;
  locale: string;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canPublish: boolean;
  busyId: number | null;
  onAction: (announcement: AdminAnnouncement, action: AnnouncementRowAction) => void;
  onDelete: (announcement: AdminAnnouncement) => void;
}): ColumnDef<AdminAnnouncement>[] {
  return [
    {
      id: "announcement",
      accessorFn: (row) => `${row.title} ${row.slug}`,
      header: ({ column }) => <DataTableColumnHeader column={column} label={t("list.table.announcement")} />,
      cell: ({ row }) => (
        <div className="min-w-60 max-w-sm">
          <div className="flex items-center gap-2">
            {canUpdate ? (
              <Link href={`/admin/announcements/${row.original.id}/edit`} className="truncate text-sm font-medium hover:underline">
                {row.original.title}
              </Link>
            ) : (
              <span className="truncate text-sm font-medium">{row.original.title}</span>
            )}
            <Badge variant="outline" className="h-5 shrink-0 text-[10px]">{t(announcementTypeKeys[row.original.type])}</Badge>
          </div>
          <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">/{row.original.slug}</p>
        </div>
      ),
      meta: {
        label: t("list.table.announcement"),
        placeholder: t("list.searchPlaceholder"),
        variant: "text",
        icon: Megaphone,
      },
      enableColumnFilter: true,
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} label={tc("status")} />,
      cell: ({ row }) => (
        <Badge variant="outline" className={cn("whitespace-nowrap", statusBadgeClassName[row.original.status])}>
          {t(announcementStatusKeys[row.original.status])}
        </Badge>
      ),
      meta: {
        label: tc("status"),
        variant: "multiSelect",
        options: announcementStatuses.map((value) => ({ value, label: t(announcementStatusKeys[value]) })),
        icon: CircleDashed,
      },
      enableColumnFilter: true,
      enableSorting: false,
    },
    {
      id: "displayType",
      accessorKey: "displayType",
      header: ({ column }) => <DataTableColumnHeader column={column} label={t("list.table.display")} />,
      cell: ({ row }) => <span className="whitespace-nowrap text-sm">{t(announcementDisplayKeys[row.original.displayType])}</span>,
      meta: {
        label: t("list.table.display"),
        variant: "multiSelect",
        options: announcementDisplays.map((value) => ({ value, label: t(announcementDisplayKeys[value]) })),
        icon: MonitorSmartphone,
      },
      enableColumnFilter: true,
      enableSorting: false,
    },
    {
      id: "priority",
      accessorKey: "priority",
      header: ({ column }) => <DataTableColumnHeader column={column} label={t("list.filters.priority")} />,
      cell: ({ row }) => (
        <Badge variant="outline" className={cn("whitespace-nowrap", priorityBadgeClassName[row.original.priority])}>
          {t(`priority.${row.original.priority}`)}
        </Badge>
      ),
      meta: {
        label: t("list.filters.priority"),
        variant: "multiSelect",
        options: announcementPriorities.map((value) => ({ value, label: t(`priority.${value}`) })),
        icon: Flag,
      },
      enableColumnFilter: true,
      enableSorting: false,
    },
    {
      id: "targetType",
      accessorKey: "targetType",
      header: ({ column }) => <DataTableColumnHeader column={column} label={t("list.table.target")} />,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm">
          {row.original.targetType === "all"
            ? t("list.cell.targetAll")
            : row.original.targetType === "users"
              ? t("list.cell.targetUsers", { count: row.original.targetRules.userIds?.length || 0 })
              : (row.original.targetRules.roles || []).join(", ")}
        </span>
      ),
      meta: {
        label: t("list.table.target"),
        variant: "multiSelect",
        options: [
          { value: "all", label: t("list.cell.targetAll") },
          { value: "users", label: t("list.filters.byUser") },
          { value: "roles", label: t("list.filters.byRole") },
        ],
        icon: Users,
      },
      enableColumnFilter: true,
      enableSorting: false,
    },
    {
      id: "startsAt",
      accessorKey: "startsAt",
      header: ({ column }) => <DataTableColumnHeader column={column} label={t("list.table.schedule")} />,
      cell: ({ row }) => (
        <div className="min-w-32 text-xs">
          <p className="whitespace-nowrap">{formatDate(row.original.startsAt, locale)}</p>
          <p className="mt-0.5 whitespace-nowrap text-muted-foreground">
            {t("list.cell.until", { date: formatDate(row.original.endsAt, locale) })}
          </p>
        </div>
      ),
      meta: { label: t("list.table.schedule") },
    },
    {
      id: "analytics",
      header: t("list.table.analytics"),
      cell: ({ row }) => {
        const analytics = row.original.analytics;
        return (
          <div className="grid min-w-52 grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span>{t("list.cell.received", { count: analytics.eligible })}</span>
            <span>{t("list.cell.seen", { count: analytics.seen })}</span>
            <span>{t("list.cell.read", { count: analytics.read, rate: analytics.readRate })}</span>
            <span>{t("list.cell.clicked", { count: analytics.clicked, rate: analytics.clickRate })}</span>
          </div>
        );
      },
      meta: { label: t("list.table.analytics") },
      enableSorting: false,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => <DataTableColumnHeader column={column} label={tc("createdAt")} />,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(row.original.createdAt, locale)}</span>
      ),
      meta: { label: tc("createdAt"), variant: "dateRange", icon: CalendarDays },
      enableColumnFilter: true,
    },
    {
      id: "actions",
      header: tc("actions"),
      enableHiding: false,
      enableSorting: false,
      size: 72,
      cell: ({ row }) => {
        const item = row.original;
        const busy = busyId === item.id;
        const canPublishItem = canPublish && ["draft", "paused", "scheduled"].includes(item.status);
        const canPauseItem = canUpdate && item.status === "active";
        if (!canUpdate && !canPublishItem && !canCreate && !canDelete) return null;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label={t("list.actions.open", { title: item.title })}
                variant="ghost"
                className="flex size-8 p-0 data-[state=open]:bg-muted"
              >
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {canUpdate ? (
                <DropdownMenuItem asChild>
                  <Link href={`/admin/announcements/${item.id}/edit`}><Pencil /> {tc("edit")}</Link>
                </DropdownMenuItem>
              ) : null}
              {canPublishItem ? (
                <DropdownMenuItem disabled={busy} onSelect={() => onAction(item, "publish")}>
                  <Send /> {t("list.actions.publish")}
                </DropdownMenuItem>
              ) : null}
              {canPauseItem ? (
                <DropdownMenuItem disabled={busy} onSelect={() => onAction(item, "pause")}>
                  <Pause /> {t("list.actions.pause")}
                </DropdownMenuItem>
              ) : null}
              {canCreate ? (
                <DropdownMenuItem disabled={busy} onSelect={() => onAction(item, "duplicate")}>
                  <Copy /> {t("list.actions.duplicate")}
                </DropdownMenuItem>
              ) : null}
              {canDelete ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => onDelete(item)}>
                    <Trash2 /> {tc("delete")}
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
