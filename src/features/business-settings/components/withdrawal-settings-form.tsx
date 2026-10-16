"use client";

import {
  ArrowRight,
  BadgeDollarSign,
  Banknote,
  CirclePause,
  FileSearch,
  Loader2,
  LockKeyhole,
  Save,
  WalletCards,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { updateWithdrawalSettings } from "../api/business-settings.client";
import type { AdminWithdrawalSettings } from "../types";
import { clearBusinessConfigCache } from "../use-business-config";

export function WithdrawalSettingsForm({
  initialSettings,
  canUpdate,
}: {
  initialSettings: AdminWithdrawalSettings;
  canUpdate: boolean;
}) {
  const t = useTranslations("Admin.businessSettings.withdrawal");
  const tb = useTranslations("Admin.businessSettings");
  const tc = useTranslations("Admin.common");
  const locale = useLocale();
  const [saved, setSaved] = React.useState(initialSettings);
  const [settings, setSettings] = React.useState(initialSettings);
  const [saving, setSaving] = React.useState(false);
  const dirty =
    settings.withdrawalCurrencyCode !== saved.withdrawalCurrencyCode ||
    settings.withdrawalsPaused !== saved.withdrawalsPaused ||
    settings.requireWithdrawalTrafficSource !==
      saved.requireWithdrawalTrafficSource ||
    settings.fastWithdrawalEnabled !== saved.fastWithdrawalEnabled ||
    settings.fastWithdrawalFeeRate !== saved.fastWithdrawalFeeRate;
  const activeCurrencies = settings.currencies.filter(
    (currency) => currency.isActive,
  );
  const fastFeeRate = Number(settings.fastWithdrawalFeeRate);
  const fastFeeRateValid =
    settings.fastWithdrawalFeeRate.trim() !== "" &&
    Number.isFinite(fastFeeRate) &&
    fastFeeRate >= 0 &&
    fastFeeRate <= 100;

  React.useEffect(() => {
    const protect = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    const protectNavigation = (event: MouseEvent) => {
      if (!dirty) return;
      const anchor =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (!anchor || anchor.target === "_blank") return;
      const destination = new URL(anchor.href, window.location.href);
      if (
        destination.origin === window.location.origin &&
        destination.pathname === window.location.pathname
      ) {
        return;
      }
      if (!window.confirm(tb("unsavedChangesConfirm"))) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", protect);
    document.addEventListener("click", protectNavigation, true);
    return () => {
      window.removeEventListener("beforeunload", protect);
      document.removeEventListener("click", protectNavigation, true);
    };
  }, [dirty, tb]);

  async function save() {
    try {
      setSaving(true);
      const updated = await updateWithdrawalSettings({
        withdrawalCurrencyCode: settings.withdrawalCurrencyCode,
        withdrawalsPaused: settings.withdrawalsPaused,
        requireWithdrawalTrafficSource:
          settings.requireWithdrawalTrafficSource,
        fastWithdrawalEnabled: settings.fastWithdrawalEnabled,
        fastWithdrawalFeeRate: settings.fastWithdrawalFeeRate,
      });
      clearBusinessConfigCache();
      setSettings(updated);
      setSaved(updated);
      toast.success(t("saveSuccess"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tb("saveFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={settings.withdrawalsPaused ? "destructive" : "secondary"}
            >
              {settings.withdrawalsPaused
                ? t("statusPaused")
                : t("statusAccepting")}
            </Badge>
            <Badge variant={dirty ? "secondary" : "outline"}>
              {dirty ? tb("dirty") : tb("synced")}
            </Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {tb("lastUpdated", { date: new Date(settings.updatedAt).toLocaleString(locale) })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!dirty || saving}
            onClick={() => setSettings(saved)}
          >
            {tb("undo")}
          </Button>
          <Button
            type="button"
            disabled={!canUpdate || !dirty || saving || !fastFeeRateValid}
            onClick={() => void save()}
          >
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            {tc("saveChanges")}
          </Button>
        </div>
      </div>

      {!canUpdate ? (
        <Alert>
          <LockKeyhole />
          <AlertTitle>{tb("readOnlyTitle")}</AlertTitle>
          <AlertDescription>
            {t("readOnlyDescription")}
          </AlertDescription>
        </Alert>
      ) : null}

      {settings.withdrawalsPaused ? (
        <Alert variant="destructive">
          <CirclePause />
          <AlertTitle>{t("lockedTitle")}</AlertTitle>
          <AlertDescription>
            {t("lockedDescription")}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <SettingsCard
            title={t("intakeTitle")}
            description={t("intakeDescription")}
          >
            <SettingSwitch
              label={t("allowLabel")}
              description={t("allowDescription")}
              checked={!settings.withdrawalsPaused}
              onCheckedChange={(enabled) =>
                setSettings((current) => ({
                  ...current,
                  withdrawalsPaused: !enabled,
                }))
              }
              dangerous={!settings.withdrawalsPaused}
            />
            <SettingSwitch
              label={t("trafficSourceLabel")}
              description={t("trafficSourceDescription")}
              checked={settings.requireWithdrawalTrafficSource}
              onCheckedChange={(checked) =>
                setSettings((current) => ({
                  ...current,
                  requireWithdrawalTrafficSource: checked,
                }))
              }
            />
          </SettingsCard>

          <SettingsCard
            title={t("fastTitle")}
            description={t("fastDescription")}
          >
            <SettingSwitch
              label={t("fastAllowLabel")}
              description={t("fastAllowDescription")}
              checked={settings.fastWithdrawalEnabled}
              onCheckedChange={(fastWithdrawalEnabled) =>
                setSettings((current) => ({
                  ...current,
                  fastWithdrawalEnabled,
                }))
              }
            />
            <div className="space-y-2">
              <Label htmlFor="fast-withdrawal-fee">{t("fastFeeLabel")}</Label>
              <div className="relative max-w-xs">
                <Input
                  id="fast-withdrawal-fee"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step={0.01}
                  value={settings.fastWithdrawalFeeRate}
                  disabled={!settings.fastWithdrawalEnabled}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      fastWithdrawalFeeRate: event.target.value,
                    }))
                  }
                  className="pr-10"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                  %
                </span>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                {t("fastFeeHint")}
              </p>
              {!fastFeeRateValid ? (
                <p className="text-xs text-destructive">
                  {t("fastFeeInvalid")}
                </p>
              ) : null}
            </div>
          </SettingsCard>

          <SettingsCard
            title={t("payoutCurrencyTitle")}
            description={t("payoutCurrencyDescription")}
          >
            <div className="space-y-2">
              <Label htmlFor="withdrawal-currency">{t("withdrawalCurrencyLabel")}</Label>
              <Select
                value={settings.withdrawalCurrencyCode}
                onValueChange={(withdrawalCurrencyCode) =>
                  setSettings((current) => ({
                    ...current,
                    withdrawalCurrencyCode,
                  }))
                }
              >
                <SelectTrigger id="withdrawal-currency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activeCurrencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} — {currency.name} ({currency.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs leading-5 text-muted-foreground">
                {t("currencyHint")}
              </p>
            </div>
          </SettingsCard>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <WalletCards className="size-4" />
                {t("feesCardTitle")}
              </CardTitle>
              <CardDescription>
                {t("feesCardDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link href="/admin/payment-methods">
                  {t("manageMethods")}
                  <ArrowRight />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("goToTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <QuickLink
                href="/admin/withdrawals"
                icon={<FileSearch />}
                label={t("linkRequests")}
              />
              <QuickLink
                href="/admin/settings/currencies"
                icon={<Banknote />}
                label={t("linkCurrencies")}
              />
              <QuickLink
                href="/admin/payment-methods"
                icon={<BadgeDollarSign />}
                label={t("linkPaymentMethods")}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}

function SettingSwitch({
  label,
  description,
  checked,
  onCheckedChange,
  dangerous = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  dangerous?: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-5 rounded-lg border p-4 ${
        dangerous && !checked
          ? "border-destructive/40 bg-destructive/5"
          : "bg-muted/10"
      }`}
    >
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Button variant="ghost" className="w-full justify-start" asChild>
      <Link href={href}>
        {icon}
        {label}
      </Link>
    </Button>
  );
}
