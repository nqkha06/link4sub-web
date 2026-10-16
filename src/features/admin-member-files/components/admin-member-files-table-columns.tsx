"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  Archive,
  CircleDashed,
  Download,
  Ellipsis,
  Eye,
  File,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  Link2,
  RotateCcw,
  Shapes,
  Trash2,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
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
  ADMIN_FILE_STATES,
  ADMIN_FILE_TYPES,
  type AdminFileType,
  type AdminMemberFile,
} from "@/features/admin-member-files/types";

type Translator = (key: string, values?: Record<string, string | number>) => string;

export type MemberFileAction =
  | "preview"
  | "download"
  | "trash"
  | "restore"
  | "purge";

const typeIcons: Record<AdminFileType, typeof File> = {
  image: FileImage,
  video: FileVideo,
  audio: FileAudio,
  document: FileText,
  archive: Archive,
  other: File,
};

const archiveExtensions = new Set(["zip", "rar", "7z", "tar", "gz"]);
const documentExtensions = new Set(["pdf", "doc", "docx", "txt", "csv", "xlsx", "pptx"]);

/** Mirrors the API's type buckets so the icon matches the type filter. */
export function fileTypeOf(file: Pick<AdminMemberFile, "mimeType" | "extension">): AdminFileType {
  const mime = file.mimeType.toLowerCase();
  const extension = (file.extension ?? "").toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.includes("zip") || mime.includes("rar") || archiveExtensions.has(extension)) return "archive";
  if (mime.startsWith("text/") || mime.includes("pdf") || mime.includes("document") || documentExtensions.has(extension)) return "document";
  return "other";
}

export function formatFileSize(size: number) {
  if (size <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const unit = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** unit;
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 2)} ${units[unit]}`;
}

export function getAdminMemberFilesTableColumns({
  t,
  tc,
  locale,
  canDelete,
  onAction,
}: {
  t: Translator;
  tc: Translator;
  locale: string;
  canDelete: boolean;
  onAction: (action: MemberFileAction, file: AdminMemberFile) => void;
}): ColumnDef<AdminMemberFile>[] {
  const number = new Intl.NumberFormat(locale);
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" });

  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label={t("table.selectAll")}
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={t("table.selectRow", { name: row.original.name })}
          checked={row.getIsSelected()}
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
      header: ({ column }) => <DataTableColumnHeader column={column} label={t("table.columns.file")} />,
      cell: ({ row }) => {
        const file = row.original;
        const Icon = typeIcons[fileTypeOf(file)];
        return (
          <div className="flex min-w-64 max-w-md items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg border bg-muted/40 text-muted-foreground">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-2">
                <span className="truncate text-sm font-medium" title={file.name}>
                  {file.name}
                </span>
                {file.deletedAt ? (
                  <Badge variant="outline" className="shrink-0 border-destructive/30 bg-destructive/10 text-destructive">
                    {t("state.trash")}
                  </Badge>
                ) : null}
              </p>
              <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                {file.alias}
                {file.extension ? ` · .${file.extension}` : ""}
              </p>
            </div>
          </div>
        );
      },
      meta: {
        label: t("table.columns.file"),
        placeholder: t("filters.searchPlaceholder"),
        variant: "text",
        icon: FileText,
      },
      enableColumnFilter: true,
      enableHiding: false,
    },
    {
      id: "owner",
      accessorFn: (row) => row.owner.email,
      header: t("table.columns.owner"),
      cell: ({ row }) => (
        <div className="min-w-44 max-w-56">
          <Link
            href={`/admin/users/${row.original.owner.id}`}
            className="block truncate text-sm font-medium hover:underline"
          >
            {row.original.owner.name}
          </Link>
          <p className="truncate text-xs text-muted-foreground">{row.original.owner.email}</p>
        </div>
      ),
      meta: {
        label: t("table.columns.owner"),
        placeholder: t("filters.ownerPlaceholder"),
        variant: "text",
        icon: UserRound,
      },
      enableColumnFilter: true,
      enableSorting: false,
    },
    {
      id: "type",
      accessorFn: (row) => fileTypeOf(row),
      header: t("table.columns.type"),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{t(`type.${fileTypeOf(row.original)}`)}</span>
      ),
      meta: {
        label: t("table.columns.type"),
        variant: "select",
        options: ADMIN_FILE_TYPES.map((value) => ({ value, label: t(`type.${value}`) })),
        icon: Shapes,
      },
      enableColumnFilter: true,
      enableSorting: false,
    },
    {
      id: "state",
      accessorFn: (row) => (row.deletedAt ? "trash" : "active"),
      header: tc("status"),
      meta: {
        label: tc("status"),
        variant: "select",
        options: ADMIN_FILE_STATES.map((value) => ({ value, label: t(`state.${value}`) })),
        icon: CircleDashed,
      },
      enableColumnFilter: true,
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "size",
      accessorKey: "size",
      header: ({ column }) => <DataTableColumnHeader column={column} label={t("table.columns.size")} />,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm tabular-nums">{formatFileSize(row.original.size)}</span>
      ),
      meta: { label: t("table.columns.size") },
    },
    {
      id: "downloadCount",
      accessorKey: "downloadCount",
      header: ({ column }) => <DataTableColumnHeader column={column} label={t("table.columns.downloads")} />,
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">{number.format(row.original.downloadCount)}</span>
      ),
      meta: { label: t("table.columns.downloads") },
    },
    {
      id: "usageCount",
      accessorKey: "usageCount",
      header: t("table.columns.usage"),
      cell: ({ row }) =>
        row.original.usageCount > 0 ? (
          <span className="inline-flex items-center gap-1 text-sm tabular-nums">
            <Link2 className="size-3.5 text-muted-foreground" aria-hidden="true" />
            {number.format(row.original.usageCount)}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
      meta: { label: t("table.columns.usage") },
      enableSorting: false,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => <DataTableColumnHeader column={column} label={t("table.columns.uploaded")} />,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
          {date.format(new Date(row.original.createdAt))}
        </span>
      ),
      meta: { label: t("table.columns.uploaded") },
    },
    {
      id: "actions",
      enableHiding: false,
      enableSorting: false,
      size: 48,
      cell: ({ row }) => {
        const file = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label={t("table.openMenu", { name: file.name })}
                variant="ghost"
                className="flex size-8 p-0 data-[state=open]:bg-muted"
              >
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onSelect={() => onAction("preview", file)}>
                <Eye /> {t("actions.preview")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onAction("download", file)}>
                <Download /> {t("actions.download")}
              </DropdownMenuItem>
              {canDelete ? (
                <>
                  <DropdownMenuSeparator />
                  {file.deletedAt ? (
                    <>
                      <DropdownMenuItem onSelect={() => onAction("restore", file)}>
                        <RotateCcw /> {t("actions.restore")}
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onSelect={() => onAction("purge", file)}>
                        <Trash2 /> {t("actions.purge")}
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem variant="destructive" onSelect={() => onAction("trash", file)}>
                      <Trash2 /> {t("actions.trash")}
                    </DropdownMenuItem>
                  )}
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
