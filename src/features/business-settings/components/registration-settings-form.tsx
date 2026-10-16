"use client";

import { Gift, Loader2, LockKeyhole, Save, UserPlus, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updateRegistrationSettings } from "../api/business-settings.client";
import type { AdminRegistrationSettings } from "../types";

type AmountKey = "signupBonusAmount" | "referralSignupBonusAmount" | "referrerSignupBonusAmount";

const AMOUNT_PATTERN = /^\d{1,12}(?:\.\d{1,2})?$/;
const AMOUNT_KEYS: AmountKey[] = ["signupBonusAmount", "referralSignupBonusAmount", "referrerSignupBonusAmount"];

export function RegistrationSettingsForm({
  initialSettings,
  canUpdate,
}: {
  initialSettings: AdminRegistrationSettings;
  canUpdate: boolean;
}) {
  const t = useTranslations("Admin.businessSettings.registration");
  const tb = useTranslations("Admin.businessSettings");
  const tc = useTranslations("Admin.common");
  const locale = useLocale();
  const [saved, setSaved] = React.useState(initialSettings);
  const [settings, setSettings] = React.useState(initialSettings);
  const [saving, setSaving] = React.useState(false);

  const dirty = AMOUNT_KEYS.some((key) => normalize(settings[key]) !== normalize(saved[key]));
  const invalid = AMOUNT_KEYS.filter((key) => !AMOUNT_PATTERN.test(settings[key].trim()));
  const money = (value: string) => formatMoney(value, settings.currencyCode, locale);

  React.useEffect(() => {
    const protect = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", protect);
    return () => window.removeEventListener("beforeunload", protect);
  }, [dirty]);

  async function save() {
    try {
      setSaving(true);
      const updated = await updateRegistrationSettings({
        signupBonusAmount: settings.signupBonusAmount.trim(),
        referralSignupBonusAmount: settings.referralSignupBonusAmount.trim(),
        referrerSignupBonusAmount: settings.referrerSignupBonusAmount.trim(),
      });
      setSettings(updated);
      setSaved(updated);
      toast.success(t("saveSuccess"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tb("saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  const field = (key: AmountKey, id: string) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{t(`${key}.label`)}</Label>
      <div className="relative max-w-xs">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          step={0.01}
          value={settings[key]}
          disabled={!canUpdate}
          aria-invalid={invalid.includes(key)}
          onChange={(event) => setSettings((current) => ({ ...current, [key]: event.target.value }))}
          className="pr-16"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
          {settings.currencyCode}
        </span>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">{t(`${key}.hint`)}</p>
      {invalid.includes(key) ? <p className="text-xs text-destructive">{t("invalidAmount")}</p> : null}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <Badge variant={dirty ? "secondary" : "outline"}>{dirty ? tb("dirty") : tb("synced")}</Badge>
          <p className="mt-2 text-xs text-muted-foreground">
            {tb("lastUpdated", { date: new Date(settings.updatedAt).toLocaleString(locale) })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={!dirty || saving} onClick={() => setSettings(saved)}>
            {tb("undo")}
          </Button>
          <Button
            type="button"
            disabled={!canUpdate || !dirty || saving || invalid.length > 0}
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
          <AlertDescription>{tb("readOnlyDescription")}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserPlus className="size-4" />{t("signupTitle")}</CardTitle>
              <CardDescription>{t("signupDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">{field("signupBonusAmount", "signup-bonus")}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="size-4" />{t("referralTitle")}</CardTitle>
              <CardDescription>{t("referralDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {field("referralSignupBonusAmount", "referral-signup-bonus")}
              {field("referrerSignupBonusAmount", "referrer-signup-bonus")}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Gift className="size-4" />{t("previewTitle")}</CardTitle>
              <CardDescription>{t("previewDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="font-medium">{t("previewSignup")}</p>
                <p className="mt-1 text-muted-foreground">
                  {t("previewNewMember", { amount: money(settings.signupBonusAmount) })}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="font-medium">{t("previewReferral")}</p>
                <p className="mt-1 text-muted-foreground">
                  {t("previewNewMember", { amount: money(settings.referralSignupBonusAmount) })}
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  {t("previewReferrer", { amount: money(settings.referrerSignupBonusAmount) })}
                </p>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">{t("previewNote")}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function normalize(value: string) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(2) : value;
}

function formatMoney(value: string, currency: string, locale: string) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(number);
  } catch {
    return `${number.toFixed(2)} ${currency}`;
  }
}
