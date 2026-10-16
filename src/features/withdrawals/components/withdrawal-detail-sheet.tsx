"use client";

import {
  CircleDollarSign,
  LoaderCircle,
  Pencil,
  UserRound,
  XCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { WithdrawalIpScanPanel } from "@/features/ip-reputation/components/withdrawal-ip-scan-panel";
import { getAdminWithdrawal } from "@/features/withdrawals/api/withdrawals.client";
import type { AdminWithdrawal } from "@/features/withdrawals/types";
import {
  formatWithdrawalDate,
  formatWithdrawalMoney,
  getWithdrawalStatusOption,
} from "@/features/withdrawals/withdrawal-status";
import { cn } from "@/lib/utils";

export function WithdrawalDetailSheet({
  withdrawal,
  onOpenChange,
  canEdit = false,
  onEdit,
}: {
  withdrawal: AdminWithdrawal;
  onOpenChange: (open: boolean) => void;
  canEdit?: boolean;
  onEdit?: (withdrawal: AdminWithdrawal) => void;
}) {
  const t = useTranslations("Admin.withdrawals.detail");
  const tc = useTranslations("Admin.withdrawals");
  const locale = useLocale();
  const [detail, setDetail] = React.useState<AdminWithdrawal>(withdrawal);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;

    void getAdminWithdrawal(withdrawal.id)
      .then((record) => {
        if (active) setDetail(record);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : t("loadError"),
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [withdrawal, t]);

  const status = getWithdrawalStatusOption(detail.status);
  const showEdit =
    canEdit &&
    Boolean(onEdit) &&
    (detail.status === "pending" || detail.status === "processing");

  return (
    <Sheet
      open
      onOpenChange={onOpenChange}
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="border-b p-6">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div>
              <SheetTitle>{t("title", { id: withdrawal.id })}</SheetTitle>
              <SheetDescription>
                {t("subtitle")}
              </SheetDescription>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "whitespace-nowrap font-medium",
                status.badgeClassName,
              )}
            >
              <span
                className={cn("size-1.5 rounded-full", status.dotClassName)}
              />
              {tc(status.labelKey)}
            </Badge>
          </div>
        </SheetHeader>

        <div className="space-y-6 px-6 pb-8">
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <LoaderCircle className="size-3.5 animate-spin" />
                {t("syncing")}
              </div>
            ) : null}
            {error ? (
              <Alert variant="destructive">
                <XCircle />
                <AlertTitle>{t("syncFailed")}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <section className="rounded-xl border bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <UserRound className="size-4 text-muted-foreground" />
                {t("member")}
              </div>
              <p className="mt-3 font-medium">{detail.user.name}</p>
              <p className="text-sm text-muted-foreground">
                {detail.user.email}
              </p>
            </section>

            <section>
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <CircleDollarSign className="size-4 text-muted-foreground" />
                {t("requestValue")}
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-3">
                <AmountItem
                  label={t("amount")}
                  value={detail.amount}
                  currency={detail.currency}
                />
                <AmountItem
                  label={t("fee")}
                  value={detail.feeAmount}
                  currency={detail.currency}
                />
                <div className="rounded-lg border bg-background p-3">
                  <dt className="text-xs text-muted-foreground">{t("withdrawalType")}</dt>
                  <dd className="mt-1 font-medium">
                    {detail.withdrawalType === "fast"
                      ? t("typeFast", { rate: detail.fastFeeRate })
                      : t("typeNormal")}
                  </dd>
                </div>
                <AmountItem
                  label={t("netAmount")}
                  value={detail.netAmount}
                  currency={detail.currency}
                  className="col-span-2"
                  prominent
                />
              </dl>
            </section>

            <section>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium">
                  {detail.paymentMethod.name}
                </h3>
                {showEdit ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit?.(detail)}
                  >
                    <Pencil /> {t("edit")}
                  </Button>
                ) : null}
              </div>
              <dl className="mt-3 divide-y rounded-xl border bg-muted/20 px-4">
                {Object.entries(detail.paymentMethod.details).map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-4 py-3 text-sm"
                    >
                      <dt className="text-muted-foreground">{key}</dt>
                      <dd className="break-all text-right font-medium">
                        {value}
                      </dd>
                    </div>
                  ),
                )}
              </dl>
            </section>

            {detail.trafficSource ? (
              <section>
                <h3 className="text-sm font-medium">{t("trafficSource")}</h3>
                <p className="mt-3 whitespace-pre-wrap rounded-xl border bg-muted/20 p-4 text-sm leading-6">
                  {detail.trafficSource}
                </p>
              </section>
            ) : null}

            {detail.statusReason ? (
              <Alert variant="destructive">
                <XCircle />
                <AlertTitle>{t("rejectionReason")}</AlertTitle>
                <AlertDescription>{detail.statusReason}</AlertDescription>
              </Alert>
            ) : null}

            <section>
              <WithdrawalIpScanPanel userId={detail.user.id} />
            </section>

            <section>
              <h3 className="text-sm font-medium">{t("history")}</h3>
              <dl className="mt-3 divide-y rounded-xl border px-4 text-sm">
                <DetailRow
                  label={t("createdAt")}
                  value={formatWithdrawalDate(detail.createdAt, locale)}
                />
                <DetailRow
                  label={t("processedBy")}
                  value={detail.processedBy?.name ?? "—"}
                />
                <DetailRow
                  label={t("processedAt")}
                  value={formatWithdrawalDate(detail.processedAt, locale)}
                />
                <DetailRow
                  label={t("updatedAt")}
                  value={formatWithdrawalDate(detail.updatedAt, locale)}
                />
              </dl>
            </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AmountItem({
  label,
  value,
  currency,
  prominent,
  className,
}: {
  label: string;
  value: string;
  currency: string;
  prominent?: boolean;
  className?: string;
}) {
  const locale = useLocale();
  return (
    <div className={cn("rounded-xl border bg-card p-4", className)}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "mt-1 font-medium tabular-nums",
          prominent && "text-lg font-semibold",
        )}
      >
        {formatWithdrawalMoney(value, currency, locale)}
      </dd>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
