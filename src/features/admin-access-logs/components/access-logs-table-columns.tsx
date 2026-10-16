"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, Eye, ShieldAlert, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { AdminAccessLog } from "../types";

type Translator = ReturnType<typeof useTranslations>;

export function getAccessLogsColumns({
  onView,
  t,
  tc,
  locale,
}: {
  onView: (log: AdminAccessLog) => void;
  t: Translator;
  tc: Translator;
  locale: string;
}): ColumnDef<AdminAccessLog>[] {
  return [
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("columns.time")}
          label={t("columns.time")}
        />
      ),
      cell: ({ row }) => (
        <div className="whitespace-nowrap text-sm">
          <p className="font-medium">{formatDate(row.original.createdAt, locale)}</p>
          <p className="text-xs text-muted-foreground">
            {formatTime(row.original.createdAt, locale)}
          </p>
        </div>
      ),
      enableSorting: false,
    },
    {
      id: "user",
      header: t("columns.user"),
      cell: ({ row }) => (
        <div className="max-w-56">
          <Link
            href={`/admin/users/${row.original.user.id}`}
            className="font-medium hover:underline"
          >
            {row.original.user.name}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            #{row.original.user.id} · {row.original.user.email}
          </p>
        </div>
      ),
    },
    {
      id: "link",
      header: t("columns.link"),
      cell: ({ row }) => (
        <div className="max-w-52">
          <p className="truncate font-medium">{row.original.link.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            #{row.original.link.id} · /{row.original.link.slug}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "ipAddress",
      header: t("columns.ip"),
      cell: ({ row }) => (
        <code className="whitespace-nowrap text-xs">
          {row.original.ipAddress || "—"}
        </code>
      ),
    },
    {
      accessorKey: "country",
      header: t("columns.country"),
      cell: ({ row }) => row.original.country || "ZZ",
    },
    {
      accessorKey: "deviceLabel",
      header: t("columns.device"),
    },
    {
      accessorKey: "revenue",
      header: t("columns.revenue"),
      cell: ({ row }) => (
        <span className="whitespace-nowrap font-medium tabular-nums">
          {formatMoney(row.original.revenue, locale)}
        </span>
      ),
    },
    {
      accessorKey: "isEarn",
      header: t("columns.isEarn"),
      cell: ({ row }) =>
        row.original.isEarn ? (
          <Badge variant="outline" className="text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 /> {tc("yes")}
          </Badge>
        ) : (
          <Badge variant="secondary">
            <XCircle /> {tc("no")}
          </Badge>
        ),
    },
    {
      id: "detectionStatus",
      header: t("columns.detection"),
      cell: ({ row }) => (
        <div className="flex max-w-64 flex-col items-start gap-1.5">
          <DetectionBadge log={row.original} />
          {row.original.detectionReasons.length ? (
            <ul className="flex flex-wrap gap-1">
              {row.original.detectionReasons.map((reason) => (
                <li key={reason}>
                  <Badge variant="outline" className="font-normal">
                    {reason}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "rejectReasonMask",
      header: t("columns.rejectReason"),
      cell: ({ row }) => (
        <div className="max-w-52 text-xs">
          {row.original.rejectReasons[0] || tc("none")}
          {row.original.rejectReasons.length > 1 ? (
            <span className="text-muted-foreground">
              {` +${row.original.rejectReasons.length - 1}`}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "riskScore",
      header: t("columns.riskScore"),
      cell: ({ row }) =>
        row.original.riskScore === null ? (
          <span className="text-xs text-muted-foreground">{t("table.riskOnDemand")}</span>
        ) : (
          row.original.riskScore
        ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("table.viewLog", { id: row.original.id })}
          onClick={() => onView(row.original)}
        >
          <Eye />
        </Button>
      ),
      enableHiding: false,
    },
  ];
}

export function DetectionBadge({ log }: { log: AdminAccessLog }) {
  const t = useTranslations("Admin.accessLogs");
  if (log.detectionStatus === "rejected") {
    return (
      <Badge variant="destructive">
        <XCircle /> {t("detection.rejected")}
      </Badge>
    );
  }
  if (log.detectionStatus === "suspicious") {
    return (
      <Badge variant="outline" className="text-amber-700 dark:text-amber-400">
        <ShieldAlert /> {t("detection.suspicious")}
      </Badge>
    );
  }
  return (
    <Badge variant="secondary">
      <CheckCircle2 /> {t("detection.normal")}
    </Badge>
  );
}

export function formatMoney(value: string | number, locale: string) {
  const amount = Number(value);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 6,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "short" }).format(
    new Date(value),
  );
}

function formatTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { timeStyle: "medium" }).format(
    new Date(value),
  );
}
