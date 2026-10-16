import { AlertCircle, Clock3, Crown, LoaderCircle, Zap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/member/fields/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemberCurrency } from "@/features/currencies/components/member-currency-provider";

import type { WithdrawalController } from "./use-withdrawal-controller";

function WithdrawalTypeSelector({
  controller,
}: {
  controller: WithdrawalController;
}) {
  const t = useTranslations("Withdraw");
  const { data, withdrawalType, submitting, setWithdrawalType } = controller;
  if (!data) return null;

  const options = [
    {
      value: "standard" as const,
      icon: Clock3,
      label: t("types.standard.label"),
      estimate: t("types.standard.estimate"),
      fee: t("types.standard.fee"),
      disabled: false,
      freeBadge: null as string | null,
    },
    {
      value: "fast" as const,
      icon: Zap,
      label: t("types.fast.label"),
      estimate: t("types.fast.estimate"),
      fee:
        data.fastWithdrawal.freeRemaining > 0
          ? t("types.fast.freeFee", {
              remaining: data.fastWithdrawal.freeRemaining,
              total: data.fastWithdrawal.freePerMonth,
            })
          : t("types.fast.fee", { rate: data.fastWithdrawal.feeRate }),
      disabled: !data.fastWithdrawal.enabled,
      // Loyalty perk: free fast withdrawals left this month.
      freeBadge:
        data.fastWithdrawal.enabled && data.fastWithdrawal.freeRemaining > 0
          ? t("types.fast.freeBadge", {
              remaining: data.fastWithdrawal.freeRemaining,
              total: data.fastWithdrawal.freePerMonth,
            })
          : null,
    },
  ];

  return (
    <div className="grid gap-2">
      <Label>{t("form.withdrawalTypeLabel")}</Label>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const Icon = option.icon;
          const selected = withdrawalType === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              disabled={submitting || option.disabled}
              onClick={() => setWithdrawalType(option.value)}
              className={`rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "bg-muted/[0.12] hover:bg-muted/30"
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Icon className="size-4" />
                  {option.label}
                </span>
                {option.freeBadge ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-300/70 bg-gradient-to-r from-amber-50 to-yellow-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 tabular-nums dark:border-amber-500/30 dark:from-amber-500/10 dark:to-yellow-500/10 dark:text-amber-300">
                    <Crown className="size-3" aria-hidden="true" />
                    {option.freeBadge}
                  </span>
                ) : null}
              </span>
              <span className="mt-2 block text-xs text-muted-foreground">
                {option.estimate}
              </span>
              <span
                className={`mt-1 block text-xs ${
                  option.freeBadge
                    ? "font-medium text-amber-700 dark:text-amber-300"
                    : "text-muted-foreground"
                }`}
              >
                {option.disabled ? t("types.fast.disabled") : option.fee}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const QUICK_WITHDRAWAL_VND_AMOUNTS = [
  100_000,
  200_000,
  500_000,
  1_000_000,
  2_000_000,
] as const;

export function AmountInput({ controller }: { controller: WithdrawalController }) {
  const locale = useLocale();
  const t = useTranslations("Withdraw");
  const { convertCurrency } = useMemberCurrency();
  const {
    data,
    amount,
    amountInput,
    selectedMethod,
    validationError,
    submitting,
    setAmount,
    setMaximumAmount,
    formatCurrency,
  } = controller;
  if (!data) return null;

  const maximumAmount = Math.max(
    0,
    Math.min(
      data.availableBalance,
      data.limits.maximum,
      data.limits.remaining ?? Number.POSITIVE_INFINITY,
    ),
  );
  const minimumAmount = selectedMethod?.minimumAmount ?? data.limits.minimum;
  const quickAmounts = QUICK_WITHDRAWAL_VND_AMOUNTS.map((vndAmount) => ({
    amount: Math.max(
      1,
      Math.round(convertCurrency(vndAmount, "VND", data.currency)),
    ),
    vndAmount,
  }));
  const currencySymbol =
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: data.currency,
      currencyDisplay: "narrowSymbol",
    })
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value ?? data.currency;

  return (
    <div className="grid gap-2">
      <Label htmlFor="withdrawal-amount">{t("form.amountLabel")}</Label>
      <div className="relative">
        <Input
          id="withdrawal-amount"
          name="amount"
          inputMode="numeric"
          autoComplete="off"
          placeholder="0"
          value={amountInput}
          disabled={submitting}
          aria-invalid={Boolean(validationError)}
          aria-describedby={validationError ? "withdrawal-amount-error" : "withdrawal-amount-help"}
          onChange={(event) => setAmount(event.target.value)}
          className="pr-12 font-medium tabular-nums"
        />
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-medium text-muted-foreground">{currencySymbol}</span>
      </div>
     <div
  className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3"
  aria-label={t("form.quickAmountAria")}
>
  {quickAmounts.map((option) => (
    <Button
      key={option.vndAmount}
      type="button"
      variant={amount === option.amount ? "default" : "outline"}
      size="sm"
      className="w-full tabular-nums"
      disabled={
        submitting ||
        option.amount < minimumAmount ||
        option.amount > maximumAmount
      }
      aria-pressed={amount === option.amount}
      onClick={() => setAmount(String(option.amount))}
    >
      {formatCurrency(option.amount)}
    </Button>
  ))}

  <Button
    type="button"
    variant={
      maximumAmount > 0 && amount === maximumAmount
        ? "default"
        : "outline"
    }
    size="sm"
    className="w-full"
    disabled={submitting || maximumAmount <= 0}
    aria-pressed={maximumAmount > 0 && amount === maximumAmount}
    onClick={setMaximumAmount}
  >
    {t("form.maximum")}
  </Button>
</div>
      <div id="withdrawal-amount-help" className="flex min-h-6 items-center text-xs text-muted-foreground">
        <span>{t("form.availableBalance")}: <span className="font-medium tabular-nums text-foreground">{formatCurrency(data.availableBalance)}</span></span>
      </div>
      {validationError ? <p id="withdrawal-amount-error" className="flex items-center gap-1.5 text-sm text-destructive"><AlertCircle className="size-4" />{validationError}</p> : null}
    </div>
  );
}

export function WithdrawalBreakdown({ controller }: { controller: WithdrawalController }) {
  const t = useTranslations("Withdraw");
  const { amount, estimate, estimateLoading, formatCurrency } = controller;
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">{t("amounts.requested")}</span><span className="font-medium tabular-nums">{formatCurrency(amount)}</span></div>
      <div className="flex min-h-5 items-center justify-between gap-4">
        <span className="text-muted-foreground">{t("amounts.fee")}</span>
        {estimateLoading ? <Skeleton className="h-4 w-20" /> : estimate?.feeAmount != null ? <span className="font-medium tabular-nums">{formatCurrency(estimate.feeAmount)}</span> : <span className="max-w-xs text-right text-xs text-muted-foreground">{t("amounts.feePending")}</span>}
      </div>
      {estimate?.fastFeeAmount ? (
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="text-muted-foreground">
            {t("amounts.fastFee", { rate: estimate.fastFeeRate })}
          </span>
          <span className="tabular-nums text-muted-foreground">
            {formatCurrency(estimate.fastFeeAmount)}
          </span>
        </div>
      ) : null}
      <Separator />
      <div className="flex items-center justify-between gap-4"><span className="font-medium">{t("amounts.net")}</span><span className="text-base font-semibold tabular-nums text-foreground">{estimate?.netAmount != null ? formatCurrency(estimate.netAmount) : "—"}</span></div>
    </div>
  );
}

export function WithdrawalForm({ controller }: { controller: WithdrawalController }) {
  const t = useTranslations("Withdraw");
  const { data, selectedMethod, submitting, submitError, formEligible, formValid, requestConfirmation, formatCurrency } = controller;
  if (!data) return null;

  if (!data.payoutMethods.length) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-black/[0.025]">
      <div className="border-b border-border/80 px-5 py-5 sm:px-6">
        <h2 className="text-base font-semibold tracking-[-0.015em] sm:text-[17px]">{t("form.title")}</h2>
      </div>
      <form className="space-y-5 p-5 sm:p-6" onSubmit={(event) => { event.preventDefault(); requestConfirmation(); }}>
        <WithdrawalTypeSelector controller={controller} />
        <AmountInput controller={controller} />
        {selectedMethod ? (
          <div className="grid gap-2">
            <Label>{t("form.methodLabel")}</Label>
            <div className="rounded-xl border border-border bg-muted/[0.16] px-4 py-3">
              <p className="text-sm font-medium">{selectedMethod.provider} {selectedMethod.accountIdentifier}</p>
              <p className="mt-1 text-xs text-muted-foreground">{selectedMethod.accountHolder} · {t("form.methodFee", { fee: formatCurrency(selectedMethod.withdrawFee) })}</p>
            </div>
          </div>
        ) : null}
        <div className="rounded-xl border border-border bg-muted/[0.18] p-4"><WithdrawalBreakdown controller={controller} /></div>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock3 className="size-4" />
          {t("form.processingEstimate", {
            time: t(`types.${controller.withdrawalType}.estimate`),
          })}
        </p>
        {submitError ? <Alert variant="destructive"><AlertCircle /><AlertTitle>{t("errors.createTitle")}</AlertTitle><AlertDescription>{submitError}</AlertDescription></Alert> : null}
        <Button type="submit" className="h-11 w-full sm:w-auto sm:min-w-36" disabled={!formValid || submitting || !formEligible}>
          {submitting ? <><LoaderCircle className="animate-spin" />{t("actions.submitting")}</> : t("actions.withdraw")}
        </Button>
      </form>
    </section>
  );
}
