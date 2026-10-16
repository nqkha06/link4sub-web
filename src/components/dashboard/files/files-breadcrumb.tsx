"use client";

import { ChevronRight, FolderPlus, HardDrive } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { FileFolderDto } from "@/lib/api-client";
import { cn } from "@/lib/utils";

import { useDropTarget, type DraggedItems } from "./file-dnd";

function Crumb({
  folderId,
  label,
  current,
  onOpen,
  onDrop,
}: {
  folderId: string | null;
  label: string;
  current: boolean;
  onOpen: (id: string | null) => void;
  onDrop: (items: DraggedItems, target: string | null) => void;
}) {
  const drop = useDropTarget(folderId, onDrop);
  return (
    <button
      type="button"
      {...drop.props}
      onClick={() => onOpen(folderId)}
      aria-current={current ? "page" : undefined}
      className={cn(
        "flex min-w-0 max-w-48 items-center gap-1.5 rounded-md px-2 py-1 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        current ? "font-semibold text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        drop.over && "bg-primary/10 text-primary ring-2 ring-primary/40",
      )}
    >
      {folderId === null ? <HardDrive className="size-4 shrink-0" aria-hidden /> : null}
      <span className="truncate">{label}</span>
    </button>
  );
}

export function FilesBreadcrumb({
  path,
  searching,
  disabled,
  onOpen,
  onCreateFolder,
  onDrop,
}: {
  path: FileFolderDto[];
  searching: boolean;
  disabled?: boolean;
  onOpen: (id: string | null) => void;
  onCreateFolder: () => void;
  onDrop: (items: DraggedItems, target: string | null) => void;
}) {
  const t = useTranslations("Files.folders");
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      {searching ? (
        <p className="px-2 py-1 text-sm text-muted-foreground">{t("searchEverywhere")}</p>
      ) : (
        <nav aria-label={t("breadcrumb")} className="flex min-w-0 flex-wrap items-center gap-0.5">
          <Crumb folderId={null} label={t("root")} current={path.length === 0} onOpen={onOpen} onDrop={onDrop} />
          {path.map((folder, index) => (
            <span key={folder.id} className="flex min-w-0 items-center gap-0.5">
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" aria-hidden />
              <Crumb
                folderId={folder.id}
                label={folder.name}
                current={index === path.length - 1}
                onOpen={onOpen}
                onDrop={onDrop}
              />
            </span>
          ))}
        </nav>
      )}
      {!searching ? (
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={onCreateFolder}>
          <FolderPlus />
          {t("create")}
        </Button>
      ) : null}
    </div>
  );
}
