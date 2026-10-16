"use client";

import { useTranslations } from "next-intl";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { PageStatus } from "@/features/admin-pages/types";

const copyKeys: Record<PageStatus, { action: string; description: string }> = {
  PUBLISHED: {
    action: "statusDialog.published.action",
    description: "statusDialog.published.description",
  },
  DRAFT: {
    action: "statusDialog.draft.action",
    description: "statusDialog.draft.description",
  },
  ARCHIVED: {
    action: "statusDialog.archived.action",
    description: "statusDialog.archived.description",
  },
};

export function PageStatusDialog({
  count,
  status,
  busy,
  onConfirm,
  onOpenChange,
}: {
  count: number;
  status: PageStatus | null;
  busy: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Admin.pages");
  const tc = useTranslations("Admin.common");
  const config = status ? copyKeys[status] : null;
  const actionLabel = config ? t(config.action) : "";
  return (
    <AlertDialog
      open={Boolean(config && count)}
      onOpenChange={(open) => !busy && onOpenChange(open)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("statusDialog.title", { action: actionLabel, count })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {config ? t(config.description) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{tc("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {busy ? t("statusDialog.updating") : actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
