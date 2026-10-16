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
import { deleteLoyaltyTier } from "@/features/admin-loyalty-tiers/api/loyalty-tiers.client";
import type { AdminLoyaltyTier } from "@/features/admin-loyalty-tiers/types";

export function DeleteLoyaltyTierDialog({
  tier,
  onOpenChange,
  onSuccess,
}: {
  tier: AdminLoyaltyTier | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("Admin.loyaltyTiers");
  const tc = useTranslations("Admin.common");
  const [deleting, setDeleting] = React.useState(false);

  async function remove() {
    if (!tier) return;
    setDeleting(true);
    try {
      await deleteLoyaltyTier(tier.id);
      toast.success(t("delete.success", { name: tier.displayName }));
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("delete.error"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={Boolean(tier)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("delete.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("delete.description", { name: tier?.displayName ?? "" })}
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
            {deleting ? tc("deleting") : t("delete.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
