"use client";

import { LoaderCircle, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAdminWithdrawalPaymentInfo } from "@/features/withdrawals/api/withdrawals.client";
import type { AdminWithdrawal } from "@/features/withdrawals/types";

export function EditWithdrawalPaymentInfoDialog({
  withdrawal,
  onOpenChange,
  onSuccess,
}: {
  withdrawal: AdminWithdrawal;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updated: AdminWithdrawal) => void;
}) {
  const t = useTranslations("Admin.withdrawals.editPayment");
  const tc = useTranslations("Admin.common");
  const [paymentMethodName, setPaymentMethodName] = React.useState(
    withdrawal.paymentMethod.name,
  );
  const [details, setDetails] = React.useState<
    Array<{ key: string; value: string }>
  >(() =>
    Object.entries(withdrawal.paymentMethod.details).map(([key, value]) => ({
      key,
      value,
    })),
  );
  const [submitting, setSubmitting] = React.useState(false);

  const canSubmit =
    paymentMethodName.trim().length > 0 &&
    details.every((entry) => entry.value.trim().length > 0);

  const submit = async () => {
    if (!canSubmit) return;

    try {
      setSubmitting(true);
      const updated = await updateAdminWithdrawalPaymentInfo(withdrawal.id, {
        paymentMethodName: paymentMethodName.trim(),
        details: Object.fromEntries(
          details.map(({ key, value }) => [key, value.trim()]),
        ),
      });
      toast.success(t("success"));
      onOpenChange(false);
      onSuccess(updated);
    } catch (error) {
      setSubmitting(false);
      toast.error(
        error instanceof Error
          ? error.message
          : t("error"),
      );
      return;
    }
    setSubmitting(false);
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!submitting) onOpenChange(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", { id: withdrawal.id })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment-method-name">{t("methodName")}</Label>
            <Input
              id="payment-method-name"
              value={paymentMethodName}
              onChange={(event) => setPaymentMethodName(event.target.value)}
              disabled={submitting}
              maxLength={255}
            />
          </div>
          {details.map((entry, index) => (
            <div className="space-y-2" key={entry.key}>
              <Label htmlFor={`payment-detail-${entry.key}`}>
                {entry.key}
              </Label>
              <Input
                id={`payment-detail-${entry.key}`}
                value={entry.value}
                onChange={(event) =>
                  setDetails((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, value: event.target.value }
                        : item,
                    ),
                  )
                }
                disabled={submitting}
              />
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            {tc("cancel")}
          </Button>
          <Button
            type="button"
            disabled={submitting || !canSubmit}
            onClick={() => void submit()}
          >
            {submitting ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Pencil />
            )}
            {tc("saveChanges")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
