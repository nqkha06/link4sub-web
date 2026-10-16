"use client";

import { Edit3, FolderInput, FolderOpen, MoreHorizontal, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { FileFolderDto } from "@/lib/api-client";

export type FolderActionHandlers = {
  onOpenFolder: (id: string | null) => void;
  onRenameFolder: (folder: FileFolderDto) => void;
  onMoveFolder: (folder: FileFolderDto) => void;
  onDeleteFolder: (folder: FileFolderDto) => void;
};

export function FolderRowActions({ folder, ...handlers }: { folder: FileFolderDto } & FolderActionHandlers) {
  const t = useTranslations("Files.folders.actions");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={t("label", { name: folder.name })}><MoreHorizontal /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onSelect={() => handlers.onOpenFolder(folder.id)}><FolderOpen />{t("open")}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => handlers.onRenameFolder(folder)}><Edit3 />{t("rename")}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handlers.onMoveFolder(folder)}><FolderInput />{t("move")}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => handlers.onDeleteFolder(folder)}><Trash2 />{t("delete")}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
