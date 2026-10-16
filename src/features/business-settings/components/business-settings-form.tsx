"use client";

import {
  Banknote,
  CircleDollarSign,
  FileUp,
  Loader2,
  LockKeyhole,
  Save,
  Settings2,
  ShieldAlert,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { updateBusinessSettings } from "../api/business-settings.client";
import type { AdminBusinessSettings } from "../types";
import { clearBusinessConfigCache } from "../use-business-config";

const MB = 1024 * 1024;

export function BusinessSettingsForm({
  initialSettings,
  canUpdate,
}: {
  initialSettings: AdminBusinessSettings;
  canUpdate: boolean;
}) {
  const t = useTranslations("Admin.businessSettings");
  const tc = useTranslations("Admin.common");
  const locale = useLocale();
  const [saved, setSaved] = React.useState(initialSettings);
  const [settings, setSettings] = React.useState(initialSettings);
  const [saving, setSaving] = React.useState(false);
  const dirty = JSON.stringify(settings) !== JSON.stringify(saved);
  const activeCurrencies = settings.currencies.filter((currency) => currency.isActive);
  const displayCurrency = settings.currencies.find((currency) => currency.isDefault);

  React.useEffect(() => {
    const protect = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    const protectNavigation = (event: MouseEvent) => {
      if (!dirty) return;
      const anchor = event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>("a[href]")
        : null;
      if (!anchor || anchor.target === "_blank") return;
      const destination = new URL(anchor.href, window.location.href);
      if (
        destination.origin === window.location.origin &&
        destination.pathname === window.location.pathname
      ) return;
      if (!window.confirm(t("unsavedChangesConfirm"))) {
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
  }, [dirty, t]);

  function patch(values: Partial<AdminBusinessSettings>) {
    setSettings((current) => ({ ...current, ...values }));
  }

  async function save() {
    if (
      settings.baseCurrencyCode !== saved.baseCurrencyCode &&
      !window.confirm(
        t("baseCurrencyChangeConfirm"),
      )
    ) return;
    const payload = {
      registrationEnabled: settings.registrationEnabled,
      emailVerificationRequired: settings.emailVerificationRequired,
      googleLoginEnabled: settings.googleLoginEnabled,
      baseCurrencyCode: settings.baseCurrencyCode,
      withdrawalCurrencyCode: settings.withdrawalCurrencyCode,
      referralCommissionRate: settings.referralCommissionRate,
      loyaltyWindowDays: settings.loyaltyWindowDays,
      loyaltyHistoryDays: settings.loyaltyHistoryDays,
      memberFileMaxBytes: settings.memberFileMaxBytes,
      coverImageMaxBytes: settings.coverImageMaxBytes,
      adminMediaMaxBytes: settings.adminMediaMaxBytes,
      supportAttachmentMaxBytes: settings.supportAttachmentMaxBytes,
      memberStorageQuotaBytes: settings.memberStorageQuotaBytes,
      uploadAllowedMimeTypes: settings.uploadAllowedMimeTypes,
      maintenanceMode: settings.maintenanceMode,
      withdrawalsPaused: settings.withdrawalsPaused,
      requireWithdrawalTrafficSource: settings.requireWithdrawalTrafficSource,
    };
    try {
      setSaving(true);
      const updated = await updateBusinessSettings(payload);
      clearBusinessConfigCache();
      setSettings(updated);
      setSaved(updated);
      toast.success(t("saveSuccess"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={dirty ? "secondary" : "outline"}>{dirty ? t("dirty") : t("synced")}</Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("lastUpdatedLocking", { date: new Date(settings.updatedAt).toLocaleString(locale) })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={!dirty || saving} onClick={() => setSettings(saved)}>{t("undo")}</Button>
          <Button type="button" disabled={!canUpdate || !dirty || saving} onClick={() => void save()}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />} {tc("saveChanges")}
          </Button>
        </div>
      </div>

      {!canUpdate ? (
        <Alert><LockKeyhole /><AlertTitle>{t("readOnlyTitle")}</AlertTitle><AlertDescription>{t("readOnlyDescription")}</AlertDescription></Alert>
      ) : null}

      <Tabs defaultValue="monetization" className="gap-5">
        <div className="overflow-x-auto border-b">
          <TabsList variant="line" className="min-w-max">
            <TabsTrigger value="authentication"><LockKeyhole />{t("tabs.authentication")}</TabsTrigger>
            <TabsTrigger value="monetization"><CircleDollarSign />{t("tabs.monetization")}</TabsTrigger>
            <TabsTrigger value="uploads"><FileUp />{t("tabs.uploads")}</TabsTrigger>
            <TabsTrigger value="operations"><ShieldAlert />{t("tabs.operations")}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="authentication">
          <SettingsCard title={t("auth.cardTitle")} description={t("auth.cardDescription")}>
            <SettingSwitch label={t("auth.registrationLabel")} description={t("auth.registrationDescription")} checked={settings.registrationEnabled} onCheckedChange={(value) => patch({ registrationEnabled: value })} />
            <SettingSwitch label={t("auth.emailVerificationLabel")} description={t("auth.emailVerificationDescription")} checked={settings.emailVerificationRequired} onCheckedChange={(value) => patch({ emailVerificationRequired: value })} />
            <SettingSwitch label={t("auth.googleLabel")} description={t("auth.googleDescription")} checked={settings.googleLoginEnabled} onCheckedChange={(value) => patch({ googleLoginEnabled: value })} />
            <Alert>
              <Settings2 /><AlertTitle>{t("auth.languageScopeTitle")}</AlertTitle>
              <AlertDescription>{t("auth.languageScopeDescription", { bundled: settings.uiLanguages.bundled.join(", "), fallback: settings.uiLanguages.fallbackLocale })}</AlertDescription>
            </Alert>
          </SettingsCard>
        </TabsContent>

        <TabsContent value="monetization" className="space-y-5">
          <Alert>
            <Banknote /><AlertTitle>{t("monetization.currencyRolesTitle")}</AlertTitle>
            <AlertDescription>
              <p>
                {t.rich("monetization.currencyRolesBody", {
                  code: displayCurrency?.code ?? "—",
                  strong: (chunks) => <strong>{chunks}</strong>,
                  link: (chunks) => <Link href="/admin/settings/currencies" className="font-medium underline underline-offset-4">{chunks}</Link>,
                })}
              </p>
            </AlertDescription>
          </Alert>
          <div className="grid gap-5 lg:grid-cols-2">
            <SettingsCard title={t("monetization.currencyCardTitle")} description={t("monetization.currencyCardDescription")}>
              <SelectField label={t("monetization.baseCurrencyLabel")} value={settings.baseCurrencyCode} options={activeCurrencies} onChange={(value) => patch({ baseCurrencyCode: value })} />
              <Button variant="outline" className="w-full" asChild>
                <Link href="/admin/settings/withdrawals">{t("monetization.openWithdrawalSettings")}</Link>
              </Button>
            </SettingsCard>
            <SettingsCard title={t("monetization.commissionCardTitle")} description={t("monetization.commissionCardDescription")}>
              <NumberField label={t("monetization.referralCommission")} value={Number(settings.referralCommissionRate)} min={0} max={100} step={0.01} onChange={(value) => patch({ referralCommissionRate: value.toFixed(2) })} />
              <NumberField label={t("monetization.loyaltyWindowDays")} value={settings.loyaltyWindowDays} min={1} max={365} onChange={(value) => patch({ loyaltyWindowDays: value })} />
              <NumberField label={t("monetization.loyaltyHistoryDays")} value={settings.loyaltyHistoryDays} min={1} max={365} onChange={(value) => patch({ loyaltyHistoryDays: value })} />
            </SettingsCard>
          </div>
        </TabsContent>

        <TabsContent value="uploads" className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <SettingsCard title={t("uploads.limitsTitle")} description={t("uploads.limitsDescription")}>
              <MegabyteField label={t("uploads.memberFile")} bytes={settings.memberFileMaxBytes} max={1024} onChange={(value) => patch({ memberFileMaxBytes: value })} />
              <MegabyteField label={t("uploads.coverImage")} bytes={settings.coverImageMaxBytes} max={100} onChange={(value) => patch({ coverImageMaxBytes: value })} />
              <MegabyteField label={t("uploads.adminMedia")} bytes={settings.adminMediaMaxBytes} max={100} onChange={(value) => patch({ adminMediaMaxBytes: value })} />
              <MegabyteField label={t("uploads.supportFile")} bytes={settings.supportAttachmentMaxBytes} max={100} onChange={(value) => patch({ supportAttachmentMaxBytes: value })} />
              <MegabyteField label={t("uploads.memberQuota")} bytes={settings.memberStorageQuotaBytes} max={1_048_576} onChange={(value) => patch({ memberStorageQuotaBytes: value })} />
            </SettingsCard>
            <SettingsCard title={t("uploads.mimeTitle")} description={t("uploads.mimeDescription")}>
              <Textarea
                rows={12}
                value={settings.uploadAllowedMimeTypes.join("\n")}
                onChange={(event) => patch({ uploadAllowedMimeTypes: event.target.value.split(/\s+/).map((item) => item.trim()).filter(Boolean) })}
                spellCheck={false}
                className="font-mono text-xs"
              />
            </SettingsCard>
          </div>
        </TabsContent>

        <TabsContent value="operations">
          <SettingsCard title={t("operations.cardTitle")} description={t("operations.cardDescription")}>
            <SettingSwitch tone="danger" label={t("operations.maintenanceLabel")} description={t("operations.maintenanceDescription")} checked={settings.maintenanceMode} onCheckedChange={(value) => patch({ maintenanceMode: value })} />
            <Alert>
              <Banknote />
              <AlertTitle>{t("operations.withdrawalAlertTitle")}</AlertTitle>
              <AlertDescription>
                {t.rich("operations.withdrawalAlertBody", {
                  link: (chunks) => (
                    <Link href="/admin/settings/withdrawals" className="font-medium underline underline-offset-4">
                      {chunks}
                    </Link>
                  ),
                })}
              </AlertDescription>
            </Alert>
          </SettingsCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SettingsCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent className="space-y-5">{children}</CardContent></Card>;
}

function SettingSwitch({ label, description, checked, onCheckedChange, tone }: { label: string; description: string; checked: boolean; onCheckedChange: (value: boolean) => void; tone?: "danger" }) {
  return <div className={`flex items-start justify-between gap-5 rounded-lg border p-4 ${tone === "danger" && checked ? "border-destructive/40 bg-destructive/5" : "bg-muted/10"}`}><div><Label className="text-sm font-medium">{label}</Label><p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p></div><Switch checked={checked} onCheckedChange={onCheckedChange} /></div>;
}

function NumberField({ label, value, onChange, min, max, step = 1 }: { label: string; value: number; onChange: (value: number) => void; min: number; max: number; step?: number }) {
  return <div className="space-y-2"><Label>{label}</Label><Input type="number" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} /></div>;
}

function MegabyteField({ label, bytes, max, onChange }: { label: string; bytes: number; max: number; onChange: (bytes: number) => void }) {
  return <NumberField label={label} value={bytes / MB} min={1} max={max} onChange={(value) => onChange(Math.round(value * MB))} />;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: AdminBusinessSettings["currencies"]; onChange: (value: string) => void }) {
  return <div className="space-y-2"><Label>{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{options.map((currency) => <SelectItem key={currency.code} value={currency.code}>{currency.code} — {currency.name} ({currency.symbol})</SelectItem>)}</SelectContent></Select></div>;
}
