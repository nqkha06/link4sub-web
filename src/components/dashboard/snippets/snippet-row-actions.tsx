"use client";

import { Copy, Edit3, MoreHorizontal, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { SnippetDto } from "@/lib/api-client";

type SnippetRowActionsProps = {
  snippet: SnippetDto;
  onEdit: (snippet: SnippetDto) => void;
  onCopy: (snippet: SnippetDto) => void;
  onDelete: (snippet: SnippetDto) => void;
};

export function SnippetRowActions({ snippet, onEdit, onCopy, onDelete }: SnippetRowActionsProps) {
  const t = useTranslations("Snippets.rowActions");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={t("label", { name: snippet.name })}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onSelect={() => onEdit(snippet)}><Edit3 />{t("edit")}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onCopy(snippet)}><Copy />{t("copy")}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(snippet)}><Trash2 />{t("delete")}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
