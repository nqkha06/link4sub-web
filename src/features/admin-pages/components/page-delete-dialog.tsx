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
import { deleteAdminPages } from "@/features/admin-pages/api/pages.client";
import type { AdminPageListItem } from "@/features/admin-pages/types";

export function PageDeleteDialog({
  pages,
  onOpenChange,
  onSuccess,
}: {
  pages: AdminPageListItem[];
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("Admin.pages.delete");
  const tc = useTranslations("Admin.common");
  const [deleting, setDeleting] = React.useState(false);

  async function remove() {
    if (!pages.length) return;
    setDeleting(true);
    try {
      const result = await deleteAdminPages(pages.map((page) => page.id));
      toast.success(t("success", { count: result.deleted }));
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("failed"),
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog
      open={pages.length > 0}
      onOpenChange={(open) => !deleting && onOpenChange(open)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("title", { count: pages.length })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>
            {tc("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleting}
            onClick={() => void remove()}
          >
            {deleting ? t("deleting") : t("submit")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
