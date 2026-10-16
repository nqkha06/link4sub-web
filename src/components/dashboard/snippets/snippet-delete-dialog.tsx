"use client";

import { useTranslations } from "next-intl";

import { DestinationDeleteDialog } from "@/components/dashboard/destination-delete-dialog";
import type { SnippetDto } from "@/lib/api-client";

type SnippetDeleteDialogProps = {
  snippet: SnippetDto | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function SnippetDeleteDialog({ snippet, onOpenChange, onConfirm }: SnippetDeleteDialogProps) {
  const t = useTranslations("Snippets.delete");
  return (
    <DestinationDeleteDialog
      open={Boolean(snippet)}
      onOpenChange={onOpenChange}
      kind="snippet"
      ids={snippet ? [snippet.id] : []}
      title={t("title")}
      description={t("description", { name: snippet?.name ?? "" })}
      confirmLabel={t("confirm")}
      onConfirm={onConfirm}
    />
  );
}
