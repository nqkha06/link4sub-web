"use client";

import { Download, Edit3, Eye, FolderInput, MoreHorizontal, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { ManagedFileDto } from "@/lib/api-client";

type FileRowActionsProps = {
  file: ManagedFileDto;
  onPreview: (file: ManagedFileDto) => void;
  onDownload: (file: ManagedFileDto) => void;
  onRename: (file: ManagedFileDto) => void;
  onMove: (file: ManagedFileDto) => void;
  onDelete: (file: ManagedFileDto) => void;
};

export function FileRowActions({ file, onPreview, onDownload, onRename, onMove, onDelete }: FileRowActionsProps) {
  const t = useTranslations("Files.rowActions");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={t("label", { name: file.name })}><MoreHorizontal /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onSelect={() => onPreview(file)}><Eye />{t("preview")}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onDownload(file)}><Download />{t("download")}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onRename(file)}><Edit3 />{t("rename")}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onMove(file)}><FolderInput />{t("move")}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(file)}><Trash2 />{t("delete")}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
