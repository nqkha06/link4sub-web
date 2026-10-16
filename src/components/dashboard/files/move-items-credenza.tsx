"use client";

import { ChevronRight, Folder, FolderOpen, HardDrive, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import type { FileFolderDto } from "@/lib/api-client";
import { cn } from "@/lib/utils";

import { childFolders, folderPath, withDescendants } from "./folder-tree";

type MoveItemsCredenzaProps = {
  request: { fileIds: string[]; folderIds: string[] } | null;
  folders: FileFolderDto[];
  /**
   * Thư mục đang chứa các mục, để chọn sẵn và chặn "di chuyển tại chỗ".
   * `undefined` khi các mục nằm ở nhiều thư mục khác nhau (kết quả tìm kiếm).
   */
  sourceFolderId: string | null | undefined;
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (targetFolderId: string | null) => void;
};

export function MoveItemsCredenza({ request, ...props }: MoveItemsCredenzaProps) {
  if (!request) return null;
  return <MoveItemsContent key={[...request.fileIds, ...request.folderIds].join(",")} request={request} {...props} />;
}

function MoveItemsContent({
  request,
  folders,
  sourceFolderId,
  saving = false,
  onOpenChange,
  onConfirm,
}: Omit<MoveItemsCredenzaProps, "request"> & { request: { fileIds: string[]; folderIds: string[] } }) {
  const t = useTranslations("Files.folders.moveDialog");
  const [target, setTarget] = useState<string | null>(sourceFolderId ?? null);
  // Mở sẵn các thư mục trên đường tới thư mục hiện tại.
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(folderPath(folders, sourceFolderId ?? null).map((folder) => folder.id)),
  );
  const blocked = useMemo(() => withDescendants(folders, request.folderIds), [folders, request.folderIds]);
  const count = request.fileIds.length + request.folderIds.length;
  const unchanged = sourceFolderId !== undefined && target === sourceFolderId;

  function toggle(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function renderLevel(parentId: string | null, depth: number) {
    return childFolders(folders, parentId).map((folder) => {
      const disabled = blocked.has(folder.id);
      const hasChildren = folders.some((entry) => entry.parentId === folder.id);
      const open = expanded.has(folder.id);
      const selected = target === folder.id;
      return (
        <li key={folder.id}>
          <div
            className={cn(
              "flex items-center gap-1 rounded-md pr-2",
              selected ? "bg-primary/10 text-primary" : "hover:bg-muted",
              disabled && "opacity-50",
            )}
            style={{ paddingLeft: `${depth * 16 + 4}px` }}
          >
            <button
              type="button"
              className={cn("grid size-6 shrink-0 place-items-center rounded text-muted-foreground", !hasChildren && "invisible")}
              onClick={() => toggle(folder.id)}
              aria-label={open ? t("collapse", { name: folder.name }) : t("expand", { name: folder.name })}
            >
              <ChevronRight className={cn("size-3.5 transition-transform", open && "rotate-90")} />
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => setTarget(folder.id)}
              onDoubleClick={() => hasChildren && toggle(folder.id)}
              aria-pressed={selected}
              className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left text-sm outline-none disabled:cursor-not-allowed"
            >
              {selected || open ? <FolderOpen className="size-4 shrink-0" /> : <Folder className="size-4 shrink-0 text-muted-foreground" />}
              <span className="truncate">{folder.name}</span>
            </button>
          </div>
          {open && hasChildren ? <ul>{renderLevel(folder.id, depth + 1)}</ul> : null}
        </li>
      );
    });
  }

  return (
    <ResponsiveDialog open onOpenChange={(open) => !saving && onOpenChange(open)}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader className="border-b border-border">
          <ResponsiveDialogTitle>{t("title", { count })}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{t("description")}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="pt-4">
          <div className="max-h-80 overflow-y-auto rounded-lg border border-border p-1">
            <button
              type="button"
              onClick={() => setTarget(null)}
              aria-pressed={target === null}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium outline-none",
                target === null ? "bg-primary/10 text-primary" : "hover:bg-muted",
              )}
            >
              <HardDrive className="size-4 shrink-0" />
              {t("root")}
            </button>
            {folders.length ? <ul>{renderLevel(null, 1)}</ul> : (
              <p className="px-2 py-3 text-xs text-muted-foreground">{t("noFolders")}</p>
            )}
          </div>
          {unchanged ? <p className="mt-2 text-xs text-muted-foreground">{t("sameLocation")}</p> : null}
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter className="border-border bg-background">
          <ResponsiveDialogClose asChild>
            <Button type="button" variant="outline" disabled={saving}>{t("cancel")}</Button>
          </ResponsiveDialogClose>
          <Button type="button" disabled={saving || unchanged} onClick={() => onConfirm(target)}>
            {saving ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : null}
            {t("confirm")}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
