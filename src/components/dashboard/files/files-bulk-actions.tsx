"use client";

import { FolderInput, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

type FilesBulkActionsProps = {
  count: number;
  busy?: boolean;
  onMove: () => void;
  onDelete: () => void;
  onClear: () => void;
};

export function FilesBulkActions({ count, busy, onMove, onDelete, onClear }: FilesBulkActionsProps) {
  const t = useTranslations("Files.bulk");
  if (!count) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30">
      <div className="pointer-events-auto flex min-h-14 w-full flex-wrap items-center gap-2 rounded-lg border border-border bg-card/95 px-3 py-2.5 shadow-sm backdrop-blur" role="toolbar" aria-label={t("toolbar")}>
        <span className="mr-auto text-sm font-medium text-foreground">{t("selected", { count })}</span>
        <Button variant="ghost" size="sm" onClick={onMove} disabled={busy}><FolderInput />{t("move")}</Button>
        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={onDelete} disabled={busy}><Trash2 />{t("delete")}</Button>
        <Button variant="ghost" size="icon-sm" onClick={onClear} aria-label={t("clearSelection")}><X /></Button>
      </div>
    </div>
  );
}
