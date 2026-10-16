"use client";

import { LoaderCircle, RotateCcw, TriangleAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { rejectAdminWithdrawal } from "@/features/withdrawals/api/withdrawals.client";
import type { AdminWithdrawal } from "@/features/withdrawals/types";
import { formatWithdrawalMoney } from "@/features/withdrawals/withdrawal-status";

export function RejectWithdrawalDialog({
  withdrawal,
  onOpenChange,
  onSuccess,
}: {
  withdrawal: AdminWithdrawal;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("Admin.withdrawals.reject");
  const tc = useTranslations("Admin.common");
  const locale = useLocale();
  const [reason, setReason] = React.useState(
    withdrawal.statusReason ?? "",
  );
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async () => {
    if (reason.trim().length < 3) return;

    try {
      setSubmitting(true);
      await rejectAdminWithdrawal(withdrawal.id, reason.trim());
      setSubmitting(false);
      toast.success(t("success"));
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      setSubmitting(false);
      toast.error(
        error instanceof Error
          ? error.message
          : t("error"),
      );
    }
  };

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!submitting) onOpenChange(open);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <TriangleAlert />
          </AlertDialogMedia>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.rich("description", {
              id: withdrawal.id,
              amount: formatWithdrawalMoney(
                withdrawal.amount,
                withdrawal.currency,
                locale,
              ),
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <label
            htmlFor="withdrawal-rejection-reason"
            className="text-sm font-medium"
          >
            {t("reasonLabel")}
          </label>
          <Textarea
            id="withdrawal-rejection-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t("reasonPlaceholder")}
            maxLength={500}
            disabled={submitting}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            {t("minChars", { count: reason.length })}
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>
            {tc("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={submitting || reason.trim().length < 3}
            onClick={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            {submitting ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <RotateCcw />
            )}
            {t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
