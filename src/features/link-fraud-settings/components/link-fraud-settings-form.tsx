"use client";

import {
  Ban,
  Globe2,
  Loader2,
  LockKeyhole,
  Radar,
  RefreshCw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Timer,
  Users,
} from "lucide-react";
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
import { CountryCombobox } from "@/components/country-combobox";
import { Checkbox } from "@/components/ui/checkbox";
import { updateLinkFraudSettings } from "../api/link-fraud-settings.client";
import type { AdminLinkFraudSettings } from "../types";

// Bit của từng rule trong detection mask — khớp DETECTION_* ở
// stu-api/src/modules/links/fraud-bits.ts.
const DETECTION_BITS = {
  ipChange: 1 << 0,
  fastComplete: 1 << 1,
  ipReputation: 1 << 2,
  country: 1 << 3,
  bot: 1 << 4,
  rateLimit: 1 << 5,
  adBlock: 1 << 6,
  deviceDaily: 1 << 7,
  duplicateDevice: 1 << 8,
  multiAccount: 1 << 9,
} as const;

type RuleKey = keyof typeof DETECTION_BITS;

type RejectField = {
  [K in keyof AdminLinkFraudSettings]: AdminLinkFraudSettings[K] extends boolean
    ? K
    : never;
}[keyof AdminLinkFraudSettings];

const RULES: {
  key: RuleKey;
  icon: React.ElementType;
  rejectField: RejectField;
  // Khi "không tính tiền": chỉ mất doanh thu, hay mất cả view.
  dropsView: boolean;
}[] = [
  { key: "ipChange", icon: Radar, rejectField: "ipChangeCheckEnabled", dropsView: false },
  { key: "fastComplete", icon: Timer, rejectField: "fastCompleteCheckEnabled", dropsView: true },
  { key: "ipReputation", icon: ShieldAlert, rejectField: "ipReputationCheckEnabled", dropsView: false },
  { key: "country", icon: Globe2, rejectField: "countryBlockEnabled", dropsView: false },
  { key: "bot", icon: Ban, rejectField: "botUserAgentCheckEnabled", dropsView: true },
  { key: "rateLimit", icon: Radar, rejectField: "rateLimitCheckEnabled", dropsView: true },
  { key: "adBlock", icon: ShieldAlert, rejectField: "adBlockCheckEnabled", dropsView: false },
  { key: "deviceDaily", icon: Smartphone, rejectField: "deviceDailyLimitEnabled", dropsView: false },
  { key: "duplicateDevice", icon: RefreshCw, rejectField: "duplicateDeviceCheckEnabled", dropsView: true },
  { key: "multiAccount", icon: Users, rejectField: "multiAccountDeviceCheckEnabled", dropsView: false },
];

function NumberParam({
  id,
  label,
  min,
  max,
  value,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        className="h-8 w-24"
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(Number(event.target.value) || min)}
      />
    </div>
  );
}

export function LinkFraudSettingsForm({
  initialSettings,
  canUpdate,
}: {
  initialSettings: AdminLinkFraudSettings;
  canUpdate: boolean;
}) {
  const t = useTranslations("Admin.linkFraud");
  const tc = useTranslations("Admin.common");
  const locale = useLocale();
  const [saved, setSaved] = React.useState(initialSettings);
  const [settings, setSettings] = React.useState(initialSettings);
  const [saving, setSaving] = React.useState(false);
  const dirty = JSON.stringify(settings) !== JSON.stringify(saved);

  function patch(values: Partial<AdminLinkFraudSettings>) {
    setSettings((current) => ({ ...current, ...values }));
  }

  function setLogged(bit: number, logged: boolean) {
    setSettings((current) => ({
      ...current,
      detectionLogMask: logged
        ? current.detectionLogMask | bit
        : current.detectionLogMask & ~bit,
    }));
  }

  // Tham số riêng của từng rule; chỉnh được khi rule còn ít nhất một tác dụng.
  function ruleParams(key: RuleKey, active: boolean) {
    const disabled = !canUpdate || !active;
    switch (key) {
      case "fastComplete":
        return (
          <NumberParam
            id="minCompleteSeconds"
            label={t("rules.fastComplete.minSeconds")}
            min={0}
            max={300}
            value={settings.minCompleteSeconds}
            disabled={disabled}
            onChange={(value) => patch({ minCompleteSeconds: value })}
          />
        );
      case "country":
        return (
          <div className="mt-3 flex flex-col gap-1.5">
            <Label htmlFor="blockedCountryCodes" className="text-xs text-muted-foreground">
              {t("rules.country.codesLabel")}
            </Label>
            <div className="max-w-md">
              <CountryCombobox
                id="blockedCountryCodes"
                multiple
                allowAll={false}
                disabled={disabled}
                value={settings.blockedCountryCodes.split(",").filter(Boolean)}
                onChange={(codes) => patch({ blockedCountryCodes: codes.join(",") })}
              />
            </div>
          </div>
        );
      case "rateLimit":
        return (
          <NumberParam
            id="rateLimitPerMinute"
            label={t("rules.rateLimit.maxPerMinute")}
            min={1}
            max={10_000}
            value={settings.rateLimitPerMinute}
            disabled={disabled}
            onChange={(value) => patch({ rateLimitPerMinute: value })}
          />
        );
      case "deviceDaily":
        return (
          <NumberParam
            id="deviceDailyLimit"
            label={t("rules.deviceDaily.maxPerDay")}
            min={1}
            max={100_000}
            value={settings.deviceDailyLimit}
            disabled={disabled}
            onChange={(value) => patch({ deviceDailyLimit: value })}
          />
        );
      case "duplicateDevice":
        return (
          <NumberParam
            id="duplicateDeviceCooldownMinutes"
            label={t("rules.duplicateDevice.cooldown")}
            min={1}
            max={1_440}
            value={settings.duplicateDeviceCooldownMinutes}
            disabled={disabled}
            onChange={(value) => patch({ duplicateDeviceCooldownMinutes: value })}
          />
        );
      case "multiAccount":
        return (
          <NumberParam
            id="multiAccountDeviceThreshold"
            label={t("rules.multiAccount.maxAccounts")}
            min={1}
            max={1_000}
            value={settings.multiAccountDeviceThreshold}
            disabled={disabled}
            onChange={(value) => patch({ multiAccountDeviceThreshold: value })}
          />
        );
      default:
        return null;
    }
  }

  async function save() {
    try {
      setSaving(true);
      const updated = await updateLinkFraudSettings({
        ipChangeCheckEnabled: settings.ipChangeCheckEnabled,
        fastCompleteCheckEnabled: settings.fastCompleteCheckEnabled,
        minCompleteSeconds: settings.minCompleteSeconds,
        ipReputationCheckEnabled: settings.ipReputationCheckEnabled,
        countryBlockEnabled: settings.countryBlockEnabled,
        blockedCountryCodes: settings.blockedCountryCodes
          .split(",")
          .map((code) => code.trim().toUpperCase())
          .filter(Boolean)
          .join(","),
        botUserAgentCheckEnabled: settings.botUserAgentCheckEnabled,
        rateLimitCheckEnabled: settings.rateLimitCheckEnabled,
        rateLimitPerMinute: settings.rateLimitPerMinute,
        adBlockCheckEnabled: settings.adBlockCheckEnabled,
        deviceDailyLimitEnabled: settings.deviceDailyLimitEnabled,
        deviceDailyLimit: settings.deviceDailyLimit,
        duplicateDeviceCheckEnabled: settings.duplicateDeviceCheckEnabled,
        duplicateDeviceCooldownMinutes: settings.duplicateDeviceCooldownMinutes,
        multiAccountDeviceCheckEnabled: settings.multiAccountDeviceCheckEnabled,
        multiAccountDeviceThreshold: settings.multiAccountDeviceThreshold,
        detectionLogMask: settings.detectionLogMask,
      });
      setSettings(updated);
      setSaved(updated);
      toast.success(t("saveSuccess"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("saveFailed"),
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
            <Badge variant={dirty ? "secondary" : "outline"}>
              {dirty ? t("dirty") : t("synced")}
            </Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("lastUpdated", { date: new Date(settings.updatedAt).toLocaleString(locale) })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!dirty || saving}
            onClick={() => setSettings(saved)}
          >
            {t("undo")}
          </Button>
          <Button
            type="button"
            disabled={!canUpdate || !dirty || saving}
            onClick={() => void save()}
          >
            {saving ? <Loader2 className="animate-spin" /> : <Save />} {tc("saveChanges")}
          </Button>
        </div>
      </div>

      {!canUpdate ? (
        <Alert>
          <LockKeyhole />
          <AlertTitle>{t("readOnlyTitle")}</AlertTitle>
          <AlertDescription>
            {t("readOnlyDescription")}
          </AlertDescription>
        </Alert>
      ) : null}

      <Alert>
        <ShieldCheck />
        <AlertTitle>{t("maskAlertTitle")}</AlertTitle>
        <AlertDescription>
          {t("maskAlertDescription")}
        </AlertDescription>
      </Alert>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>{t("list.title")}</CardTitle>
          <CardDescription>{t("list.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="hidden grid-cols-[minmax(0,1fr)_7rem_7rem] gap-4 border-b pb-2 text-xs font-medium text-muted-foreground sm:grid">
            <span>{t("list.rule")}</span>
            <span className="text-center">{t("list.log")}</span>
            <span className="text-center">{t("list.reject")}</span>
          </div>
          <ul className="divide-y">
            {RULES.map(({ key, icon: Icon, rejectField, dropsView }) => {
              const bit = DETECTION_BITS[key];
              const rejected = settings[rejectField];
              // Không tính tiền thì luôn kèm ghi log.
              const logged = rejected || (settings.detectionLogMask & bit) !== 0;
              const name = t(`names.${key}`);
              return (
                <li
                  key={key}
                  className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_7rem_7rem] sm:gap-4"
                >
                  <div className="flex min-w-0 gap-3">
                    <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-md border bg-muted/30 text-muted-foreground">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{name}</p>
                        <Badge variant="outline" className="font-normal">
                          {dropsView
                            ? t("effects.viewAndRevenue")
                            : t("effects.revenue")}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {t(`rules.${key}.description`)}
                      </p>
                      {ruleParams(key, logged || rejected)}
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm sm:justify-center sm:self-start sm:pt-2">
                    <Checkbox
                      checked={logged}
                      disabled={!canUpdate || rejected}
                      aria-label={t("list.logAria", { rule: name })}
                      onCheckedChange={(value) => setLogged(bit, value === true)}
                    />
                    <span className="sm:hidden">{t("list.log")}</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm sm:justify-center sm:self-start sm:pt-2">
                    <Checkbox
                      checked={rejected}
                      disabled={!canUpdate}
                      aria-label={t("list.rejectAria", { rule: name })}
                      onCheckedChange={(value) => {
                        patch({ [rejectField]: value === true });
                        if (value === true) setLogged(bit, true);
                      }}
                    />
                    <span className="sm:hidden">{t("list.reject")}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
