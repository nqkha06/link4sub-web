"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";

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
import { deleteMonetizationLevel } from "@/features/admin-monetization-levels/api/monetization-levels.client";
import type { AdminMonetizationLevel } from "@/features/admin-monetization-levels/types";

export function DeleteMonetizationLevelDialog({
  level,
  onOpenChange,
  onSuccess,
}: {
  level: AdminMonetizationLevel | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("Admin.monetizationLevels");
  const tc = useTranslations("Admin.common");
  const [deleting, setDeleting] = React.useState(false);

  async function remove() {
    if (!level) return;
    setDeleting(true);
    try {
      await deleteMonetizationLevel(level.id);
      toast.success(t("delete.success", { name: level.displayName }));
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("delete.failed"),
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={Boolean(level)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("delete.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("delete.description", { name: level?.displayName ?? "" })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>
            {tc("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleting}
            onClick={(event) => {
              event.preventDefault();
              void remove();
            }}
          >
            {deleting ? t("delete.deleting") : t("delete.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
